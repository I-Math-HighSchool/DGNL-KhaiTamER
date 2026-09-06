// =========================================================================
// CẤU HÌNH FIREBASE — GIÁO VIÊN CẦN ĐIỀN THÔNG TIN Ở ĐÂY
// =========================================================================
// 1) Vào https://console.firebase.google.com -> Tạo project mới (miễn phí).
// 2) Trong project, vào "Project settings" -> mục "Your apps" -> bấm biểu
//    tượng "</>" (Web) để tạo 1 Web App -> Firebase sẽ đưa cho bạn 1 đoạn
//    cấu hình y hệt object bên dưới. Copy toàn bộ giá trị đó dán đè vào đây.
// 3) Vào mục "Authentication" -> "Sign-in method" -> bật "Email/Password".
//    (KHÔNG dùng Google nữa — web này đăng nhập bằng mã học sinh + mật khẩu).
// 4) Vào mục "Firestore Database" -> "Create database" (chọn chế độ
//    production, khu vực gần Việt Nam, ví dụ asia-southeast1).
// =========================================================================
window.DGNL_FIREBASE_CONFIG = {
    apiKey: "AIzaSyARUgY--HM5YZIF3_04WAibeZnrHxYexHs",
    authDomain: "dgnl-2027.firebaseapp.com",
    projectId: "dgnl-2027",
    storageBucket: "dgnl-2027.firebasestorage.app",
    messagingSenderId: "304374841717",
    appId: "1:304374841717:web:26577502bfedc7314d533c"
};

// =========================================================================
// LƯU Ý VỀ TÀI KHOẢN HỌC SINH (mã học sinh + mật khẩu)
// =========================================================================
// File này KHÔNG chứa danh sách mã học sinh / mật khẩu — vì đây là file
// công khai trên web (ai cũng xem được bằng "View page source"), nên tuyệt
// đối không được để mật khẩu ở đây.
//
// Tài khoản của từng học sinh (mã + mật khẩu) được tạo và lưu AN TOÀN bên
// trong Firebase Authentication bằng script riêng "tao-tai-khoan-hoc-sinh"
// (chạy 1 lần trên máy bạn, không đưa lên web) — xem thư mục
// "cong-cu-quan-tri" và mục hướng dẫn trong HUONG_DAN.md.
//
// Học sinh chỉ cần vào trang web và nhập đúng mã + mật khẩu bạn đã cấp,
// web sẽ gửi thẳng cho Firebase kiểm tra — trang không tự lưu hay so sánh
// mật khẩu bằng code.
