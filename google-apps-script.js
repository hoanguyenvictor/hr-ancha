// ═══════════════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — HR System Backend
// Paste toàn bộ file này vào Google Apps Script, sau đó Deploy
// ═══════════════════════════════════════════════════════════════════
// HƯỚNG DẪN:
// 1. Mở Google Sheets mới → Extensions → Apps Script
// 2. Xoá code mặc định, paste toàn bộ code này vào
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy URL → dán vào app Boss (tab Cài Đặt)
// ═══════════════════════════════════════════════════════════════════

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SS = SpreadsheetApp.getActiveSpreadsheet();

// Telegram config
const TG_TOKEN = '8847651571:AAHPzHQ1eAY6nzztrBoHiSBUnjoTqfDDnYU';
const TG_CHAT_ID = '7094454303';

function sendTelegramPhoto(driveUrl, caption) {
  if (!driveUrl) return;
  try {
    const match = driveUrl.match(/[?&]id=([^&]+)/);
    if (!match) return;
    const fileId = match[1];
    const blob = DriveApp.getFileById(fileId).getBlob().setName('photo.jpg').setContentType('image/jpeg');
    UrlFetchApp.fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
      method: 'post',
      payload: { chat_id: TG_CHAT_ID, caption: caption, photo: blob }
    });
  } catch(e) { Logger.log('sendTelegramPhoto error: ' + e.message); }
}

function sendTelegram(msg) {
  try {
    UrlFetchApp.fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TG_CHAT_ID, text: msg, parse_mode: 'HTML' })
    });
  } catch(e) {}
}

// Tên các sheet (tab)
const SHEETS = {
  EMPLOYEES:   'Employees',
  CHECKIN:     'Checkin',
  CHECKLIST:   'Checklist',
  SUPPLY:      'Supply',
  OVERTIME:    'Overtime',
  RETURNS:     'Returns',
  DEDUCTIONS:  'Deductions',
  SALARY:      'Salary',
  PINGS:       'Pings',
  LOGS:        'Logs',
  SCHEDULE:    'Schedule',
  PHOTOS:      'Photos',
  SUBMISSIONS:       'Submissions',
  RETURN_SUBS:       'ReturnSubmissions',
};

// ─── ENTRY POINT (GET — tránh CORS) ──────────────────────────────
function doGet(e) {
  try {
    // Ping test không có payload
    if (!e.parameter.payload) {
      return output({ ok: true, msg: 'HR System API running' });
    }

    const data = JSON.parse(e.parameter.payload);
    const action = data.action;
    let result;

    switch (action) {
      case 'login':               result = handleLogin(data); break;
      case 'getEmployees':        result = getEmployees(); break;
      case 'addEmployee':         result = addEmployee(data); break;
      case 'deleteEmployee':      result = deleteEmployee(data); break;
      case 'checkin':             result = handleCheckin(data); break;
      case 'checkout':            result = handleCheckout(data); break;
      case 'updateChecklist':     result = updateChecklist(data); break;
      case 'getTodayData':        result = getTodayData(data); break;
      case 'getTodayReports':     result = getTodayReports(data); break;
      case 'submitSupply':        result = submitSupply(data); break;
      case 'submitReturn':        result = submitReturn(data); break;
      case 'uploadPhoto':         result = uploadPhoto(data); break;
      case 'uploadChunk':         result = uploadChunk(data); break;
      case 'finalizeUpload':      result = finalizeUpload(data); break;
      case 'getPhotos':           result = getPhotos(data); break;
      case 'cleanOldPhotos':      result = cleanOldPhotos(); break;
      case 'startShift':          result = startShift(data); break;
      case 'endShift':            result = endShift(data); break;
      case 'registerOvertime':    result = registerOvertime(data); break;
      case 'approveOT':           result = approveOT(data); break;
      case 'rejectOT':            result = rejectOT(data); break;
      case 'getOvertimeList':     result = getOvertimeList(data); break;
      case 'getOvertimeRequests': result = getOvertimeRequests(data); break;
      case 'submitShiftResult':   result = submitShiftResult(data); break;
      case 'pingOk':              result = handlePing(data, true); break;
      case 'pingMiss':            result = handlePing(data, false); break;
      case 'addDeduction':        result = addDeduction(data); break;
      case 'getSalaryData':       result = getSalaryData(data); break;
      case 'saveSalesBonus':      result = saveSalesBonus(data); break;
      case 'confirmSalary':       result = confirmSalary(data); break;
      case 'getOTSummary':        result = getOTSummary(data); break;
      case 'getSalesBonus':       result = getSalesBonus(data); break;
      case 'approveDay':          result = approveDay(data); break;
      case 'registerSchedule':    result = registerSchedule(data); break;
      case 'getSchedule':         result = getSchedule(data); break;
      case 'getWeeklySchedule':   result = getWeeklySchedule(data); break;
      case 'approveShiftHours':   result = approveShiftHours(data); break;
      case 'startOTShift':        result = startOTShift(data); break;
      case 'endOTShift':          result = endOTShift(data); break;
      case 'editSchedule':        result = editSchedule(data); break;
      case 'savePenalties':       result = savePenalties(data); break;
      case 'getPenalties':        result = getPenalties(data); break;
      case 'changePassword':        result = changePassword(data); break;
      case 'createSubmission':      result = createSubmission(data); break;
      case 'getPendingSubmissions': result = getPendingSubmissions(data); break;
      case 'reviewSubmission':      result = reviewSubmission(data); break;
      case 'getMySubmissions':      result = getMySubmissions(data); break;
      case 'getMyCheckin':          result = getMyCheckin(data); break;
      case 'getMySupply':           result = getMySupply(data); break;
      case 'getAllCheckin':          result = { ok: true, data: sheetData(SHEETS.CHECKIN) }; break;
      case 'getAllSubmissions':      result = { ok: true, data: sheetData(SHEETS.SUBMISSIONS) }; break;
      case 'getAllSupply':           result = { ok: true, data: sheetData(SHEETS.SUPPLY) }; break;
      case 'getAllReturns':          result = { ok: true, data: sheetData(SHEETS.RETURN_SUBS) }; break;
      case 'getPendingReturns':     result = getPendingReturns(data); break;
      case 'confirmReturn':         result = confirmReturn(data); break;
      case 'getMyReturns':          result = getMyReturns(data); break;
      default: result = { ok: false, error: 'Unknown action: ' + action };
    }

    return output(result);

  } catch(err) {
    log('ERROR', err.toString());
    return output({ ok: false, error: err.toString() });
  }
}

function output(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Giữ doPost để tương thích
function doPost(e) { return doGet(e); }

// ─── SHEET HELPERS ────────────────────────────────────────────────
function getSheet(name) {
  let sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    initSheet(sheet, name);
  }
  return sheet;
}

function initSheet(sheet, name) {
  const headers = {
    [SHEETS.EMPLOYEES]:  ['id','name','phone','salary','color','created','passHash'],
    [SHEETS.CHECKIN]:    ['empId','date','checkinTime','checkoutTime','lat','lng','late','lateMin','approved'],
    [SHEETS.CHECKLIST]:  ['empId','date','taskId','done','doneTime'],
    [SHEETS.SUPPLY]:     ['empId','date','time','carton_nap_gap_35x25x7','carton_nap_gap_20x15x6','carton_doi_khau_40x30x20','carton_doi_khau_35x25x15','carton_doi_khau_12x12x12','hop_dong_ho','hop_vong_tay','bang_dinh','xop_60cm','xop_40cm','giay_in_don','decan_noi','decan_vanh','decan_vua','giay_nen_vua','hasAlert','reportedBy','onBehalfOf'],
    [SHEETS.SCHEDULE]:   ['empId','weekStart','day','date','shift','eveningStart','eveningEnd','plannedHours','actualHours','status'],
    [SHEETS.OVERTIME]:   ['id','empId','date','start','end','hours','plan','status','approvedBy','approvedAt','resultDesc'],
    [SHEETS.RETURNS]:    ['empId','date','time','orderId','product','qty','condition','photo'],
    [SHEETS.PHOTOS]:     ['empId','date','time','type','label','url','driveId','expires'],
    [SHEETS.DEDUCTIONS]: ['empId','month','date','reason','amount'],
    [SHEETS.SALARY]:     ['empId','month','salesBonus','confirmed','confirmedAt'],
    [SHEETS.PINGS]:       ['empId','date','time','responded'],
    [SHEETS.LOGS]:        ['ts','action','detail'],
    [SHEETS.SUBMISSIONS]:  ['id','empId','date','time','totalTasks','doneTasks','status','reviewedAt'],
    [SHEETS.RETURN_SUBS]: ['id','empId','date','time','type','orderId','amount','bankInfo','condition','photoShipper','photoActual','photoQR','count','orderIds','photoOrders','photoPancake','status','proofUrl','confirmedAt'],
  };
  if (headers[name]) sheet.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
}

function sheetData(name) {
  const sheet = getSheet(name);
  const vals = sheet.getDataRange().getValues();
  if (vals.length < 2) return [];
  const headers = vals[0];
  const tz = Session.getScriptTimeZone();
  return vals.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let v = row[i];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
      obj[h] = v;
    });
    return obj;
  });
}

function appendRow(name, obj) {
  const sheet = getSheet(name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
}

function updateRow(name, matchField, matchVal, updates) {
  const sheet = getSheet(name);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const col = headers.indexOf(matchField);
  if (col < 0) return false;
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][col]) === String(matchVal)) {
      Object.entries(updates).forEach(([k, v]) => {
        const c = headers.indexOf(k);
        if (c >= 0) sheet.getRange(i+1, c+1).setValue(v);
      });
      return true;
    }
  }
  return false;
}

function hashPass(pass) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pass)
    .map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function uid() { return Utilities.getUuid().slice(0, 8); }
function log(action, detail) {
  try { appendRow(SHEETS.LOGS, { ts: new Date().toISOString(), action, detail: String(detail).slice(0, 500) }); } catch(e) {}
}

// ─── AUTH ─────────────────────────────────────────────────────────
function handleLogin(data) {
  const { code, passHash, pass } = data;
  const employees = sheetData(SHEETS.EMPLOYEES);
  const emp = employees.find(e => e.id === code);
  if (!emp) return { ok: false, error: 'Không tìm thấy nhân viên' };
  // Nhận passHash từ client (đã hash SHA-256), hoặc hash pass cũ để tương thích
  const clientHash = passHash || hashPass(pass || '');
  if (emp.passHash !== clientHash) return { ok: false, error: 'Sai mật khẩu' };
  return { ok: true, user: { id: emp.id, name: emp.name, phone: emp.phone, color: emp.color } };
}

// ─── EMPLOYEES ────────────────────────────────────────────────────
function getEmployees() {
  const data = sheetData(SHEETS.EMPLOYEES).map(e => ({
    id: e.id, name: e.name, phone: e.phone, salary: Number(e.salary)||0, color: e.color, created: e.created
  }));
  return { ok: true, data };
}

function deleteEmployee(data) {
  const { empId } = data;
  const sheet = getSheet(SHEETS.EMPLOYEES);
  const vals = sheet.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(empId)) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Không tìm thấy nhân viên' };
}

function addEmployee(data) {
  const { emp, passHash, pass } = data;
  const existing = sheetData(SHEETS.EMPLOYEES);
  if (existing.find(e => e.id === emp.id)) return { ok: false, error: 'Mã NV đã tồn tại' };
  // Nhận passHash từ client, hoặc hash pass cũ để tương thích
  const storedHash = passHash || hashPass(pass || '');
  appendRow(SHEETS.EMPLOYEES, { ...emp, passHash: storedHash });
  return { ok: true };
}

// ─── CHECKIN ──────────────────────────────────────────────────────
function handleCheckin(data) {
  const { empId, date, time, shift, late, lateMin } = data;
  const shiftKey = shift || 'morning';
  // Mỗi ca lưu 1 dòng riêng — key: empId + date + shift
  const rows = sheetData(SHEETS.CHECKIN);
  const exists = rows.find(r => r.empId === empId && r.date === date && (r.shift || 'morning') === shiftKey);
  if (exists) return { ok: false, error: 'Đã check-in ca này rồi' };
  appendRow(SHEETS.CHECKIN, { empId, date, shift: shiftKey, checkinTime: time, late: late?'TRUE':'FALSE', lateMin: lateMin||0 });
  log('checkin', `${empId} - ${date} ${shiftKey} ${time}${late?' TRỄ '+lateMin+'p':''}`);
  if (late) addAutoPenalty(empId, date, 'late_'+shiftKey, `Đi muộn ca ${shiftKey} ${lateMin} phút`);
  return { ok: true };
}

function handleCheckout(data) {
  const { empId, date, time, shift, early, earlyMin } = data;
  const shiftKey = shift || 'morning';
  // Cập nhật đúng dòng theo ca
  const sheet = getSheet(SHEETS.CHECKIN);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const shiftIdx = headers.indexOf('shift');
  const empIdx = headers.indexOf('empId');
  const dateIdx = headers.indexOf('date');
  for (let i = 1; i < vals.length; i++) {
    const rowShift = shiftIdx >= 0 ? (vals[i][shiftIdx] || 'morning') : 'morning';
    if (vals[i][empIdx] === empId && vals[i][dateIdx] === date && rowShift === shiftKey) {
      const coIdx = headers.indexOf('checkoutTime');
      const earlyIdx = headers.indexOf('early');
      const earlyMinIdx = headers.indexOf('earlyMin');
      if (coIdx >= 0) sheet.getRange(i+1, coIdx+1).setValue(time);
      if (earlyIdx >= 0) sheet.getRange(i+1, earlyIdx+1).setValue(early?'TRUE':'FALSE');
      if (earlyMinIdx >= 0) sheet.getRange(i+1, earlyMinIdx+1).setValue(earlyMin||0);
      break;
    }
  }
  log('checkout', `${empId} - ${date} ${shiftKey} ${time}${early?' VỀ SỚM '+earlyMin+'p':''}`);
  if (early) addAutoPenalty(empId, date, 'early_'+shiftKey, `Về sớm ca ${shiftKey} ${earlyMin} phút`);
  return { ok: true };
}

function addAutoPenalty(empId, date, reason, note) {
  const month = date.slice(0, 7);
  // Kiểm tra trùng trước khi ghi
  const existing = sheetData(SHEETS.DEDUCTIONS).filter(r =>
    String(r.empId) === String(empId) && String(r.date) === String(date) && String(r.reason) === String(reason)
  );
  if (existing.length > 0) return;
  appendRow(SHEETS.DEDUCTIONS, { empId, month, date, reason, amount: 50000, note: note || '' });
}

// ─── CHECKLIST ────────────────────────────────────────────────────
function updateChecklist(data) {
  const { empId, date, taskId, done, doneTime } = data;
  const sheet = getSheet(SHEETS.CHECKLIST);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const empCol = headers.indexOf('empId');
  const dateCol = headers.indexOf('date');
  const taskCol = headers.indexOf('taskId');
  const doneCol = headers.indexOf('done');
  const timeCol = headers.indexOf('doneTime');

  for (let i = 1; i < vals.length; i++) {
    if (vals[i][empCol]===empId && vals[i][dateCol]===date && vals[i][taskCol]===taskId) {
      sheet.getRange(i+1, doneCol+1).setValue(done?'TRUE':'FALSE');
      if (doneTime) sheet.getRange(i+1, timeCol+1).setValue(doneTime);
      return { ok: true };
    }
  }
  appendRow(SHEETS.CHECKLIST, { empId, date, taskId, done: done?'TRUE':'FALSE', doneTime: doneTime||'' });
  return { ok: true };
}

// ─── TODAY DATA ───────────────────────────────────────────────────
function getTodayData(data) {
  const { empId, date } = data;
  const checkins = sheetData(SHEETS.CHECKIN).filter(r => r.empId===empId && r.date===date);
  const checklists = sheetData(SHEETS.CHECKLIST).filter(r => r.empId===empId && r.date===date);
  const supplies = sheetData(SHEETS.SUPPLY).filter(r => r.empId===empId && r.date===date);

  // Lịch đã đăng ký hôm nay
  const todaySchedule = sheetData(SHEETS.SCHEDULE).find(r => r.empId === empId && r.date === date);
  const scheduledShift = todaySchedule ? (todaySchedule.shift || 'full') : 'full';

  const checklist = {};
  checklists.forEach(r => { checklist[r.taskId] = r.done === 'TRUE'; });

  const morning   = checkins.find(r => (r.shift||'morning') === 'morning') || {};
  const afternoon = checkins.find(r => r.shift === 'afternoon') || {};
  const sup = supplies[0] || null;

  return {
    ok: true,
    data: {
      scheduledShift,
      morningCheckin:    morning.checkinTime   || null,
      morningCheckout:   morning.checkoutTime  || null,
      morningLate:       morning.late === 'TRUE',
      afternoonCheckin:  afternoon.checkinTime  || null,
      afternoonCheckout: afternoon.checkoutTime || null,
      afternoonLate:     afternoon.late === 'TRUE',
      checkin:  morning.checkinTime  || afternoon.checkinTime  || null,
      checkout: morning.checkoutTime || afternoon.checkoutTime || null,
      checklist,
      supply: sup ? {
        data: {
          carton_30x20x10: sup.carton_30x20x10,
          carton_25x20x10: sup.carton_25x20x10,
          carton_15x10x10: sup.carton_15x10x10,
          tape: sup.tape, bubble_wrap: sup.bubble_wrap, print_paper: sup.print_paper
        },
        hasAlert: sup.hasAlert === 'TRUE'
      } : null
    }
  };
}

function getTodayReports(data) {
  const { date } = data;
  const employees = sheetData(SHEETS.EMPLOYEES);
  const checkins = sheetData(SHEETS.CHECKIN).filter(r => r.date === date);
  const checklists = sheetData(SHEETS.CHECKLIST).filter(r => r.date === date);
  const supplies = sheetData(SHEETS.SUPPLY).filter(r => r.date === date);
  const pings = sheetData(SHEETS.PINGS).filter(r => r.date === date && r.responded === 'FALSE');
  const overtime = sheetData(SHEETS.OVERTIME).filter(r => r.date === date && r.status === 'active');

  const reports = {};
  employees.forEach(emp => {
    const ci = checkins.find(r => r.empId === emp.id) || {};
    const cl = {};
    checklists.filter(r => r.empId === emp.id).forEach(r => { cl[r.taskId] = r.done === 'TRUE'; });
    const sup = supplies.find(r => r.empId === emp.id);
    const missedPing = pings.some(r => r.empId === emp.id);
    const activeShift = overtime.some(r => r.empId === emp.id);

    reports[emp.id] = {
      checkin: ci.checkinTime || null,
      checkout: ci.checkoutTime || null,
      late: ci.late === 'TRUE',
      lateMin: Number(ci.lateMin) || 0,
      checklist: cl,
      supply: sup ? { data: sup, hasAlert: sup.hasAlert === 'TRUE' } : null,
      pingMiss: missedPing,
      activeShift,
    };
  });
  return { ok: true, data: reports };
}

// ─── SUPPLY ───────────────────────────────────────────────────────
function submitSupply(data) {
  const { empId, date, data: supplyData, hasAlert, reportedBy, onBehalfOf } = data;
  appendRow(SHEETS.SUPPLY, {
    empId, date, time: new Date().toTimeString().slice(0,5),
    carton_nap_gap_35x25x7: supplyData.carton_nap_gap_35x25x7 ?? '',
    carton_nap_gap_20x15x6: supplyData.carton_nap_gap_20x15x6 ?? '',
    carton_doi_khau_40x30x20: supplyData.carton_doi_khau_40x30x20 ?? '',
    carton_doi_khau_35x25x15: supplyData.carton_doi_khau_35x25x15 ?? '',
    carton_doi_khau_12x12x12: supplyData.carton_doi_khau_12x12x12 ?? '',
    hop_dong_ho: supplyData.hop_dong_ho ?? '',
    hop_vong_tay: supplyData.hop_vong_tay ?? '',
    bang_dinh: supplyData.bang_dinh ?? '',
    xop_60cm: supplyData.xop_60cm ?? '',
    xop_40cm: supplyData.xop_40cm ?? '',
    giay_in_don: supplyData.giay_in_don ?? '',
    decan_noi: supplyData.decan_noi ?? '',
    decan_vanh: supplyData.decan_vanh ?? '',
    decan_vua: supplyData.decan_vua ?? '',
    giay_nen_vua: supplyData.giay_nen_vua ?? '',
    hasAlert: hasAlert ? 'TRUE' : 'FALSE',
    reportedBy: reportedBy || empId,
    onBehalfOf: onBehalfOf || '',
  });
  // Lấy tên nhân viên
  const emps = sheetData(SHEETS.EMPLOYEES);
  const emp = emps.find(e => e.id === empId);
  const empName = emp ? emp.name : empId;
  const reporterEmp = reportedBy && reportedBy !== empId ? emps.find(e => e.id === reportedBy) : null;
  const reporterName = reporterEmp ? reporterEmp.name : null;

  // Gửi Telegram
  const onBehalfNote = reporterName ? `\n👥 Đại diện bởi: <b>${reporterName}</b>` : '';
  if (hasAlert) {
    const alertCfg = { carton_nap_gap_35x25x7:20, carton_nap_gap_20x15x6:20, carton_doi_khau_40x30x20:20, carton_doi_khau_35x25x15:20, carton_doi_khau_12x12x12:20, hop_dong_ho:20, hop_vong_tay:20, bang_dinh:2, xop_60cm:1, xop_40cm:1, giay_in_don:2, decan_noi:5, decan_vanh:5, decan_vua:5, giay_nen_vua:20 };
    const alertItems = Object.entries(supplyData)
      .filter(([k,v]) => v !== null && v !== '' && alertCfg[k] && Number(v) < alertCfg[k])
      .map(([k,v]) => `  • ${k}: còn <b>${v}</b>`).join('\n');
    sendTelegram(`⚠️ <b>CẢNH BÁO KHO THẤP</b>\n👤 ${empName}${onBehalfNote}\n📅 ${date}\n\nMặt hàng cần bổ sung:\n${alertItems}`);
    log('SUPPLY_ALERT', `${empId} báo kho thấp - ${date}${onBehalfOf ? ' (đại diện bởi ' + reportedBy + ')' : ''}`);
  } else {
    sendTelegram(`✅ <b>Báo cáo kho</b>\n👤 ${empName}${onBehalfNote}\n📅 ${date} · ${new Date().toTimeString().slice(0,5)}\nTất cả dụng cụ đủ mức ✔️`);
  }
  return { ok: true };
}

function submitReturn(data) {
  const { empId, date, type } = data;
  const id = `RET-${empId}-${Date.now()}`;
  const time = new Date().toTimeString().slice(0,5);
  const emps = sheetData(SHEETS.EMPLOYEES);
  const emp = emps.find(e => e.id === empId);
  const empName = emp ? emp.name : empId;

  if (type === 'customer') {
    const { orderId, amount, bankInfo, condition, photoShipper, photoActual, photoQR } = data;
    appendRow(SHEETS.RETURN_SUBS, { id, empId, date, time, type, orderId, amount, bankInfo, condition, photoShipper: photoShipper||'', photoActual: photoActual||'', photoQR: photoQR||'', status: 'pending', proofUrl: '', confirmedAt: '' });
    const condLabel = { ok: 'Nguyên vẹn', damaged: 'Hỏng', repack: 'Cần đóng gói lại' }[condition] || condition;
    sendTelegram(`🔄 <b>Hàng hoàn — Khách trả</b>\n👤 ${empName} · 📅 ${date}\n📦 Đơn: <b>${orderId}</b>\n💰 Hoàn: <b>${Number(amount).toLocaleString('vi-VN')}đ</b>\n🏦 ${bankInfo}\n📋 Tình trạng: ${condLabel}\n\n👉 Boss Dashboard → 🔔 Thông Báo để xác nhận`);
    // Gửi từng ảnh riêng qua Drive blob để Boss quét QR
    [
      { url: photoQR,      cap: `🔳 Mã QR khách hoàn — ĐH ${orderId}` },
      { url: photoShipper, cap: `📋 Ảnh shipper giao — ĐH ${orderId}` },
      { url: photoActual,  cap: `📷 Ảnh hàng thực tế — ĐH ${orderId}` },
    ].forEach(p => sendTelegramPhoto(p.url, p.cap));
  } else {
    const { count, orderIds, photoOrders, photoPancake } = data;
    appendRow(SHEETS.RETURN_SUBS, { id, empId, date, time, type, count, orderIds, photoOrders: photoOrders||'', photoPancake: photoPancake||'', status: 'pending', proofUrl: '', confirmedAt: '' });
    sendTelegram(`🚚 <b>Hàng hoàn — Vận chuyển</b>\n👤 ${empName} · 📅 ${date}\n📦 Số đơn: <b>${count}</b>\nMã đơn:\n${orderIds}\n\n👉 Boss Dashboard → 🔔 Thông Báo để xác nhận`);
  }
  log('return', `${empId} - ${type} - ${date}`);
  return { ok: true };
}

function getPendingReturns(data) {
  const rows = sheetData(SHEETS.RETURN_SUBS).filter(r => r.status === 'pending');
  const emps = sheetData(SHEETS.EMPLOYEES);
  return { ok: true, data: rows.map(r => ({ ...r, empName: (emps.find(e => e.id === r.empId)||{}).name || r.empId })) };
}

function confirmReturn(data) {
  const { id, empId, approved, proofUrl } = data;
  const sheet = getSheet(SHEETS.RETURN_SUBS);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');
  const proofIdx = headers.indexOf('proofUrl');
  const confirmedAtIdx = headers.indexOf('confirmedAt');
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][idIdx] === id) {
      sheet.getRange(i+1, statusIdx+1).setValue(approved ? 'confirmed' : 'rejected');
      sheet.getRange(i+1, proofIdx+1).setValue(proofUrl || '');
      sheet.getRange(i+1, confirmedAtIdx+1).setValue(new Date().toTimeString().slice(0,5));
      break;
    }
  }
  const emps = sheetData(SHEETS.EMPLOYEES);
  const emp = emps.find(e => e.id === empId);
  const empName = emp ? emp.name : empId;
  if (approved) {
    sendTelegram(`✅ <b>Boss đã xác nhận hoàn tiền</b>\n👤 ${empName}\nVào tab 🔔 Thông Báo để tải ảnh xác nhận gửi khách.`);
  }
  return { ok: true };
}

function getMyReturns(data) {
  const { empId } = data;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const rows = sheetData(SHEETS.RETURN_SUBS)
    .filter(r => r.empId === empId && r.status !== 'pending' && new Date(r.date) >= cutoff);
  return { ok: true, data: rows };
}

// ─── OVERTIME / SHIFTS ────────────────────────────────────────────
function registerOvertime(data) {
  const { empId, date, start, end, plan } = data;
  const id = uid();
  appendRow(SHEETS.OVERTIME, { id, empId, date, start, end, plan, status: 'pending' });
  return { ok: true, id };
}

function startShift(data) {
  const { empId, date, startTime } = data;
  // Cập nhật hoặc tạo record
  const found = updateRow(SHEETS.OVERTIME, 'empId', empId, { status: 'active', start: startTime });
  if (!found) {
    appendRow(SHEETS.OVERTIME, { id: uid(), empId, date, start: startTime, status: 'active' });
  }
  return { ok: true };
}

function endShift(data) {
  const { empId, date, endTime, hours } = data;
  updateRow(SHEETS.OVERTIME, 'empId', empId, { status: 'done', end: endTime, hours });
  return { ok: true };
}

function approveOT(data) {
  updateRow(SHEETS.OVERTIME, 'id', data.id, { status: 'approved', approvedAt: new Date().toISOString() });
  return { ok: true };
}

function rejectOT(data) {
  updateRow(SHEETS.OVERTIME, 'id', data.id, { status: 'rejected' });
  return { ok: true };
}

function getOvertimeList(data) {
  const { empId, month } = data;
  const rows = sheetData(SHEETS.OVERTIME).filter(r =>
    r.empId === empId && r.date && r.date.startsWith(month)
  ).map(r => ({
    id: r.id, date: r.date, start: r.start, end: r.end,
    hours: r.hours, plan: r.plan,
    approved: r.status === 'approved' || r.status === 'done',
    rejected: r.status === 'rejected',
  }));
  return { ok: true, data: rows };
}

function getOvertimeRequests(data) {
  const { month } = data;
  const rows = sheetData(SHEETS.OVERTIME).filter(r =>
    r.date && r.date.startsWith(month)
  ).map(r => ({
    id: r.id, empId: r.empId, date: r.date, start: r.start, end: r.end,
    hours: r.hours, plan: r.plan, status: r.status,
    approved: r.status === 'approved' || r.status === 'done',
    rejected: r.status === 'rejected',
  }));
  return { ok: true, data: rows };
}

function getOTSummary(data) {
  const { empId, month } = data;
  const rows = sheetData(SHEETS.OVERTIME).filter(r =>
    r.empId === empId && r.date && r.date.startsWith(month) &&
    (r.status === 'done' || r.status === 'approved')
  );
  const hours = rows.reduce((s, r) => s + (Number(r.hours) || 0), 0);
  return { ok: true, data: { hours: Math.round(hours * 10) / 10 } };
}

function submitShiftResult(data) {
  const { empId, date, desc } = data;
  updateRow(SHEETS.OVERTIME, 'empId', empId, { resultDesc: desc });
  return { ok: true };
}

// ─── PINGS ────────────────────────────────────────────────────────
function handlePing(data, responded) {
  const { empId, date, time } = data;
  appendRow(SHEETS.PINGS, { empId, date, time, responded: responded ? 'TRUE' : 'FALSE' });
  if (!responded) log('PING_MISS', `${empId} không phản hồi ping lúc ${time}`);
  return { ok: true };
}

// ─── DEDUCTIONS ───────────────────────────────────────────────────
function addDeduction(data) {
  const { empId, month, date, reason, amount } = data;
  appendRow(SHEETS.DEDUCTIONS, { empId, month, date, reason, amount });
  return { ok: true };
}

// ─── SALARY ───────────────────────────────────────────────────────
function getSalaryData(data) {
  const { month } = data;
  const employees = sheetData(SHEETS.EMPLOYEES);
  const deductions = sheetData(SHEETS.DEDUCTIONS).filter(r => r.month === month);
  const salaries = sheetData(SHEETS.SALARY).filter(r => r.month === month);
  const overtime = sheetData(SHEETS.OVERTIME).filter(r =>
    r.date && r.date.startsWith(month) && (r.status === 'done' || r.status === 'approved')
  );
  const checkins = sheetData(SHEETS.CHECKIN).filter(r => r.date && r.date.startsWith(month));
  // Lấy ca ngoài giờ từ Schedule (hasOT = TRUE, date trong tháng)
  const scheduleOT = sheetData(SHEETS.SCHEDULE).filter(r =>
    r.date && r.date.startsWith(month) && String(r.hasOT) === 'true'
  );

  const result = {};
  employees.forEach(emp => {
    const empDeductions = deductions.filter(d => d.empId === emp.id);
    const empSalary = salaries.find(s => s.empId === emp.id);
    const empOT = overtime.filter(o => o.empId === emp.id);
    const otHoursOld = empOT.reduce((s, o) => s + (Number(o.hours)||0), 0);
    // Giờ ngoài giờ từ Schedule: ưu tiên actualHours, fallback plannedHours
    const empSchedOT = scheduleOT.filter(r => String(r.empId) === String(emp.id));
    const otHoursNew = empSchedOT.reduce((s, r) => {
      const h = Number(r.actualHours) || Number(r.plannedHours) || 0;
      // Ngày lễ nhân đôi (kiểm tra đơn giản các ngày cố định)
      const mmdd = String(r.date).slice(5);
      const isHoliday = ['01-01','04-30','05-01','09-02'].includes(mmdd) ||
        ['2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-04-27'].includes(r.date);
      return s + (isHoliday ? h * 2 : h);
    }, 0);
    const otHours = otHoursOld + otHoursNew;

    // Thưởng chuyên cần: trừ 50.000 mỗi vi phạm (trễ, về sớm, thiếu check-in/out)
    const attendanceDeductions = empDeductions.filter(d =>
      d.reason && (
        d.reason.includes('late') ||
        d.reason.includes('early') ||
        d.reason.includes('absent') ||
        d.reason.includes('Đi muộn') ||
        d.reason.includes('Về sớm') ||
        d.reason.includes('Không check')
      )
    );
    const attendanceBonus = Math.max(0, 300000 - attendanceDeductions.reduce((s,d)=>s+Number(d.amount||50000),0));

    // Thưởng nhiệm vụ: trừ 50.000 mỗi lần checklist không đạt
    const taskDeductions = empDeductions.filter(d =>
      d.reason && (d.reason.includes('Checklist') || d.reason.includes('checklist') || d.reason.includes('nhiệm vụ'))
    );
    const taskBonus = Math.max(0, 500000 - taskDeductions.reduce((s,d)=>s+Number(d.amount||50000),0));

    result[emp.id] = {
      baseSalary: Number(emp.salary) || 0,
      otHours: Math.round(otHours * 10) / 10,
      attendanceBonus,
      tasksBonus: taskBonus,
      salesBonus: Number(empSalary?.salesBonus) || 0,
      deductions: empDeductions,
      confirmed: empSalary?.confirmed === 'TRUE',
    };
  });
  return { ok: true, data: result };
}

function saveSalesBonus(data) {
  const { month, bonuses } = data;
  Object.entries(bonuses).forEach(([empId, amount]) => {
    const found = updateRow(SHEETS.SALARY, 'empId', empId, { salesBonus: amount });
    if (!found) appendRow(SHEETS.SALARY, { empId, month, salesBonus: amount, confirmed: 'FALSE' });
  });
  return { ok: true };
}

function getSalesBonus(data) {
  const { empId, month } = data;
  const row = sheetData(SHEETS.SALARY).find(r => r.empId === empId && r.month === month);
  return { ok: true, data: { amount: Number(row?.salesBonus) || 0 } };
}

function confirmSalary(data) {
  const { month } = data;
  const employees = sheetData(SHEETS.EMPLOYEES);
  employees.forEach(emp => {
    const found = updateRow(SHEETS.SALARY, 'empId', emp.id, {
      confirmed: 'TRUE', confirmedAt: new Date().toISOString()
    });
    if (!found) appendRow(SHEETS.SALARY, {
      empId: emp.id, month, salesBonus: 0, confirmed: 'TRUE', confirmedAt: new Date().toISOString()
    });
  });
  log('SALARY_CONFIRMED', `Tháng ${month} đã chốt lương`);
  return { ok: true };
}

function approveDay(data) {
  const { empId, date } = data;
  updateRow(SHEETS.CHECKIN, 'empId', empId, { approved: 'TRUE' });
  log('APPROVE_DAY', `Boss xác nhận ngày làm ${empId} - ${date}`);
  return { ok: true };
}

// ─── SCHEDULE ─────────────────────────────────────────────────────
function registerSchedule(data) {
  const { empId, weekStart, schedule } = data;
  const dayKeys = ['mon','tue','wed','thu','fri','sat','sun'];
  // Xoá lịch cũ của tuần này nếu có
  const sheet = getSheet(SHEETS.SCHEDULE);
  const vals = sheet.getDataRange().getValues();
  for (let i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][0]) === String(empId) && String(vals[i][1]) === String(weekStart)) {
      sheet.deleteRow(i + 1);
    }
  }
  // Ghi lịch mới
  dayKeys.forEach(day => {
    const s = schedule[day];
    if (!s) return;
    appendRow(SHEETS.SCHEDULE, {
      empId, weekStart, day, date: s.date, shift: s.shift,
      eveningStart: s.eveningStart || '', eveningEnd: s.eveningEnd || '',
      plannedHours: s.plannedHours || 0, actualHours: '', status: 'pending'
    });
  });
  log('SCHEDULE', `${empId} đăng ký lịch tuần ${weekStart}`);
  return { ok: true };
}

function getSchedule(data) {
  const { empId, weekStart } = data;
  const rows = sheetData(SHEETS.SCHEDULE).filter(r => r.empId === empId && r.weekStart === weekStart);
  const result = {};
  rows.forEach(r => { result[r.day] = r; });
  return { ok: true, data: result };
}

function getWeeklySchedule(data) {
  const { weekStart } = data;
  const rows = sheetData(SHEETS.SCHEDULE).filter(r => r.weekStart === weekStart);
  const result = {};
  rows.forEach(r => {
    if (!result[r.empId]) result[r.empId] = {};
    result[r.empId][r.day] = r;
  });
  return { ok: true, data: result };
}

function startOTShift(data) {
  const { empId, date, startTime } = data;
  const sheet = getSheet(SHEETS.SCHEDULE);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const d = new Date(date);
  const day = d.getDay();
  const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][day];
  // Tính weekStart (thứ 2 của tuần đó)
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = mon.toISOString().slice(0,10);

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(empId) &&
        String(vals[i][1]) === String(weekStart) &&
        String(vals[i][2]) === String(dayKey)) {
      const sIdx = headers.indexOf('status');
      const stIdx = headers.indexOf('eveningStart');
      if (sIdx >= 0) sheet.getRange(i+1, sIdx+1).setValue('started');
      if (stIdx >= 0) sheet.getRange(i+1, stIdx+1).setValue(startTime);
      break;
    }
  }
  log('OT_START', `${empId} bắt đầu ca ngoài giờ ${date} lúc ${startTime}`);
  return { ok: true };
}

function endOTShift(data) {
  const { empId, date, endTime, hours } = data;
  const sheet = getSheet(SHEETS.SCHEDULE);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const d = new Date(date);
  const day = d.getDay();
  const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][day];
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = mon.toISOString().slice(0,10);

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(empId) &&
        String(vals[i][1]) === String(weekStart) &&
        String(vals[i][2]) === String(dayKey)) {
      const sIdx = headers.indexOf('status');
      const eIdx = headers.indexOf('eveningEnd');
      const hIdx = headers.indexOf('actualHours');
      if (sIdx >= 0) sheet.getRange(i+1, sIdx+1).setValue('done');
      if (eIdx >= 0) sheet.getRange(i+1, eIdx+1).setValue(endTime);
      if (hIdx >= 0) sheet.getRange(i+1, hIdx+1).setValue(hours);
      break;
    }
  }
  log('OT_END', `${empId} kết thúc ca ngoài giờ ${date} lúc ${endTime} — ${hours}h`);
  return { ok: true };
}

function editSchedule(data) {
  const { empId, weekStart, dayKey, date, shift, hasOT, eveningStart, eveningEnd, plannedHours } = data;
  const sheet = getSheet(SHEETS.SCHEDULE);
  const vals = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(empId) &&
        String(vals[i][1]) === String(weekStart) &&
        String(vals[i][2]) === String(dayKey)) {
      sheet.getRange(i+1, 1, 1, 10).setValues([[
        empId, weekStart, dayKey, date, shift,
        hasOT ? (eveningStart||'') : '',
        hasOT ? (eveningEnd||'') : '',
        hasOT ? (plannedHours||0) : 0,
        '', 'boss_edited'
      ]]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([empId, weekStart, dayKey, date, shift,
      hasOT ? (eveningStart||'') : '',
      hasOT ? (eveningEnd||'') : '',
      hasOT ? (plannedHours||0) : 0,
      '', 'boss_edited']);
  }
  log('EDIT_SCHEDULE', `Boss sửa lịch ${empId} ${dayKey} ${weekStart}: ${shift}`);
  return { ok: true };
}

function changePassword(data) {
  const { empId, passHash } = data;
  const sheet = getSheet(SHEETS.EMPLOYEES);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const idCol = headers.indexOf('id');
  const hashCol = headers.indexOf('passHash');
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][idCol]) === String(empId)) {
      sheet.getRange(i + 1, hashCol + 1).setValue(passHash);
      log('CHANGE_PASSWORD', `${empId} đổi mật khẩu`);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Không tìm thấy nhân viên' };
}

function getPenalties(data) {
  const { month } = data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Penalties');
  if (!sheet) return { ok: true, data: [] };
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const result = [];
  for (let i = 1; i < vals.length; i++) {
    const row = {};
    headers.forEach((h, j) => row[h] = vals[i][j]);
    if (String(row.month) === String(month)) result.push({
      empId: row.empId, empName: row.empName, reason: row.reason,
      date: row.date, amount: Number(row.amount)||50000,
      note: row.note||'', auto: row.auto==='auto', month: row.month
    });
  }
  return { ok: true, data: result };
}

function savePenalties(data) {
  const { month, penalties } = data;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Penalties');
  if (!sheet) {
    sheet = ss.insertSheet('Penalties');
    sheet.appendRow(['month','empId','empName','reason','date','amount']);
  }
  // Xoá dữ liệu tháng này rồi ghi lại
  const vals = sheet.getDataRange().getValues();
  for (let i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][0]) === String(month)) sheet.deleteRow(i + 1);
  }
  penalties.forEach(p => {
    sheet.appendRow([p.month, p.empId, p.empName, p.reason, p.date||'', p.amount||50000]);
  });
  return { ok: true };
}

function approveShiftHours(data) {
  const { empId, weekStart, day, actualHours } = data;
  const sheet = getSheet(SHEETS.SCHEDULE);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(empId) &&
        String(vals[i][1]) === String(weekStart) &&
        String(vals[i][2]) === String(day)) {
      const hIdx = headers.indexOf('actualHours');
      const sIdx = headers.indexOf('status');
      if (hIdx >= 0) sheet.getRange(i+1, hIdx+1).setValue(actualHours);
      if (sIdx >= 0) sheet.getRange(i+1, sIdx+1).setValue('approved');
      break;
    }
  }
  log('APPROVE_HOURS', `Boss xác nhận ${empId} ${day} ${weekStart}: ${actualHours}h`);
  return { ok: true };
}

// ─── PHOTO STORAGE (Google Drive) ────────────────────────────────
function getOrCreateFolder() {
  const folderName = 'HR-Ancha-Photos';
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function uploadPhoto(data) {
  const { empId, date, type, label, base64, mimeType } = data;
  if (!base64) return { ok: false, error: 'Không có dữ liệu ảnh' };
  try {
    const folder = getOrCreateFolder();
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType || 'image/jpeg', `${empId}_${type}_${Date.now()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    appendRow(SHEETS.PHOTOS, {
      empId, date, time: new Date().toTimeString().slice(0,5),
      type, label: label || type,
      url, driveId: file.getId(),
      expires: new Date(Date.now() + 7*86400000).toISOString().slice(0,10)
    });
    return { ok: true, url };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ─── CHUNKED UPLOAD (ảnh lớn chia thành nhiều phần nhỏ) ─────────────
function uploadChunk(data) {
  const { uuid, chunk, index } = data;
  if (!uuid || chunk === undefined || index === undefined) return { ok: false, error: 'Thiếu tham số' };
  try {
    CacheService.getScriptCache().put(`chunk_${uuid}_${index}`, chunk, 21600);
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function finalizeUpload(data) {
  const { uuid, totalChunks, empId, date, type, label } = data;
  try {
    const cache = CacheService.getScriptCache();
    let base64 = '';
    for (let i = 0; i < totalChunks; i++) {
      const chunk = cache.get(`chunk_${uuid}_${i}`);
      if (!chunk) return { ok: false, error: `Mất chunk ${i}` };
      base64 += chunk;
    }
    const folder = getOrCreateFolder();
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', `${empId}_${type}_${Date.now()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const url = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    appendRow(SHEETS.PHOTOS, {
      empId, date, time: new Date().toTimeString().slice(0,5),
      type, label: label || type,
      url, driveId: file.getId(),
      expires: new Date(Date.now() + 7*86400000).toISOString().slice(0,10)
    });
    return { ok: true, url };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function getPhotos(data) {
  const { date, days } = data;
  const rows = sheetData(SHEETS.PHOTOS);
  if (!date) return { ok: true, data: rows };
  // Lấy ảnh trong khoảng `days` ngày gần nhất
  const from = new Date(date);
  from.setDate(from.getDate() - (days || 6));
  const fromStr = from.toISOString().slice(0,10);
  return { ok: true, data: rows.filter(r => r.date >= fromStr && r.date <= date) };
}

function cleanOldPhotos() {
  const today = new Date().toISOString().slice(0,10);
  const sheet = getSheet(SHEETS.PHOTOS);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const expiresIdx = headers.indexOf('expires');
  const driveIdIdx = headers.indexOf('driveId');
  let deleted = 0;
  for (let i = vals.length - 1; i >= 1; i--) {
    const expires = String(vals[i][expiresIdx]);
    if (expires && expires < today) {
      try { DriveApp.getFileById(vals[i][driveIdIdx]).setTrashed(true); } catch(e) {}
      sheet.deleteRow(i + 1);
      deleted++;
    }
  }
  return { ok: true, deleted };
}

// Trigger tự động chạy hàng ngày — tạo 1 lần trong Apps Script
function setupDailyCleanup() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyCleanup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyCleanup').timeBased().everyDays(1).atHour(2).create();
}

function dailyCleanup() {
  cleanOldPhotos();
}

function getMySubmissions(data) {
  const { empId } = data;
  const rows = sheetData(SHEETS.SUBMISSIONS).filter(r => r.empId === empId);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  return { ok: true, data: rows.filter(r => new Date(r.date) >= cutoff) };
}

function getMyCheckin(data) {
  const { empId } = data;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const rows = sheetData(SHEETS.CHECKIN).filter(r => r.empId === empId && new Date(r.date) >= cutoff);
  return { ok: true, data: rows };
}

function getMySupply(data) {
  const { empId } = data;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
  const rows = sheetData(SHEETS.SUPPLY).filter(r => r.empId === empId && new Date(r.date) >= cutoff);
  return { ok: true, data: rows };
}

// ─── SUBMISSIONS (Checklist confirmation) ─────────────────────────
function createSubmission(data) {
  const { empId, date, totalTasks, doneTasks } = data;
  const id = `SUB-${empId}-${date}-${Date.now()}`;
  appendRow(SHEETS.SUBMISSIONS, { id, empId, date, time: new Date().toTimeString().slice(0,5), totalTasks, doneTasks, status: 'pending', reviewedAt: '' });
  const emps = sheetData(SHEETS.EMPLOYEES);
  const emp = emps.find(e => e.id === empId);
  const empName = emp ? emp.name : empId;
  sendTelegram(`📋 <b>Checklist cần xác nhận</b>\n👤 ${empName}\n📅 ${date}\n✅ Hoàn thành: <b>${doneTasks}/${totalTasks}</b> việc\n\n👉 Vào Boss Dashboard → 🔔 Thông Báo để xác nhận`);
  return { ok: true };
}

function getPendingSubmissions(data) {
  const rows = sheetData(SHEETS.SUBMISSIONS).filter(r => r.status === 'pending');
  const emps = sheetData(SHEETS.EMPLOYEES);
  const result = rows.map(r => {
    const emp = emps.find(e => e.id === r.empId);
    return { ...r, empName: emp ? emp.name : r.empId };
  });
  return { ok: true, data: result };
}

function reviewSubmission(data) {
  const { id, approved, empId, date } = data;
  const sheet = getSheet(SHEETS.SUBMISSIONS);
  const vals = sheet.getDataRange().getValues();
  const headers = vals[0];
  const idIdx = headers.indexOf('id');
  const statusIdx = headers.indexOf('status');
  const reviewedAtIdx = headers.indexOf('reviewedAt');
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][idIdx] === id) {
      sheet.getRange(i+1, statusIdx+1).setValue(approved ? 'approved' : 'rejected');
      sheet.getRange(i+1, reviewedAtIdx+1).setValue(new Date().toTimeString().slice(0,5));
      break;
    }
  }
  if (!approved) {
    const month = date.slice(0,7);
    appendRow(SHEETS.DEDUCTIONS, { empId, month, date, reason: 'Checklist không hoàn thành', amount: 50000 });
    const emps = sheetData(SHEETS.EMPLOYEES);
    const emp = emps.find(e => e.id === empId);
    const empName = emp ? emp.name : empId;
    sendTelegram(`⚠️ <b>Checklist không đạt</b>\n👤 ${empName} bị trừ <b>50.000đ</b>\n📅 ${date}`);
  }
  return { ok: true };
}
