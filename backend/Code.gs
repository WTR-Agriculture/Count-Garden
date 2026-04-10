/**
 * Count-Garden GAS Backend
 * v3 - Added Farm management and Hybrid Sorting support
 */

function getSS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("ไม่พบ Google Sheet!");
  return ss;
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getMasterData') return getMasterData();
  if (action === 'getHistory') return getHistory();
  if (action === 'getMasterBills') return getMasterBills();
  return jsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  if (action === 'saveRecord') return saveRecord(data.payload);
  if (action === 'deleteRound') return deleteRound(data.payload);
  if (action === 'addFruit') return addFruit(data.payload);
  if (action === 'deleteFruit') return deleteFruit(data.payload);
  if (action === 'addCategory') return addCategory(data.payload);
  if (action === 'deleteCategory') return deleteCategory(data.payload);
  if (action === 'addFarm') return addFarm(data.payload);
  if (action === 'deleteFarm') return deleteFarm(data.payload);
  if (action === 'saveMasterBill') return saveMasterBill(data.payload);
  if (action === 'updateBillingStatus') return updateBillingStatus(data.payload);
  if (action === 'deleteMasterBill') return deleteMasterBill(data.payload);
  return jsonResponse({ error: 'Invalid action' });
}

// --- READ ---
function getMasterData() {
  const SS = getSS();
  const fruitSheet = SS.getSheetByName('Fruits');
  const catSheet = SS.getSheetByName('Categories');
  const farmSheet = SS.getSheetByName('Farms');
  if (!fruitSheet || !catSheet) return jsonResponse({ error: 'Sheets not found. Run setup() first.' });

  const fruits = fruitSheet.getDataRange().getValues().slice(1);
  const cats = catSheet.getDataRange().getValues().slice(1);
  const farms = farmSheet ? farmSheet.getDataRange().getValues().slice(1).map(r => r[1]).filter(f => f) : [];

  const master = {};
  fruits.forEach(f => {
    const fruitName = f[1];
    if (fruitName) master[fruitName] = cats.filter(c => c[1] === fruitName).map(c => c[2]);
  });

  return jsonResponse({
    masterData: master,
    farms: farms
  });
}

function getHistory() {
  const SS = getSS();
  const recordSheet = SS.getSheetByName('Records');
  const itemSheet = SS.getSheetByName('RecordItems');
  if (!recordSheet || !itemSheet) return jsonResponse([]);

  const records = recordSheet.getDataRange().getValues().slice(1);
  const items = itemSheet.getDataRange().getValues().slice(1);

  const history = records.map(r => {
    const recordId = r[0];
    const recordItems = items.filter(i => i[1] === recordId);
    const detailsMap = {};
    recordItems.forEach(i => {
      const cat = i[2]; const weight = i[3];
      if (!detailsMap[cat]) detailsMap[cat] = { category: cat, total: 0, count: 0, items: [] };
      detailsMap[cat].total += weight;
      detailsMap[cat].count += 1;
      detailsMap[cat].items.push(weight);
    });
    return {
      id: recordId, 
      date: r[1], 
      round: r[2], 
      fruit: r[3], 
      totalWeight: r[4], 
      farmName: r[6] || '', 
      billingStatus: r[7] || 'Pending', // Column H
      timestamp: r[5] ? Utilities.formatDate(new Date(r[5]), "GMT+7", "HH:mm") : '',
      details: Object.values(detailsMap)
    };
  }).reverse();
  return jsonResponse(history);
}

// --- WRITE: Records ---
function saveRecord(payload) {
  const SS = getSS();
  const recordSheet = SS.getSheetByName('Records');
  const itemSheet = SS.getSheetByName('RecordItems');
  const recordId = payload.id || Utilities.getUuid();
  const now = new Date();
  
  const records = recordSheet.getDataRange().getValues();
  let existingRow = -1;
  for (let i = 1; i < records.length; i++) {
    if (records[i][0] === recordId) { existingRow = i + 1; break; }
  }

  const rowData = [
    recordId, 
    payload.date, 
    payload.round, 
    payload.fruit, 
    payload.totalWeight, 
    now, 
    payload.farmName || '',
    payload.billingStatus || 'Pending'
  ];

  if (existingRow > 0) {
    recordSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    // Clear old items
    const itemData = itemSheet.getDataRange().getValues();
    for (let i = itemData.length - 1; i >= 1; i--) {
      if (itemData[i][1] === recordId) itemSheet.deleteRow(i + 1);
    }
  } else {
    recordSheet.appendRow(rowData);
  }

  payload.items.forEach(item => {
    itemSheet.appendRow([Utilities.getUuid(), recordId, item.category, item.weight, now]);
  });
  
  return jsonResponse({ success: true, recordId });
}

function updateBillingStatus(payload) {
  const SS = getSS();
  const recordSheet = SS.getSheetByName('Records');
  const { ids, status } = payload;
  if (!ids || !status) return jsonResponse({ error: 'Missing ids or status' });

  const data = recordSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (ids.indexOf(data[i][0]) !== -1) {
      recordSheet.getRange(i + 1, 8).setValue(status); // Column H is status
    }
  }
  return jsonResponse({ success: true });
}

// Delete a single round and its items from Records/RecordItems sheets
function deleteRound(payload) {
  const SS = getSS();
  const recordSheet = SS.getSheetByName('Records');
  const itemSheet = SS.getSheetByName('RecordItems');
  const { id } = payload;
  if (!id) return jsonResponse({ error: 'id required' });

  // Delete from RecordItems first
  const itemData = itemSheet.getDataRange().getValues();
  for (let i = itemData.length - 1; i >= 1; i--) {
    if (itemData[i][1] === id) itemSheet.deleteRow(i + 1);
  }

  // Delete from Records
  const recordData = recordSheet.getDataRange().getValues();
  for (let i = recordData.length - 1; i >= 1; i--) {
    if (recordData[i][0] === id) { recordSheet.deleteRow(i + 1); break; }
  }

  return jsonResponse({ success: true });
}

// Delete a Master Bill row from MasterBills sheet
function deleteMasterBill(payload) {
  const SS = getSS();
  const masterSheet = SS.getSheetByName('MasterBills');
  if (!masterSheet) return jsonResponse({ success: true });
  const { id } = payload;
  if (!id) return jsonResponse({ error: 'id required' });

  const data = masterSheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === id) { masterSheet.deleteRow(i + 1); break; }
  }

  return jsonResponse({ success: true });
}


// --- WRITE: Master Bills ---
function saveMasterBill(payload) {
  const SS = getSS();
  let masterSheet = SS.getSheetByName('MasterBills');
  if (!masterSheet) {
    masterSheet = SS.insertSheet('MasterBills');
    masterSheet.appendRow(['MasterBillID', 'CreatedAt', 'DateFrom', 'DateTo', 'Fruit', 'TotalWeight', 'RoundCount', 'RoundIds', 'CategorySummary']);
  }
  const { id, createdAt, dateFrom, dateTo, fruit, totalWeight, roundCount, roundIds, categorySummary } = payload;
  masterSheet.appendRow([
    id,
    createdAt,
    dateFrom,
    dateTo,
    fruit || '',
    totalWeight,
    roundCount,
    JSON.stringify(roundIds),
    JSON.stringify(categorySummary)
  ]);
  return jsonResponse({ success: true });
}

// --- READ: Master Bills ---
function getMasterBills() {
  const SS = getSS();
  const masterSheet = SS.getSheetByName('MasterBills');
  if (!masterSheet) return jsonResponse([]);
  const rows = masterSheet.getDataRange().getValues().slice(1);
  const bills = rows.map(r => ({
    id: r[0],
    createdAt: r[1],
    dateFrom: r[2],
    dateTo: r[3],
    fruit: r[4] || '',
    totalWeight: r[5],
    roundCount: r[6],
    roundIds: JSON.parse(r[7] || '[]'),
    categorySummary: JSON.parse(r[8] || '{}')
  })).reverse();
  return jsonResponse(bills);
}

// --- WRITE: Settings - Fruits ---
function addFruit(payload) {
  const SS = getSS();
  const fruitSheet = SS.getSheetByName('Fruits');
  const fruitName = payload.fruitName;
  if (!fruitName) return jsonResponse({ error: 'fruitName required' });

  const existing = fruitSheet.getDataRange().getValues().slice(1);
  if (existing.find(r => r[1] === fruitName)) return jsonResponse({ success: true, message: 'Already exists' });

  const newId = existing.length + 1;
  fruitSheet.appendRow([newId.toString(), fruitName]);
  return jsonResponse({ success: true });
}

function deleteFruit(payload) {
  const SS = getSS();
  const fruitSheet = SS.getSheetByName('Fruits');
  const catSheet = SS.getSheetByName('Categories');
  const fruitName = payload.fruitName;

  const fruitData = fruitSheet.getDataRange().getValues();
  for (let i = fruitData.length - 1; i >= 1; i--) {
    if (fruitData[i][1] === fruitName) { fruitSheet.deleteRow(i + 1); break; }
  }

  const catData = catSheet.getDataRange().getValues();
  for (let i = catData.length - 1; i >= 1; i--) {
    if (catData[i][1] === fruitName) catSheet.deleteRow(i + 1);
  }
  return jsonResponse({ success: true });
}

// --- WRITE: Settings - Categories ---
function addCategory(payload) {
  const SS = getSS();
  const catSheet = SS.getSheetByName('Categories');
  const { fruitName, categoryName } = payload;
  if (!fruitName || !categoryName) return jsonResponse({ error: 'fruitName and categoryName required' });

  const existing = catSheet.getDataRange().getValues().slice(1);
  if (existing.find(r => r[1] === fruitName && r[2] === categoryName)) return jsonResponse({ success: true, message: 'Already exists' });

  const newId = existing.length + 1;
  catSheet.appendRow([newId.toString(), fruitName, categoryName]);
  return jsonResponse({ success: true });
}

function deleteCategory(payload) {
  const SS = getSS();
  const catSheet = SS.getSheetByName('Categories');
  const { fruitName, categoryName } = payload;

  const catData = catSheet.getDataRange().getValues();
  for (let i = catData.length - 1; i >= 1; i--) {
    if (catData[i][1] === fruitName && catData[i][2] === categoryName) { catSheet.deleteRow(i + 1); break; }
  }
  return jsonResponse({ success: true });
}

// --- WRITE: Settings - Farms ---
function addFarm(payload) {
  const SS = getSS();
  const farmSheet = SS.getSheetByName('Farms');
  const farmName = payload.farmName;
  if (!farmName) return jsonResponse({ error: 'farmName required' });

  const existing = farmSheet.getDataRange().getValues().slice(1);
  if (existing.find(r => r[1] === farmName)) return jsonResponse({ success: true, message: 'Already exists' });

  const newId = existing.length + 1;
  farmSheet.appendRow([newId.toString(), farmName]);
  return jsonResponse({ success: true });
}

function deleteFarm(payload) {
  const SS = getSS();
  const farmSheet = SS.getSheetByName('Farms');
  const farmName = payload.farmName;

  const farmData = farmSheet.getDataRange().getValues();
  for (let i = farmData.length - 1; i >= 1; i--) {
    if (farmData[i][1] === farmName) { farmSheet.deleteRow(i + 1); break; }
  }
  return jsonResponse({ success: true });
}

// --- UTIL ---
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  const SS = getSS();
  ['Fruits', 'Categories', 'Records', 'RecordItems', 'Farms', 'MasterBills'].forEach(name => {
    if (!SS.getSheetByName(name)) SS.insertSheet(name);
  });

  const fruitSheet = SS.getSheetByName('Fruits');
  if (fruitSheet.getLastRow() === 0) {
    fruitSheet.appendRow(['ID', 'Name']);
    fruitSheet.appendRow(['1', 'มะละกอ']);
  }

  const catSheet = SS.getSheetByName('Categories');
  if (catSheet.getLastRow() === 0) {
    catSheet.appendRow(['ID', 'FruitName', 'CategoryName']);
    catSheet.appendRow(['1', 'มะละกอ', 'ยาว']);
    catSheet.appendRow(['2', 'มะละกอ', 'แหลม']);
  }

  const farmSheet = SS.getSheetByName('Farms');
  if (farmSheet.getLastRow() === 0) {
    farmSheet.appendRow(['ID', 'FarmName']);
    farmSheet.appendRow(['1', 'สวนคุณวิรัช']);
  }

  const recordSheet = SS.getSheetByName('Records');
  if (recordSheet.getLastRow() === 0) {
    recordSheet.appendRow(['RecordID', 'Date', 'Round', 'Fruit', 'TotalWeight', 'CreatedAt', 'FarmName', 'BillingStatus']);
  }

  const itemSheet = SS.getSheetByName('RecordItems');
  if (itemSheet.getLastRow() === 0) {
    itemSheet.appendRow(['ItemID', 'RecordID', 'Category', 'Weight', 'CreatedAt']);
  }
}
