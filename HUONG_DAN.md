# Hướng dẫn cài đặt Web ĐGNL Online

## 1. Cấu trúc thư mục

```
WebDGNL/
├── index.html                 (trang chính)
├── js/
│   ├── firebase-config.js     (bạn cần điền cấu hình Firebase)
│   ├── auth.js                (xử lý đăng nhập bằng mã học sinh + lưu lịch sử Firestore)
│   └── app.js                 (engine tạo đề, chấm điểm)
├── data/
│   ├── manifest.js            (danh sách các chuyên đề đang có)
│   └── chuyen-de/
│       ├── ToHopXacSuat.js
│       ├── MatPhangOxy.js
│       └── ... (mỗi chuyên đề 1 file)
└── assets/                    (logo, favicon)
```

## 2. Cài đặt Firebase (đăng nhập + lưu lịch sử điểm)

1. Vào https://console.firebase.google.com, đăng nhập bằng Gmail của bạn,
   bấm **"Add project"** để tạo project mới (miễn phí).
2. Trong project vừa tạo, vào **Project settings** (biểu tượng bánh răng) →
   mục **"Your apps"** → bấm biểu tượng **"</>"** (Web) → đặt tên app tùy ý
   → Firebase sẽ hiện ra 1 đoạn code `firebaseConfig = {...}`.
3. Mở file `js/firebase-config.js`, copy đè các giá trị vào object
   `window.DGNL_FIREBASE_CONFIG`.
4. Vào mục **Authentication** (bên trái) → tab **Sign-in method** → bấm
   **Email/Password** → bật (Enable) → Save. (Web này đăng nhập bằng
   **mã học sinh + mật khẩu**, không dùng Google.)
5. Vào mục **Firestore Database** → **Create database** → chọn chế độ
   **Production mode** → chọn khu vực gần Việt Nam (ví dụ
   `asia-southeast1`) → Create.
6. Vào tab **Rules** của Firestore, dán quy tắc sau rồi **Publish** (chỉ
   cho phép người dùng đọc/ghi kết quả của chính họ):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ketqua/{docId} {
         allow read: if request.auth != null && request.auth.uid == resource.data.uid;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
       }
     }
   }
   ```

## 3. Cấp tài khoản (mã học sinh + mật khẩu) cho từng học sinh

Web này **không** dùng Google — mỗi học sinh đăng nhập bằng 1 **mã học
sinh** (ví dụ `72301`) + 1 **mật khẩu** do bạn cấp. Vì trang web là file
tĩnh (ai cũng xem được code), mã + mật khẩu **không được** ghi trong
`firebase-config.js` hay bất kỳ file nào của web — chúng phải được tạo
trực tiếp và an toàn bên trong Firebase bằng 1 script chạy trên máy bạn.

**Gợi ý cách đặt mã học sinh** (tuỳ bạn, ví dụ theo năm + lớp + môn + số
thứ tự): năm `2027` → lấy số `7`, lớp `12` → lấy số `2`, ĐGNL → số `3`,
rồi số thứ tự 2 chữ số `01, 02, ...` → mã dạng `72301`, `72302`, ...

**Các bước cấp tài khoản:**

1. Tạo 1 thư mục **hoàn toàn riêng, KHÔNG nằm trong** thư mục repo GitHub
   (ví dụ `D:\WebDGNL-QuanTri\`) — đây là nơi lưu công cụ quản trị, tuyệt
   đối không đưa các file ở bước này lên GitHub.
2. Copy 4 file trong thư mục `cong-cu-quan-tri` (đi kèm bản giao này) vào
   thư mục vừa tạo: `tao-tai-khoan-hoc-sinh.js`, `package.json`,
   `danh-sach-hoc-sinh-MAU.csv`, `DOC-TRUOC.txt`.
3. Trong Firebase Console → **Project settings** (bánh răng) → tab
   **Service accounts** → **Generate new private key** → tải về 1 file
   `.json` → đổi tên thành `service-account.json` → để cùng thư mục trên.
   File này mở toàn quyền quản trị Firebase của bạn — không chia sẻ, không
   đưa lên mạng.
4. Đổi tên `danh-sach-hoc-sinh-MAU.csv` thành `danh-sach-hoc-sinh.csv`,
   điền danh sách học sinh (cột `ma`, `ten`, `matkhau`).
5. Mở Command Prompt / PowerShell tại thư mục đó, chạy lần lượt:
   ```
   npm install firebase-admin
   node tao-tai-khoan-hoc-sinh.js
   ```
   Script sẽ tạo (hoặc cập nhật) tài khoản cho từng học sinh trong danh
   sách, kèm báo cáo kết quả.
6. Muốn thêm học sinh mới hoặc đổi mật khẩu: sửa lại file
   `danh-sach-hoc-sinh.csv` rồi chạy lại `node tao-tai-khoan-hoc-sinh.js`.

Học sinh không có tài khoản (chưa được cấp) sẽ đăng nhập bị báo "Sai mã
học sinh hoặc mật khẩu".

## 4. Đưa web lên mạng (hosting)

Có thể dùng GitHub Pages giống hệt cách bạn đang host web 21-NganHangDe:
đẩy toàn bộ thư mục `WebDGNL` lên 1 repository GitHub, vào Settings →
Pages → chọn nhánh chứa code → Save. Firebase Auth hoạt động tốt trên
GitHub Pages vì mọi xử lý đăng nhập diễn ra ở phía trình duyệt.

**Lưu ý:** đăng nhập bằng mã học sinh + mật khẩu (Email/Password) không
cần khai báo "Authorized domains" như Google Sign-in, nên bỏ qua bước
này.

## 5. Thêm chuyên đề mới sau này

Khi có thêm file `.tex` chuyên đề mới (theo đúng định dạng `\begin{ex}`,
`\choice`, `\True`, `\loigiai{}`), chạy lại script bóc tách dữ liệu:

```
python3 parse_dgnl.py --build-all <thư_mục_chứa_file_tex> data/chuyen-de
```

Script sẽ tự tạo lại toàn bộ file `data/chuyen-de/*.js` và
`data/manifest.js`. Câu hỏi thiếu đáp án đúng (`\True`) hoặc có
`\includegraphics` (thiếu file ảnh gốc) sẽ tự động bị bỏ qua và báo cáo ra
màn hình để bạn bổ sung sau.

## 6. Các phần đã hoàn thành / còn giới hạn

- ✅ Chuyên đề riêng theo từng chương (dữ liệu từ thư mục `DanhGiaNangLuc`).
- ✅ "Đề tổng hợp phần Toán ĐGNL" — bốc ngẫu nhiên câu hỏi từ mọi chuyên đề.
- ✅ Đăng nhập bằng mã học sinh + mật khẩu (không dùng Google), quản lý
  tài khoản qua script `tao-tai-khoan-hoc-sinh.js` (mục 3).
- ✅ Lưu lịch sử điểm từng học sinh vào Firestore, xem lại được.
- ⚠️ Các câu hỏi có hình ảnh chèn từ file `\includegraphics` (ảnh cắt từ
  PDF gốc) hiện KHÔNG có file ảnh đi kèm nên bị bỏ qua tạm thời — cần bổ
  sung thư mục ảnh gốc nếu muốn đưa các câu này vào.
- ⚠️ Các đề thi thử/đề minh họa đầy đủ (dạng "bộ câu hỏi dùng chung 1 nội
  dung cho 2-3 câu") từ các file đề tổng hợp lớn (`De-Minh-Hoa`,
  `De-Chinh-Thuc-Dot-...`) CHƯA được đưa vào bản này — đây là phần có thể
  làm tiếp nếu bạn muốn có thêm mục "Đề thi thử ĐGNL" dạng đề đầy đủ.

## 7. Số lượng câu hỏi trắc nghiệm đã bóc tách được (theo từng chuyên đề)

| Chuyên đề | Số câu OK |
|---|---|
| Tổ hợp - Xác suất | 160 |
| Mặt phẳng tọa độ Oxy | 76 |
| Khảo sát hàm số | 103 |
| Mũ - Lũy thừa - Logarit | 117 |
| Giới hạn dãy số | 63 |
| Hình học không gian | 70 |
| Hệ thức lượng trong tam giác | 57 |
| Hệ bất phương trình bậc nhất hai ẩn | 31 |
| Cấp số cộng - cấp số nhân | 74 |
| Phân tích số liệu | 18 |
| Phương trình, hệ phương trình | 2 |
| Lý thuyết đồ thị | 5 |
| Logic | 20 |
| Phương trình lượng giác | 27 |
| **Tổng cộng** | **823** |

Lưu ý: các chuyên đề gốc trong `DanhGiaNangLuc` là ngân hàng câu hỏi dùng
chung cho nhiều mục đích (có cả câu trắc nghiệm, đúng-sai, trả lời ngắn).
Vì ĐGNL chỉ dùng trắc nghiệm, script chỉ lấy các câu có `\choice` +
`\True` hợp lệ; các câu trả lời ngắn (`\dapso`), câu thiếu đáp án đúng,
hoặc câu có `\includegraphics` (thiếu ảnh gốc) được tự động bỏ qua. Hai
chuyên đề "Phương trình, hệ phương trình" (2 câu) và "Lý thuyết đồ thị"
(5 câu) hiện có rất ít câu trắc nghiệm hợp lệ trong nguồn — có thể cần bổ
sung thêm câu trắc nghiệm gốc nếu muốn chuyên đề này phong phú hơn.
