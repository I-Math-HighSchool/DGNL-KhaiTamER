// =========================================================================
// ĐĂNG NHẬP BẰNG MÃ HỌC SINH + MẬT KHẨU (Firebase Auth - Email/Password)
// =========================================================================
// Mã học sinh (VD 72301) được quy đổi thành 1 "email nội bộ" dạng
// 72301@dgnl-hocsinh.local để dùng chung cơ chế Email/Password có sẵn của
// Firebase — học sinh không cần biết/quan tâm chuyện này, chỉ thấy khung
// nhập Mã học sinh + Mật khẩu bình thường.
//
// Tài khoản của từng em (mã + mật khẩu thật) được tạo AN TOÀN trực tiếp
// trong Firebase bằng script riêng (xem thư mục cong-cu-quan-tri), KHÔNG
// nằm trong file web này — nên ai xem code trang web cũng không thấy được
// mật khẩu của bất kỳ ai.
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

    const TEN_MIEN_NOI_BO = 'dgnl-hocsinh.local';

    function maToEmail(ma) {
        return (ma || '').trim().toLowerCase() + '@' + TEN_MIEN_NOI_BO;
    }

    function layMaTuEmail(email) {
        return (email || '').split('@')[0];
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
        document.getElementById('user-email').textContent = user.displayName || layMaTuEmail(user.email);
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
                window.DGNL_AUTH.user = user;
                window.DGNL_AUTH.db = db;
                showApp(user);
            } else {
                showLogin();
            }
        });

        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', function (e) {
                e.preventDefault();
                hideLoginError();
                const ma = document.getElementById('input-ma-hs').value.trim();
                const matKhau = document.getElementById('input-mat-khau').value;
                if (!ma || !matKhau) {
                    showLoginError('Vui lòng nhập đầy đủ mã học sinh và mật khẩu.');
                    return;
                }
                setLoading(true);
                auth.signInWithEmailAndPassword(maToEmail(ma), matKhau).catch(function (err) {
                    setLoading(false);
                    console.error(err);
                    let msg = 'Sai mã học sinh hoặc mật khẩu.';
                    if (err.code === 'auth/too-many-requests') {
                        msg = 'Bạn nhập sai quá nhiều lần, vui lòng thử lại sau ít phút.';
                    } else if (err.code === 'auth/network-request-failed') {
                        msg = 'Lỗi kết nối mạng, vui lòng thử lại.';
                    } else if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
                        msg = 'Web chưa được cấu hình Firebase đúng cách, vui lòng liên hệ giáo viên.';
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
            const maHocSinh = layMaTuEmail(window.DGNL_AUTH.user.email);
            try {
                await db.collection('ketqua').add({
                    uid: uid,
                    maHocSinh: maHocSinh,
                    ten: window.DGNL_AUTH.user.displayName || '',
                    chuyenDe: result.chuyenDe,
                    soCau: result.soCau,
                    soDung: result.soDung,
                    diem: result.diem,
                    thoiGianLamBai: result.thoiGianLamBai || null,
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
                return snap.docs.map(d => d.data());
            } catch (e) {
                console.error('Lỗi khi tải lịch sử từ Firestore:', e);
                return [];
            }
        };
    } else {
        showLoginError('Chưa cấu hình Firebase (xem js/firebase-config.js).');
    }
})();
