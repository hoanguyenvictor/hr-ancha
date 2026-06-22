// ═══════════════════════════════════════════════════════
// DB.JS — Google Sheets as Database via Apps Script
// Thay SCRIPT_URL bằng URL sau khi deploy Google Apps Script
// ═══════════════════════════════════════════════════════

const DB_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz5yjTpDcbJvvKfrDrTnU_Xoloh7OzY0L-KkM3U8C3Whb5JSkc2hnv2y2W6lyq1E8nm7w/exec',
  OFFICE_LAT: 21.020672,
  OFFICE_LNG: 105.8177024,
  OFFICE_RADIUS_M: 300,        // Bán kính cho phép check-in (mét)
  MORNING_START: '08:00',      // Ca sáng bắt đầu
  MORNING_END:   '12:00',      // Ca sáng kết thúc
  AFTERNOON_START: '13:00',    // Ca chiều bắt đầu
  AFTERNOON_END:   '17:30',    // Ca chiều kết thúc
  EVENING_START: '19:30',      // Ca tối bắt đầu (mặc định)
  LATE_GRACE_MINUTES: 5,       // Cho phép trễ tối đa (phút)
  SCHEDULE_OPEN_HOUR: 15,      // Mở đăng ký lịch từ 15h Chủ Nhật
  SCHEDULE_CLOSE_HOUR: 23,     // Đóng đăng ký lịch lúc 23h30
  SCHEDULE_CLOSE_MIN: 30,
  OVERTIME_RATE: 26000,        // VND/giờ tăng ca
  PENALTY_AMOUNT: 50000,       // VND/lần vi phạm (muộn, về sớm, đăng ký lịch trễ...)
  BONUS_ATTENDANCE: 300000,    // Thưởng chuyên cần
  BONUS_TASKS: 500000,         // Thưởng hoàn thành nhiệm vụ
  PING_INTERVAL_MIN: 20,       // Random ping mỗi 20-40 phút
  PING_INTERVAL_MAX: 40,
  SUPPLY_ALERT: {              // Ngưỡng cảnh báo dụng cụ
    carton_nap_gap_35x25x7: 20,
    carton_nap_gap_20x15x6: 20,
    carton_doi_khau_40x30x20: 20,
    carton_doi_khau_35x25x15: 20,
    carton_doi_khau_12x12x12: 20,
    hop_dong_ho: 20,
    hop_vong_tay: 20,
    bang_dinh: 2,
    xop_60cm: 1,
    xop_40cm: 1,
    giay_in_don: 2,
    decan_noi: 5,
    decan_vanh: 5,
    decan_vua: 5,
    giay_nen_vua: 20,
  }
};

// Offline queue khi mất mạng
let offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');

function isApiReady() {
  return DB_CONFIG.SCRIPT_URL &&
    DB_CONFIG.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL' &&
    DB_CONFIG.SCRIPT_URL.startsWith('https://script.google.com');
}

// Dùng GET + query param để tránh CORS issue với Google Apps Script
async function apiCall(action, data = {}) {
  if (!isApiReady()) return { ok: false, offline: true };
  const payload = { action, ...data };
  const url = DB_CONFIG.SCRIPT_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    offlineQueue.push(payload);
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    console.warn('API lỗi, đã queue:', action, err.message);
    return { ok: false, offline: true };
  }
}

async function flushOfflineQueue() {
  if (!offlineQueue.length || !isApiReady()) return;
  const toSend = [...offlineQueue];
  offlineQueue = [];
  localStorage.setItem('offlineQueue', '[]');
  for (const payload of toSend) {
    try {
      const url = DB_CONFIG.SCRIPT_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
      await fetch(url, { redirect: 'follow' });
    } catch { offlineQueue.push(payload); }
  }
  localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

window.addEventListener('online', flushOfflineQueue);

// ── GPS ────────────────────────────────────────────────
function getGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject('GPS không khả dụng');
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0
    });
  });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function checkInOffice() {
  const pos = await getGPS();
  // GPS trong nhà thường kém — chấp nhận accuracy tới 300m, nhưng dùng accuracy để điều chỉnh radius
  const accuracy = Math.round(pos.coords.accuracy);
  // Lấy tọa độ văn phòng từ localStorage nếu boss đã cập nhật
  const savedLat = parseFloat(localStorage.getItem('officeLat')) || DB_CONFIG.OFFICE_LAT;
  const savedLng = parseFloat(localStorage.getItem('officeLng')) || DB_CONFIG.OFFICE_LNG;
  const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, savedLat, savedLng);
  const effectiveRadius = Math.max(DB_CONFIG.OFFICE_RADIUS_M, accuracy * 0.8);
  const ok = dist <= effectiveRadius;
  return { ok, distance: Math.round(dist), accuracy, lat: pos.coords.latitude, lng: pos.coords.longitude };
}

// ── AUTH ───────────────────────────────────────────────
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('hrUser') || 'null');
}
function setCurrentUser(user) {
  localStorage.setItem('hrUser', JSON.stringify(user));
}
function logout() {
  localStorage.removeItem('hrUser');
  location.href = 'index.html';
}

// ── DATE HELPERS ───────────────────────────────────────
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function today() { return fmtDate(new Date()); }
function nowTime() { return new Date().toTimeString().slice(0, 5); }
function monthKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
function formatVND(n) { return Number(n).toLocaleString('vi-VN') + 'đ'; }
function formatDateVN(str) {
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}
