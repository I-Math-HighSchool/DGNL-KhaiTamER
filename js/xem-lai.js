// =========================================================================
// TRANG "XEM LẠI BÀI LÀM" — mở qua đường dẫn xem-lai.html?id=<mã bài làm>.
// Mã bài làm (id) được lấy trong lịch sử làm bài, hoặc trong file Excel xuất
// từ trang quản lý kết quả (bao-cao-ket-qua.html). Ai xem được bài nào do
// đúng NGƯỜI LÀM bài đó hoặc GIÁO VIÊN mới xem được — quyền này được kiểm
// tra ở Firestore Security Rules (xem HUONG_DAN.md), không chỉ ở đây.
// =========================================================================
(function () {
    const params = new URLSearchParams(location.search);
    const docId = params.get('id');
    const TEACHER_EMAIL = 'thuthuy611103@gmail.com';

    let app, auth, db;
    try {
        app = firebase.initializeApp(window.DGNL_FIREBASE_CONFIG);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error('Không khởi tạo được Firebase. Kiểm tra js/firebase-config.js', e);
    }

    const DANH_SACH_DUOC_PHEP = (window.DGNL_ALLOWED_EMAILS || []).map(e => (e || '').trim().toLowerCase());
    function duocPhep(email) {
        const e = (email || '').trim().toLowerCase();
        return DANH_SACH_DUOC_PHEP.indexOf(e) !== -1 || e === TEACHER_EMAIL;
    }

    function showLoginError(msg) {
        const box = document.getElementById('login-error');
        box.textContent = msg;
        box.style.display = 'block';
    }
    function setLoading(isLoading) {
        document.getElementById('login-loading').style.display = isLoading ? 'block' : 'none';
        const btn = document.getElementById('btn-dang-nhap');
        if (btn) btn.disabled = isLoading;
    }
    function showErr(msg) {
        document.getElementById('loading-box').style.display = 'none';
        const err = document.getElementById('err-box');
        err.style.display = 'block';
        err.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:#ef4444;"></i><p class="mt-3">${msg}</p>`;
    }

    async function taiBaiLam() {
        if (!docId) { showErr('Thiếu mã bài làm trong đường dẫn.'); return; }
        if (!db) { showErr('Chưa cấu hình Firebase.'); return; }
        try {
            const doc = await db.collection('ketqua').doc(docId).get();
            if (!doc.exists) { showErr('Không tìm thấy bài làm này (có thể đã bị xoá).'); return; }
            renderBaiLam(doc.data());
        } catch (e) {
            console.error('Lỗi khi tải bài làm:', e);
            showErr('Bạn không có quyền xem bài làm này, hoặc đã có lỗi xảy ra.');
        }
    }

    function renderBaiLam(d) {
        document.getElementById('loading-box').style.display = 'none';
        document.getElementById('content-box').style.display = 'block';

        let ngay = '';
        try { if (d.thoiDiem && d.thoiDiem.toDate) ngay = d.thoiDiem.toDate().toLocaleString('vi-VN'); } catch (e) {}
        const good = (d.diem || 0) >= 5;
        const phut = d.thoiGianLamBai ? Math.floor(d.thoiGianLamBai / 60) : 0;
        const giay = d.thoiGianLamBai ? d.thoiGianLamBai % 60 : 0;

        document.getElementById('meta-box').innerHTML = `
            <div class="m-row"><span>Học sinh</span><b>${(d.ten || '(chưa rõ tên)')} — ${d.email || ''}</b></div>
            <div class="m-row"><span>Đề đã làm</span><b>${d.chuyenDe || ''}</b></div>
            <div class="m-row"><span>Thời gian nộp</span><b>${ngay}</b></div>
            <div class="m-row"><span>Thời gian làm bài</span><b>${phut} phút ${giay} giây</b></div>
            <div class="m-row"><span>Kết quả</span><span class="meta-score ${good ? 'good' : 'bad'}">${d.soDung}/${d.soCau} câu đúng — ${d.diem}/10</span></div>
        `;

        const container = document.getElementById('questions-container');
        container.innerHTML = (d.chiTiet && d.chiTiet.length)
            ? d.chiTiet.join('')
            : '<div class="text-muted text-center py-4">Bài làm này chưa có dữ liệu chi tiết để xem lại (được nộp trước khi có tính năng này).</div>';

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([container]).catch(err => console.error('MathJax lỗi:', err));
        }
    }

    function showApp() {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-root').style.display = 'block';
        taiBaiLam();
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
                    showLoginError('Email ' + user.email + ' chưa được đăng ký sử dụng web này.');
                    return;
                }
                showApp();
            } else {
                showLogin();
            }
        });

        const btnDangNhap = document.getElementById('btn-dang-nhap');
        if (btnDangNhap) {
            btnDangNhap.addEventListener('click', function () {
                document.getElementById('login-error').style.display = 'none';
                setLoading(true);
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(function (err) {
                    setLoading(false);
                    console.error(err);
                    showLoginError('Đăng nhập thất bại, vui lòng thử lại.');
                });
            });
        }
    } else {
        showLoginError('Chưa cấu hình Firebase (xem js/firebase-config.js).');
    }
})();
