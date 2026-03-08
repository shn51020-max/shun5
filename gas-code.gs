/**
 * 研修課題５：出退勤打刻アプリ（バックエンド）
 * 
 * 設定手順:
 * 1. スプレッドシートを作成し、以下の3シートを用意:
 *    - 研修生マスタ (ID, 氏名, ステータス)
 *    - 打刻記録 (日付, ID, 氏名, 出勤, 退勤, 勤務時間)
 *    - 課題完了記録 (完了日時, ID, 氏名, URL, 判定)
 * 2. 拡張機能 > Apps Script にこのコードを貼り付け。
 * 3. デプロイ > 新しいデプロイ > 種類：ウェブアプリ、アクセス：全員。
 * 4. URLを控えて、フロントエンドの main.js に記述。
 */

const LINE_TOKEN = 'YOZ7UftinQaO3OyBDaloYu4cXzhYtLzmqBzAGNvCIJRg7h+DoqsX0n6OXdfOFZ9vI7/+VIOKgdWLHJ6yBmeAi6kPqz4+FZ3vpHQTBEAQSHA81c9tQLH/8oP8UUyRpnHxvmJ0QlaAjZWiraJeO38tBgdB04t89/1O/w1cDnyilFU=';
const LINE_GROUP_ID = 'C5a5b36e27a78ed6cfbb74839a8a9d04e';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let result = "Success";
    
    switch (data.action) {
      case 'clockIn':
        result = handleClockIn(data, ss);
        break;
      case 'clockOut':
        result = handleClockOut(data, ss);
        break;
      case 'complete':
        result = handleComplete(data, ss);
        break;
      default:
        result = "Invalid Action";
    }
    
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/** 出勤処理 */
function handleClockIn(data, ss) {
  const sheet = ss.getSheetByName('打刻記録');
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "JST", "yyyy/MM/dd");
  const timeStr = Utilities.formatDate(now, "JST", "HH:mm");
  
  // シート追記: 日付, ID, 氏名, 出勤, 退勤, 勤務時間
  sheet.appendRow([dateStr, data.userId, data.userName, timeStr, "", ""]);
  
  const msg = `【出勤】\n${data.userName}\n${dateStr} ${timeStr}`;
  sendLine(msg);
  return "Clocked In";
}

/** 退勤処理 */
function handleClockOut(data, ss) {
  const sheet = ss.getSheetByName('打刻記録');
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "JST", "yyyy/MM/dd");
  const timeStr = Utilities.formatDate(now, "JST", "HH:mm");
  
  // 最新の出勤レコード（退勤未入力のもの）を検索
  let foundRow = -1;
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][0] == dateStr && values[i][1] == data.userId && !values[i][4]) {
      foundRow = i + 1;
      break;
    }
  }
  
  if (foundRow === -1) return "No Clock-in Found";
  
  const startTimeStr = values[foundRow-1][3]; // HH:mm
  const duration = calculateDiff(startTimeStr, timeStr);
  
  // スプレッドシート更新
  sheet.getRange(foundRow, 5).setValue(timeStr); // 退勤
  sheet.getRange(foundRow, 6).setValue(duration); // 勤務時間
  
  const msg = `【退勤】\n${data.userName}\n出勤：${startTimeStr}\n退勤：${timeStr}\n勤務：${duration}`;
  sendLine(msg);
  return "Clocked Out";
}

/** 課題完了報告 */
function handleComplete(data, ss) {
  const sheet = ss.getSheetByName('課題完了記録');
  const now = new Date();
  const dateStr = Utilities.formatDate(now, "JST", "yyyy/MM/dd HH:mm");
  
  // 日時, ID, 氏名, URL, 判定
  sheet.appendRow([dateStr, data.userId, data.userName, data.appUrl, ""]);
  
  const msg = `【🎉課題完了報告🎉】\n研修生：${data.userName}（${data.userId}）\n完了：${dateStr}\n\nアプリURL:\n${data.appUrl}`;
  sendLine(msg);
  return "Completed";
}

/** LINE通知ヘルパー */
function sendLine(text) {
  const url = "https://api.line.me/v2/bot/message/push";
  const payload = {
    to: LINE_GROUP_ID,
    messages: [{ type: "text", text: text }]
  };
  const params = {
    method: "post",
    headers: { "Authorization": "Bearer " + LINE_TOKEN },
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };
  UrlFetchApp.fetch(url, params);
}

/** 時間差計算 */
function calculateDiff(start, end) {
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  let diffMin = (eH * 60 + eM) - (sH * 60 + sM);
  if (diffMin < 0) diffMin += 1440; // 0時跨ぎ
  
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}時間${m}分`;
}
