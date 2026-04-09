/**
 * Count-Garden GAS Backend
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Rename the following sheets: "Fruits", "Categories", "Records", "RecordItems".
 * 3. Go to Extensions -> Apps Script.
 * 4. Paste this code into Code.gs.
 * 5. Click "Deploy" -> "New Deployment".
 * 6. Select "Web App".
 * 7. Set "Execute as" to "Me" and "Who has access" to "Anyone".
 * 8. Copy the Web App URL and set it as VITE_GAS_URL in your React project.
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getMasterData') {
    return getMasterData();
  }
  
  if (action === 'getHistory') {
    return getHistory();
  }
  
  return jsonResponse({ error: 'Invalid action' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'saveRecord') {
    return saveRecord(data.payload);
  }
  
  return jsonResponse({ error: 'Invalid action' });
}

function getMasterData() {
  const fruitSheet = SS.getSheetByName('Fruits');
  const catSheet = SS.getSheetByName('Categories');
  
  const fruits = fruitSheet.getDataRange().getValues().slice(1);
  const cats = catSheet.getDataRange().getValues().slice(1);
  
  // Structure: { fruit: [cat1, cat2] }
  const master = {};
  fruits.forEach(f => {
    const fruitName = f[1]; // Assuming Col B is name
    master[fruitName] = cats.filter(c => c[1] === fruitName).map(c => c[2]); // Filter by fruit name, map category name
  });
  
  return jsonResponse(master);
}

function saveRecord(payload) {
  const recordSheet = SS.getSheetByName('Records');
  const itemSheet = SS.getSheetByName('RecordItems');
  
  // Append to Records
  const recordId = Utilities.getUuid();
  recordSheet.appendRow([
    recordId,
    payload.date,
    payload.round,
    payload.fruit,
    payload.totalWeight,
    new Date()
  ]);
  
  // Append to RecordItems
  payload.items.forEach(item => {
    itemSheet.appendRow([
      Utilities.getUuid(),
      recordId,
      item.category,
      item.weight,
      new Date()
    ]);
  });
  
  return jsonResponse({ success: true, recordId: recordId });
}

function getHistory() {
  const recordSheet = SS.getSheetByName('Records');
  const itemSheet = SS.getSheetByName('RecordItems');
  
  const records = recordSheet.getDataRange().getValues().slice(1);
  const items = itemSheet.getDataRange().getValues().slice(1);
  
  const history = records.map(r => {
    const recordId = r[0];
    const recordItems = items.filter(i => i[1] === recordId);
    
    // Group items by category for details
    const detailsMap = {};
    recordItems.forEach(i => {
      const cat = i[2];
      const weight = i[3];
      if (!detailsMap[cat]) {
        detailsMap[cat] = { category: cat, total: 0, count: 0, items: [] };
      }
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
      timestamp: Utilities.formatDate(new Date(r[5]), "GMT+7", "HH:mm"),
      details: Object.values(detailsMap)
    };
  }).reverse();
  
  return jsonResponse(history);
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 
 * Setup Sheets with initial data if empty
 */
function setup() {
  const sheets = ['Fruits', 'Categories', 'Records', 'RecordItems'];
  sheets.forEach(name => {
    if (!SS.getSheetByName(name)) {
      SS.insertSheet(name);
    }
  });
  
  // Seed initial fruits if empty
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
  
  const recordSheet = SS.getSheetByName('Records');
  if (recordSheet.getLastRow() === 0) {
    recordSheet.appendRow(['RecordID', 'Date', 'Round', 'Fruit', 'TotalWeight', 'CreatedAt']);
  }
  
  const itemSheet = SS.getSheetByName('RecordItems');
  if (itemSheet.getLastRow() === 0) {
    itemSheet.appendRow(['ItemID', 'RecordID', 'Category', 'Weight', 'CreatedAt']);
  }
}
