/**
 * Count-Garden GAS Backend
 * v2 - Added Settings persistence (Fruits & Categories)
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
  return jsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  if (action === 'saveRecord') return saveRecord(data.payload);
  if (action === 'addFruit') return addFruit(data.payload);
  if (action === 'deleteFruit') return deleteFruit(data.payload);
  if (action === 'addCategory') return addCategory(data.payload);
  if (action === 'deleteCategory') return deleteCategory(data.payload);
  if (action === 'addFarm') return addFarm(data.payload);
  if (action === 'deleteFarm') return deleteFarm(data.payload);
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
      id: recordId, date: r[1], round: r[2], fruit: r[3], totalWeight: r[4], 
      farmName: r[6] || '', // Assuming Col G for farmName
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
  const recordId = Utilities.getUuid();
  // Col A: ID, B: Date, C: Round, D: Fruit, E: TotalWeight, F: CreatedAt, G: FarmName
  recordSheet.appendRow([recordId, payload.date, payload.round, payload.fruit, payload.totalWeight, new Date(), payload.farmName || '']);
  payload.items.forEach(item => {
    itemSheet.appendRow([Utilities.getUuid(), recordId, item.category, item.weight, new Date()]);
  });
  return jsonResponse({ success: true, recordId });
}

// ... existing addFruit, deleteFruit, addCategory, deleteCategory functions ...

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

// ... existing jsonResponse function ...

function setup() {
  const SS = getSS();
  ['Fruits', 'Categories', 'Records', 'RecordItems', 'Farms'].forEach(name => {
    if (!SS.getSheetByName(name)) SS.insertSheet(name);
  });

  const fruitSheet = SS.getSheetByName('Fruits');
  if (fruitSheet.getLastRow() === 0) {
    fruitSheet.appendRow(['ID', 'Name']);
    fruitSheet.appendRow(['1', 'มะละกอ']);
    fruitSheet.appendRow(['2', 'มะม่วง']);
    fruitSheet.appendRow(['3', 'กล้วย']);
  }

  const catSheet = SS.getSheetByName('Categories');
  if (catSheet.getLastRow() === 0) {
    catSheet.appendRow(['ID', 'FruitName', 'CategoryName']);
    catSheet.appendRow(['1', 'มะละกอ', 'ยาว']);
    catSheet.appendRow(['2', 'มะละกอ', 'แหลม']);
    catSheet.appendRow(['3', 'มะละกอ', 'กลม']);
    catSheet.appendRow(['4', 'มะละกอ', 'ลาย']);
    catSheet.appendRow(['5', 'มะละกอ', 'ตั้งฉ่าย']);
    catSheet.appendRow(['6', 'มะม่วง', 'น้ำดอกไม้']);
    catSheet.appendRow(['7', 'มะม่วง', 'เขียวเสวย']);
  }

  const farmSheet = SS.getSheetByName('Farms');
  if (farmSheet.getLastRow() === 0) {
    farmSheet.appendRow(['ID', 'FarmName']);
    farmSheet.appendRow(['1', 'สวนคุณวิรัช']);
  }

  const recordSheet = SS.getSheetByName('Records');
  if (recordSheet.getLastRow() === 0) {
    recordSheet.appendRow(['RecordID', 'Date', 'Round', 'Fruit', 'TotalWeight', 'CreatedAt', 'FarmName']);
  }

  const itemSheet = SS.getSheetByName('RecordItems');
  if (itemSheet.getLastRow() === 0) {
    itemSheet.appendRow(['ItemID', 'RecordID', 'Category', 'Weight', 'CreatedAt']);
  }
}

// ฟังก์ชันดั้งเดิมที่เหลือ (addFruit, deleteFruit, addCategory, deleteCategory, jsonResponse) 
// ควรยังคงอยู่เพื่อให้ระบบทำงานได้ครบถ้วน
