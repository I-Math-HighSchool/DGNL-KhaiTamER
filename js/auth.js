// =========================================================================
// ĐĂNG NHẬP BẰNG GOOGLE (Gmail) + DANH SÁCH ĐƯỢC PHÉP
// =========================================================================
// Học sinh đăng nhập bằng chính tài khoản Google (Gmail) của mình. Sau khi
// đăng nhập, web kiểm tra email đó có nằm trong danh sách
// window.DGNL_ALLOWED_EMAILS (xem js/danh-sach-duoc-phep.js) không:
//   - Nếu CÓ trong danh sách -> cho vào web bình thường.
//   - Nếu KHÔNG có -> lập tức đăng xuất, báo "Email chưa được đăng ký".
// Nhờ vậy chỉ những học sinh đã đăng ký gmail với giáo viên mới vào được,
// mà giáo viên không cần tạo/tự đặt mật khẩu cho ai cả (Google lo việc đó).
(function () {
    let app, auth, db;
    try {
        app = firebase.initializeApp(window.DGNL_FIREBASE_CONFIG);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error('Không khởi tạo được Firebase. Kiểm tra js/firebase-config.js', e);
    }

    window.DGNL_AUTH = {
        user: null,
        db: null,
        saveResult: async function () { console.warn('Firebase chưa sẵn sàng, không lưu được kết quả.'); },
        loadHistory: async function () { return []; }
    };

    const DANH_SACH_DUOC_PHEP = (window.DGNL_ALLOWED_EMAILS || []).map(e => (e || '').trim().toLowerCase());

    function duocPhep(email) {
        return DANH_SACH_DUOC_PHEP.indexOf((email || '').trim().toLowerCase()) !== -1;
    }

    function showLoginError(msg) {
        const box = document.getElementById('login-error');
        box.textContent = msg;
        box.style.display = 'block';
    }
    function hideLoginError() {
        document.getElementById('login-error').style.display = 'none';
    }
    function setLoading(isLoading) {
        document.getElementById('login-loading').style.display = isLoading ? 'block' : 'none';
        const btn = document.getElementById('btn-dang-nhap');
        if (btn) btn.disabled = isLoading;
    }

    function showApp(user) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-root').style.display = 'block';
        document.getElementById('user-email').textContent = user.displayName || user.email;
        const avatarWrap = document.getElementById('user-avatar-wrap');
        if (avatarWrap) {
            if (user.photoURL) {
                avatarWrap.innerHTML = '<img src="' + user.photoURL + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
            } else {
                avatarWrap.innerHTML = '<i class="fa-solid fa-user"></i>';
            }
        }
        document.dispatchEvent(new CustomEvent('dgnl-auth-ready', { detail: { user } }));
    }

    function showLogin() {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('app-root').style.display = 'none';
    }

    if (auth) {
        auth.onAuthStateChanged(function (user) {
            setLoading(false);
            if (user) {
                if (!duocPhep(user.email)) {
                    auth.signOut();
                    showLoginError('Email ' + user.email + ' chưa được đăng ký sử dụng web này. Vui lòng liên hệ giáo viên để được thêm vào danh sách.');
                    return;
                }
                window.DGNL_AUTH.user = user;
                window.DGNL_AUTH.db = db;
                showApp(user);
            } else {
                window.DGNL_AUTH.user = null;
                showLogin();
            }
        });

        const btnDangNhap = document.getElementById('btn-dang-nhap');
        if (btnDangNhap) {
            btnDangNhap.addEventListener('click', function () {
                hideLoginError();
                setLoading(true);
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(function (err) {
                    setLoading(false);
                    console.error(err);
                    let msg = 'Đăng nhập thất bại, vui lòng thử lại.';
                    if (err.code === 'auth/popup-closed-by-user') {
                        msg = 'Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.';
                    } else if (err.code === 'auth/network-request-failed') {
                        msg = 'Lỗi kết nối mạng, vui lòng thử lại.';
                    } else if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
                        msg = 'Web chưa được cấu hình Firebase đúng cách, vui lòng liên hệ giáo viên.';
                    } else if (err.code === 'auth/unauthorized-domain') {
                        msg = 'Tên miền này chưa được cấp phép đăng nhập Google, vui lòng liên hệ giáo viên.';
                    }
                    showLoginError(msg);
                });
            });
        }

        document.getElementById('btn-logout').addEventListener('click', function () {
            auth.signOut();
        });

        // ---- Lưu / đọc lịch sử làm bài trong Firestore ----
        window.DGNL_AUTH.saveResult = async function (result) {
            if (!db || !window.DGNL_AUTH.user) return;
            const uid = window.DGNL_AUTH.user.uid;
            try {
                await db.collection('ketqua').add({
                    uid: uid,
                    email: window.DGNL_AUTH.user.email,
                    ten: window.DGNL_AUTH.user.displayName || '',
                    chuyenDe: result.chuyenDe,
                    soCau: result.soCau,
                    soDung: result.soDung,
                    diem: result.diem,
                    thoiGianLamBai: result.thoiGianLamBai || null,
                    // Lưu lại toàn bộ HTML từng câu (đã chấm) để dùng cho trang
                    // "Xem lại bài làm" (xem-lai.html) — giáo viên và học sinh
                    // mở lại đúng y hệt bài đã làm mà không cần tạo lại đề.
                    chiTiet: result.chiTiet || [],
                    thoiDiem: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.error('Lỗi khi lưu kết quả vào Firestore:', e);
            }
        };

        window.DGNL_AUTH.loadHistory = async function () {
            if (!db || !window.DGNL_AUTH.user) return [];
            const uid = window.DGNL_AUTH.user.uid;
            try {
                const snap = await db.collection('ketqua')
                    .where('uid', '==', uid)
                    .orderBy('thoiDiem', 'desc')
                    .limit(50)
                    .get();
                return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
            } catch (e) {
                console.error('Lỗi khi tải lịch sử từ Firestore:', e);
                return [];
            }
        };
    } else {
        showLoginError('Chưa cấu hình Firebase (xem js/firebase-config.js).');
    }
})();
