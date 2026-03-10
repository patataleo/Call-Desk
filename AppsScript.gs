const SHEET_ID = "1d8plWxinKLHok-XasDzp_8X9mRxk1s2OeE-_qLn10v0";

function doGet(e) {
  const action = e.parameter.action;
  const agent = e.parameter.agent || "Leads";

  let result;
  if (action === "getNextLead") result = getNextLead(agent);
  else if (action === "getLeadsCount") result = getLeadsCount(agent);
  else if (action === "getTodaySales") result = getTodaySales(agent);
  else if (action === "getCallbacks") result = getCallbacks(agent);
  else if (action === "getLeadByRow")
    result = getLeadByRow(e.parameter.row, agent);
  else result = JSON.stringify({ error: "unknown action" });

  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*");
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const agent = data.agent || "Leads";

  let result;
  if (data.action === "updateLead") result = updateLead(data, agent);
  else result = JSON.stringify({ error: "unknown action" });

  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*");
}

function getNextLead(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) {
    return JSON.stringify({ error: "Sheet not found: " + sheetName });
  }
  const data = ws.getDataRange().getValues();
  const eligible = [];
  for (let i = 1; i < data.length; i++) {
    const status = (data[i][8] || "").toString().trim().toLowerCase();
    if (status === "" || status === "callback") {
      eligible.push({
        row: i + 1,
        id: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        address: data[i][3],
      });
    }
  }
  if (eligible.length === 0) {
    return JSON.stringify({ error: "No leads available" });
  }
  const pick = eligible[Math.floor(Math.random() * eligible.length)];

  // Add timestamp when lead is fetched
  const timestamp = new Date();
  ws.getRange(pick.row, 10).setValue(timestamp);

  return JSON.stringify({ success: true, lead: pick });
}

function updateLead(data, sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  ws.getRange(data.row, 5).setValue(data.province);
  ws.getRange(data.row, 6).setValue(data.city);
  ws.getRange(data.row, 7).setValue(data.barangay);
  ws.getRange(data.row, 8).setValue(data.remarks);
  ws.getRange(data.row, 9).setValue(data.callStatus);
  return JSON.stringify({ success: true });
}

function getLeadsCount(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) {
    return JSON.stringify({ dialedToday: 0, available: 0 });
  }
  const data = ws.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dialedToday = 0;
  let available = 0;

  for (let i = 1; i < data.length; i++) {
    const status = (data[i][8] || "").toString().trim().toLowerCase();
    const timestamp = data[i][9];

    // Count available leads (empty status or callback)
    if (status === "" || status === "callback") {
      available++;
    }

    // Count dialed today (has timestamp from today and not empty/callback)
    if (timestamp && status !== "" && status !== "callback") {
      const leadDate = new Date(timestamp);
      leadDate.setHours(0, 0, 0, 0);
      if (leadDate.getTime() === today.getTime()) {
        dialedToday++;
      }
    }
  }

  return JSON.stringify({ dialedToday: dialedToday, available: available });
}

function getTodaySales(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) {
    return JSON.stringify({ sales: [] });
  }
  const data = ws.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sales = [];

  for (let i = 1; i < data.length; i++) {
    const status = (data[i][8] || "").toString().trim().toLowerCase();
    const timestamp = data[i][9];

    if (status === "sales" && timestamp) {
      const leadDate = new Date(timestamp);
      leadDate.setHours(0, 0, 0, 0);

      if (leadDate.getTime() === today.getTime()) {
        sales.push({
          name: data[i][1],
          phone: data[i][2],
          address: data[i][3],
        });
      }
    }
  }

  return JSON.stringify({ sales: sales });
}

function getCallbacks(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) {
    return JSON.stringify({ callbacks: [] });
  }
  const data = ws.getDataRange().getValues();
  const callbacks = [];

  for (let i = 1; i < data.length; i++) {
    const status = (data[i][8] || "").toString().trim().toLowerCase();

    if (status === "callback") {
      callbacks.push({
        row: i + 1,
        name: data[i][1],
        phone: data[i][2],
        remarks: data[i][7],
      });
    }
  }

  return JSON.stringify({ callbacks: callbacks });
}

function getLeadByRow(row, sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const ws = ss.getSheetByName(sheetName);
  if (!ws) {
    return JSON.stringify({ error: "Sheet not found" });
  }
  const data = ws.getDataRange().getValues();
  const rowIndex = parseInt(row) - 1;

  if (rowIndex < 1 || rowIndex >= data.length) {
    return JSON.stringify({ error: "Invalid row" });
  }

  const lead = {
    row: parseInt(row),
    id: data[rowIndex][0],
    name: data[rowIndex][1],
    phone: data[rowIndex][2],
    address: data[rowIndex][3],
  };

  return JSON.stringify({ success: true, lead: lead });
}
