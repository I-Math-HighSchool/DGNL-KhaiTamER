// =========================================================================
// CẤU HÌNH FIREBASE — GIÁO VIÊN CẦN ĐIỀN THÔNG TIN Ở ĐÂY
// =========================================================================
// 1) Vào https://console.firebase.google.com -> Tạo project mới (miễn phí).
// 2) Trong project, vào "Project settings" -> mục "Your apps" -> bấm biểu
//    tượng "</>" (Web) để tạo 1 Web App -> Firebase sẽ đưa cho bạn 1 đoạn
//    cấu hình y hệt object bên dưới. Copy toàn bộ giá trị đó dán đè vào đây.
// 3) Vào mục "Authentication" -> "Sign-in method" -> bật "Google".
//    (Web này đăng nhập bằng Gmail của học sinh qua Google, sau đó kiểm
//    tra email có nằm trong js/danh-sach-duoc-phep.js hay không).
// 4) Vào mục "Authentication" -> "Settings" -> tab "Authorized domains" ->
//    thêm tên miền GitHub Pages của bạn (ví dụ
//    i-math-highschool.github.io) nếu chưa có sẵn trong danh sách.
// 5) Vào mục "Firestore Database" -> "Create database" (chọn chế độ
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
// LƯU Ý VỀ TÀI KHOẢN HỌC SINH (đăng nhập bằng Gmail)
// =========================================================================
// Học sinh đăng nhập bằng chính tài khoản Google (Gmail) của mình — Google
// lo việc xác thực mật khẩu, web này không hề biết/lưu mật khẩu của ai.
//
// Muốn cho phép thêm/bớt học sinh nào được vào web: sửa danh sách email
// trong file js/danh-sach-duoc-phep.js (file đó công khai nhưng KHÔNG có
// gì bí mật, chỉ là danh sách email được duyệt).
