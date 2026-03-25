const SPREADSHEET_ID = "1UcojM3nRGxuyAI_q8QJZbLLQ8B7E67i3nSlvmnkAYG8";
const SHEET_NAME = "予約一覧";

const HEADER = [
  "受付日時",
  "お名前",
  "所属企業名",
  "メールアドレス",
  "相談方法",
  "第1希望",
  "第2希望",
  "第3希望",
  "相談内容"
];

const COL_PREFER1 = 6; // 「第1希望」

function doPost(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const sheet = getTargetSheet_();
    ensureHeader_(sheet);

    const row = [
      p.submittedAt || "",
      p.fullName || "",
      p.company || "",
      p.email || "",
      p.method || "",
      p.prefer1 || "",
      p.prefer2 || "",
      p.prefer3 || "",
      p.detail || ""
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput("success")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService
      .createTextOutput("error")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet() {
  try {
    const sheet = getTargetSheet_();
    ensureHeader_(sheet);
    const bookedPrefer1 = getBookedPrefer1_(sheet);

    return jsonResponse_({
      ok: true,
      bookedPrefer1: bookedPrefer1
    });
  } catch (error) {
    return jsonResponse_(
      {
        ok: false,
        message: error && error.message ? error.message : "Unexpected error"
      },
      500
    );
  }
}

function doOptions() {
  return jsonResponse_({ ok: true });
}

function getTargetSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeader_(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0];
  const hasHeader = current.some(function (v) { return String(v).trim() !== ""; });
  if (!hasHeader) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
  }
}

function getBookedPrefer1_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, COL_PREFER1, lastRow - 1, 1).getValues();
  const tz = Session.getScriptTimeZone();

  return values
    .map(function (row) {
      const v = row[0];
      if (!v) return "";
      if (Object.prototype.toString.call(v) === "[object Date]") {
        return Utilities.formatDate(v, tz, "yyyy-MM-dd'T'HH:mm");
      }
      return String(v).trim();
    })
    .filter(function (v) { return v !== ""; });
}

function jsonResponse_(obj, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  // Apps Script環境によっては setHeader が使えないため、存在確認してから設定
  if (typeof output.setHeader === "function") {
    output.setHeader("Access-Control-Allow-Origin", "*");
    output.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    output.setHeader("Access-Control-Allow-Headers", "Content-Type");
    output.setHeader("Vary", "Origin");
    if (statusCode) {
      output.setHeader("X-Status-Code", String(statusCode));
    }
  }

  return output;
}
