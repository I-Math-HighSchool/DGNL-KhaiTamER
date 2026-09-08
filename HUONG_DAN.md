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
   **Google** → bật (Enable) → chọn email hỗ trợ → Save. (Web này đăng
   nhập bằng **Gmail của học sinh**, không dùng mã + mật khẩu riêng.)
5. Vẫn trong mục **Authentication** → tab **Settings** → **Authorized
   domains** → bấm **Add domain** → thêm tên miền GitHub Pages của bạn
   (ví dụ `i-math-highschool.github.io`) nếu chưa có sẵn.
6. Vào mục **Firestore Database** → **Create database** → chọn chế độ
   **Production mode** → chọn khu vực gần Việt Nam (ví dụ
   `asia-southeast1`) → Create.
7. Vào tab **Rules** của Firestore, dán quy tắc sau rồi **Publish** — cho
   phép mỗi học sinh chỉ đọc/ghi được kết quả của chính mình, RIÊNG Gmail
   giáo viên quản trị (`thuthuy611103@gmail.com`) được đọc TOÀN BỘ kết quả
   (để dùng trang "Báo cáo kết quả học sinh" xuất Excel — xem mục 8):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ketqua/{docId} {
         allow create: if request.auth != null
                        && request.auth.uid == request.resource.data.uid;
         allow read: if request.auth != null
                      && (request.auth.uid == resource.data.uid
                          || request.auth.token.email == 'thuthuy611103@gmail.com');
         allow update, delete: if false;
       }
     }
   }
   ```

   **Quan trọng:** nếu chưa dán quy tắc mới này (bản cũ chỉ cho đọc kết quả
   của chính mình), trang "Báo cáo kết quả học sinh" và trang "Xem lại bài
   làm" (khi giáo viên mở link của học sinh khác) sẽ báo lỗi "Bạn không có
   quyền xem dữ liệu này".

## 3. Cấp quyền vào web cho từng học sinh (danh sách Gmail được phép)

Web này đăng nhập bằng **chính Gmail của học sinh** qua Google — không
cần đặt mã học sinh hay mật khẩu riêng, Google đã lo việc xác thực. Bạn
chỉ cần quản lý 1 **danh sách các Gmail được phép** vào web.

**Cách thêm/bớt học sinh:**

1. Mở file `js/danh-sach-duoc-phep.js`.
2. Thêm hoặc xoá dòng email trong mảng `window.DGNL_ALLOWED_EMAILS` (viết
   đúng chính tả Gmail của học sinh, chữ thường).
3. Lưu file, rồi đưa (commit + push) lên GitHub như bình thường (qua
   GitHub Desktop) — không cần chạy script hay tạo tài khoản gì thêm.

File này công khai (ai xem code web cũng thấy được danh sách email) nhưng
**không hề chứa mật khẩu** nào, nên hoàn toàn an toàn khi đưa lên GitHub.

Học sinh dùng Gmail **không có trong danh sách** khi đăng nhập sẽ bị báo
"Email chưa được đăng ký sử dụng web này".

## 4. Đưa web lên mạng (hosting)

Có thể dùng GitHub Pages giống hệt cách bạn đang host web 21-NganHangDe:
đẩy toàn bộ thư mục `WebDGNL` lên 1 repository GitHub, vào Settings →
Pages → chọn nhánh chứa code → Save. Firebase Auth hoạt động tốt trên
GitHub Pages vì mọi xử lý đăng nhập diễn ra ở phía trình duyệt.

**Lưu ý:** nhớ thêm đúng tên miền GitHub Pages vào **Authorized domains**
ở bước 5 của mục 2, nếu không học sinh sẽ không đăng nhập Google được khi
vào web qua GitHub Pages.

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

## 8. Xem lại bài làm & xuất báo cáo Excel cho giáo viên

- **`xem-lai.html?id=<mã bài làm>`**: xem lại đúng y hệt 1 bài đã làm (câu
  hỏi, đáp án đã chọn, đáp án đúng, lời giải) — mở được từ nút "Xem lại"
  trong khung "Lịch sử làm bài" của chính học sinh, hoặc từ cột "Xem lại"
  trong trang báo cáo/file Excel (giáo viên). Chỉ chính học sinh làm bài đó
  hoặc giáo viên quản trị mới xem được (do Firestore Rules ở mục 2 kiểm
  soát).
- **`bao-cao-ket-qua.html`**: trang riêng cho giáo viên — đăng nhập bằng
  đúng Gmail `thuthuy611103@gmail.com` sẽ thấy bảng TOÀN BỘ lượt nộp bài
  của mọi học sinh (thời gian nộp, họ tên, email, đề đã làm, điểm, thời
  gian làm bài) và có nút **"Xuất ra Excel"** để tải về file `.xlsx` (có
  kèm cột link "Xem lại" bấm được thẳng vào từng bài). Gmail khác đăng nhập
  vào trang này sẽ bị từ chối.
- Muốn đổi Gmail quản trị (VD dùng Gmail khác thay vì
  `thuthuy611103@gmail.com`): sửa hằng số `TEACHER_EMAIL` ở đầu 2 file
  `js/xem-lai.js` và `js/bao-cao-ket-qua.js`, VÀ sửa lại đúng địa chỉ đó
  trong quy tắc Firestore ở mục 2 (bước 7).

## 6. Các phần đã hoàn thành / còn giới hạn

- ✅ Chuyên đề riêng theo từng chương (dữ liệu từ thư mục `DanhGiaNangLuc`).
- ✅ "Đề tổng hợp phần Toán ĐGNL" — bốc ngẫu nhiên câu hỏi từ mọi chuyên đề.
- ✅ Đăng nhập bằng Gmail qua Google, chỉ cho phép các email trong danh
  sách `js/danh-sach-duoc-phep.js` (mục 3).
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
