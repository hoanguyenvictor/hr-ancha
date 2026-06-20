# Hướng Dẫn Setup HR System

## Tổng Quan
Hệ thống gồm 3 phần:
- `index.html` — Dashboard Boss (chị dùng)
- `employee.html` — App nhân viên (nhân viên cài trên điện thoại)
- Google Sheets — Database lưu toàn bộ dữ liệu

---

## BƯỚC 1 — Tạo Google Sheet Database

1. Mở [Google Sheets](https://sheets.google.com) → **+ Tạo bảng tính mới**
2. Đặt tên: **"HR System — Ancha"**
3. Vào menu **Extensions → Apps Script**
4. Xoá toàn bộ code mặc định
5. Mở file `google-apps-script.js`, copy toàn bộ nội dung → paste vào Apps Script
6. Bấm **Save** (Ctrl+S)

---

## BƯỚC 2 — Deploy Apps Script

1. Bấm **Deploy → New deployment**
2. Chọn loại: **Web app**
3. Cấu hình:
   - **Description**: HR System
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Bấm **Deploy**
5. **Copy URL** hiện ra (dạng: `https://script.google.com/macros/s/xxx/exec`)

---

## BƯỚC 3 — Kết Nối App với Google Sheets

1. Mở `index.html` (Boss Dashboard) trên trình duyệt
2. Vào tab **⚙️ Cài Đặt**
3. Paste URL vừa copy vào ô **"Google Apps Script URL"**
4. Bấm **💾 Lưu Cấu Hình**

---

## BƯỚC 4 — Deploy Web App lên Netlify

1. Vào [netlify.com](https://netlify.com) → Đăng nhập
2. Kéo thả thư mục `hr-system` vào Netlify
3. Netlify tự tạo URL dạng: `https://xxx.netlify.app`
4. **Link Boss**: `https://xxx.netlify.app/index.html`
5. **Link Nhân Viên**: `https://xxx.netlify.app/employee.html`

---

## BƯỚC 5 — Thêm Nhân Viên

1. Mở Boss Dashboard → Tab **👥 Nhân Viên**
2. Bấm **+ Thêm Nhân Viên**
3. Điền: Họ tên, Mã NV (VD: NV001), Mật khẩu, Lương cứng
4. Gửi **link nhân viên** + **mã NV** + **mật khẩu** cho từng bạn

---

## BƯỚC 6 — Nhân Viên Cài App Trên Điện Thoại

Hướng dẫn gửi cho nhân viên:

> 1. Mở link: `[link nhân viên]` trên Chrome
> 2. Bấm menu ⋮ → **"Thêm vào màn hình chính"**
> 3. App xuất hiện như app thật trên điện thoại
> 4. Đăng nhập bằng mã NV và mật khẩu Boss cấp

---

## Lưu Ý Quan Trọng

### GPS Check-in
- Nhân viên phải **bật GPS** trên điện thoại
- Phải **vào văn phòng trong bán kính 150m** mới check-in được
- Tọa độ văn phòng đã cài sẵn: Ancha Marketing, Lai Xá, Hoài Đức

### Ca Tối WFH
- Nhân viên bấm **"Bắt đầu ca tối"** → hệ thống tự động ping random 20-40 phút/lần
- Nhân viên phải phản hồi trong **5 phút**, không phản hồi → Boss nhận cảnh báo
- Cuối ca phải **nộp kết quả** (mô tả + ảnh chụp màn hình)

### Thưởng/Trừ Tự Động
| Hạng Mục | Giá Trị | Điều Kiện Trừ |
|----------|---------|---------------|
| Thưởng chuyên cần | 300,000đ | Trễ 1 lần: -30,000đ |
| Thưởng nhiệm vụ | 500,000đ | Boss tự trừ theo vi phạm |
| Thưởng doanh số | ~1,000,000đ | Boss nhập cuối tháng |

### Chốt Lương
1. Cuối tháng: Boss vào tab **💰 Lương** → Nhập thưởng doanh số từng người
2. Xem bảng lương tự động tính
3. Bấm **"Xác Nhận & Chốt Lương"**
4. Nhân viên thấy bảng lương đã chốt trên app

---

## Cần Hỗ Trợ?
Liên hệ Zalo: **0967351768** (Thanh Thịnh Vượng)
