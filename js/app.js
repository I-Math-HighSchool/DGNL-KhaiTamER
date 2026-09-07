// =========================================================================
// ĐGNL ONLINE — ENGINE LUYỆN TẬP (chỉ trắc nghiệm 4 đáp án, có thể theo "bộ"
// dùng chung 1 đoạn nội dung cho 2-3 câu hỏi con)
// =========================================================================

let DGNL_DATA_READY = false;
let currentExam = null; // { groups: [...], timer, timeLeft, submitted }

// ---------------- 0. NẠP TOÀN BỘ FILE DỮ LIỆU CHUYÊN ĐỀ ----------------
function napMotFileDuLieu(src) {
    return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve({ src, ok: true });
        s.onerror = () => { console.warn('Không nạp được file dữ liệu:', src); resolve({ src, ok: false }); };
        document.body.appendChild(s);
    });
}

async function napToanBoDuLieu() {
    const trangThai = document.getElementById('data-load-status');
    const manifest = (window.DGNL_MANIFEST && window.DGNL_MANIFEST.chuyenDe) || [];
    if (manifest.length === 0) {
        trangThai.textContent = coDeThatKhongDe()
            ? 'Chưa có dữ liệu chuyên đề nào trong data/manifest.js (vẫn có Đề tổng hợp thật).'
            : 'Chưa có dữ liệu chuyên đề nào trong data/manifest.js.';
        DGNL_DATA_READY = true;
        populateDropdown();
        capNhatHienThiTheoCheDo();
        document.getElementById('btn-generate').disabled = !coDeThatKhongDe();
        return;
    }
    const ketQua = await Promise.all(manifest.map(m => napMotFileDuLieu(m.file)));
    const soLoi = ketQua.filter(r => !r.ok).length;
    trangThai.textContent = soLoi > 0
        ? `Đã nạp ${ketQua.length - soLoi}/${ketQua.length} chuyên đề (có ${soLoi} lỗi, xem Console).`
        : `Đã nạp xong ${ketQua.length} chuyên đề câu hỏi.`;
    DGNL_DATA_READY = true;
    populateDropdown();
    capNhatHienThiTheoCheDo();
    document.getElementById('btn-generate').disabled = false;
}

// Đếm tổng số câu hỏi thực tế trong 1 mảng "nhóm" (mỗi nhóm có thể chứa
// nhiều câu con dùng chung ngữ cảnh, xem soCauTrongNhom()).
function soCauTrongNhom(nhom) {
    return (nhom.cauHoi && nhom.cauHoi.length) || 0;
}
function demTongCau(danhSachNhom) {
    return danhSachNhom.reduce((t, nhom) => t + soCauTrongNhom(nhom), 0);
}

function populateDropdown() {
    const sel = document.getElementById('select-chuyen-de');
    sel.innerHTML = '';
    const manifest = (window.DGNL_MANIFEST && window.DGNL_MANIFEST.chuyenDe) || [];
    const optTong = document.createElement('option');
    optTong.value = '__TONG_HOP__';
    const soDeThat = (window.DGNL_DE_THAT && window.DGNL_DE_THAT.length) || 0;
    optTong.textContent = soDeThat > 0
        ? '⭐ Đề tổng hợp phần Toán ĐGNL (42 câu · 50 phút, đúng ma trận đề thi thật)'
        : '⭐ Đề tổng hợp phần Toán ĐGNL (random toàn bộ chuyên đề)';
    sel.appendChild(optTong);
    manifest.forEach(m => {
        const arr = (window.DGNL_CHUYEN_DE && window.DGNL_CHUYEN_DE[m.id]) || [];
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.ten} (${demTongCau(arr)} câu)`;
        sel.appendChild(opt);
    });
}

// ---------------- 1. TIỆN ÍCH ----------------
function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function taoNguonCauHoi(chuyenDeId) {
    if (chuyenDeId === '__TONG_HOP__') {
        const manifest = (window.DGNL_MANIFEST && window.DGNL_MANIFEST.chuyenDe) || [];
        let pool = [];
        manifest.forEach(m => {
            const arr = (window.DGNL_CHUYEN_DE && window.DGNL_CHUYEN_DE[m.id]) || [];
            pool = pool.concat(arr);
        });
        return pool;
    }
    return (window.DGNL_CHUYEN_DE && window.DGNL_CHUYEN_DE[chuyenDeId]) || [];
}

// Chế độ "Đề tổng hợp phần Toán ĐGNL" khi ĐÃ có dữ liệu đề thi thật
// (window.DGNL_DE_THAT): thay vì random rời rạc từng câu/từng cụm từ 14
// chuyên đề riêng lẻ (không đúng cấu trúc đề thi thật vì thiếu hẳn 1 số
// dạng như Tích phân, Oxyz, Tư duy logic, Đọc biểu đồ/bảng số liệu...),
// mỗi lần tạo đề sẽ LẤY NGUYÊN 1 ĐỀ THẬT (đủ 42 câu, đúng thứ tự, đúng cụm)
// trong số các đề chính thức đã có, chọn ngẫu nhiên — vẫn xáo trộn thứ tự
// 4 đáp án của từng câu như các chế độ luyện tập khác.
function coDeThatKhongDe() {
    return !!(window.DGNL_DE_THAT && window.DGNL_DE_THAT.length > 0);
}

// ---------------- 2. TẠO ĐỀ ----------------
function taoDe() {
    const chuyenDeId = document.getElementById('select-chuyen-de').value;
    const chuyenDeTen = document.getElementById('select-chuyen-de').selectedOptions[0].textContent;

    if (chuyenDeId === '__TONG_HOP__' && coDeThatKhongDe()) {
        taoDeTongHopThat(chuyenDeTen);
        return;
    }

    let soCauMongMuon = parseInt(document.getElementById('input-so-cau').value, 10) || 20;

    // pool: mảng các "nhóm" — mỗi nhóm có thể là 1 câu độc lập (cauHoi có
    // đúng 1 phần tử) hoặc 1 CỤM nhiều câu dùng chung ngữ cảnh (cauHoi có
    // 2-5 phần tử, ví dụ các câu hỏi cùng dựa trên 1 hình vẽ/1 dãy số).
    const pool = taoNguonCauHoi(chuyenDeId);
    const tongCauCoSan = demTongCau(pool);
    if (tongCauCoSan === 0) {
        alert('Chuyên đề này chưa có câu hỏi nào.');
        return;
    }
    soCauMongMuon = Math.min(soCauMongMuon, tongCauCoSan);

    // Chọn NGUYÊN CẢ CỤM — KHÔNG BAO GIỜ tách rời các câu dùng chung ngữ
    // cảnh ra khỏi nhau (câu sau có thể phụ thuộc kết quả câu trước), nên
    // số câu thực tế có thể nhỉnh hơn 1 chút so với số câu bạn nhập nếu
    // cụm cuối cùng được chọn có nhiều hơn 1 câu.
    const nhomXaoTron = shuffleArray(pool);
    const nhomDaChon = [];
    let tongDaChon = 0;
    for (const nhom of nhomXaoTron) {
        if (tongDaChon >= soCauMongMuon) break;
        nhomDaChon.push(nhom);
        tongDaChon += soCauTrongNhom(nhom);
    }

    const groups = nhomDaChon.map(xaoTronDapAnNhom);

    const enableTimer = document.getElementById('check-timer').checked;
    const soPhut = parseInt(document.getElementById('input-so-phut').value, 10) || 30;

    batDauLamBai(chuyenDeTen, groups, enableTimer, soPhut);
}

// Xáo trộn thứ tự 4 đáp án của TỪNG câu trong 1 nhóm/cụm — giữ nguyên THỨ
// TỰ các câu con trong cụm (câu sau có thể tham chiếu kết quả câu trước).
function xaoTronDapAnNhom(nhom) {
    const cauHoi = nhom.cauHoi.map(q => {
        const order = shuffleArray([0, 1, 2, 3]);
        const choices = order.map(i => q.choices[i]);
        const correctIndex = order.indexOf(q.correctIndex);
        return { question: q.question, choices, correctIndex, explain: q.explain };
    });
    return { noiDungChung: nhom.noiDungChung || null, cauHoi };
}

// Khởi tạo currentExam + hiển thị + (tuỳ chọn) chạy đồng hồ đếm giờ — dùng
// chung cho cả 2 chế độ: luyện tập theo chuyên đề và đề tổng hợp thật.
// soCauBatDau: số thứ tự hiển thị của câu ĐẦU TIÊN (mặc định 1) — phần
// "Đề tổng hợp phần Toán ĐGNL" tương ứng đúng câu 61-102 của đề thi thật nên
// đánh số bắt đầu từ 61 để khớp với đề gốc, tiện cho việc sau này ghép thêm
// các phần/môn khác (mỗi phần giữ đúng dải số thứ tự thật của nó).
function batDauLamBai(chuyenDeTen, groups, enableTimer, soPhut, soCauBatDau) {
    currentExam = {
        chuyenDeTen,
        groups,
        submitted: false,
        timeLeft: enableTimer ? soPhut * 60 : null,
        timer: null,
        startedAt: Date.now(),
        soCauBatDau: soCauBatDau || 1
    };

    renderExam();
    if (enableTimer) startTimer();
    else document.getElementById('timer-box').style.display = 'none';
}

// Chế độ "Đề tổng hợp phần Toán ĐGNL" — lấy ngẫu nhiên NGUYÊN 1 đề thi
// chính thức (đủ 42 câu, giữ đúng thứ tự + cụm câu hỏi như đề thật), luôn
// bật đồng hồ 50 phút bất kể người dùng có tick "Bật đếm giờ" hay không
// (2 ô nhập "Số câu hỏi" / "Bật đếm giờ" đã bị ẩn ở chế độ này, xem
// capNhatHienThiTheoCheDo()).
function taoDeTongHopThat(chuyenDeTenGoc) {
    const danhSachDe = window.DGNL_DE_THAT || [];
    const de = danhSachDe[Math.floor(Math.random() * danhSachDe.length)];
    const groups = de.nhom.map(xaoTronDapAnNhom);
    const chuyenDeTen = `${chuyenDeTenGoc} — ${de.ten}`;
    batDauLamBai(chuyenDeTen, groups, true, 50, 61);
}

// ---------------- 3. HIỂN THỊ ĐỀ ----------------
function renderExam() {
    document.getElementById('welcome-panel').style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'block';
    document.getElementById('submit-wrap').style.display = 'block';
    document.getElementById('score-wrap').style.display = 'none';

    const container = document.getElementById('questions-container');
    const grid = document.getElementById('progress-grid');
    container.innerHTML = '';
    grid.innerHTML = '';

    // soCauBatDau: số câu ĐẦU TIÊN được đánh số (mặc định 1) — "Đề tổng hợp
    // phần Toán ĐGNL" ứng đúng câu 61-102 của đề thật nên bắt đầu từ 61,
    // thay vì luôn đánh lại từ 1, để khớp số câu với đề gốc (tiện ghép thêm
    // các phần/môn khác sau này, mỗi phần giữ đúng dải số của nó).
    let qNo = (currentExam.soCauBatDau || 1) - 1;
    currentExam.groups.forEach((group, gIdx) => {
        const groupDiv = document.createElement('div');
        // Cụm nhiều câu dùng chung dữ kiện: LUÔN bọc trong 1 khung riêng có
        // viền + nền nhạt để ranh giới cụm rõ ràng — kể cả khi cụm không có
        // đoạn "dữ kiện chung" tách riêng (VD nhiều câu cùng dựa vào 1 hàm số
        // đã nêu ở câu trước) — trước đây những cụm dạng này chỉ có 1 viền
        // dọc kéo dài liên tục qua nhiều câu, không có điểm bắt đầu/kết thúc
        // rõ ràng nên nhìn như bị lỗi giao diện.
        const isMultiGroup = group.cauHoi.length > 1;
        groupDiv.className = isMultiGroup ? 'group-block group-block-cum' : 'group-block';

        // Câu dẫn dùng chung viết đúng văn phong đề thi thật: "Dựa vào
        // thông tin sau, trả lời các câu hỏi X, Y, Z." — tính sẵn dải số
        // câu thật sự sẽ hiển thị cho cụm này (dùng đúng số đã cộng dồn từ
        // soCauBatDau, không phải số thứ tự nội bộ trong nhóm).
        let soCauCumStr = '';
        if (isMultiGroup) {
            const soDau = qNo + 1;
            const soCuoi = qNo + group.cauHoi.length;
            const ds = [];
            for (let n = soDau; n <= soCuoi; n++) ds.push(n);
            soCauCumStr = ds.join(', ');
        }

        if (isMultiGroup) {
            const nhan = document.createElement('div');
            nhan.className = 'shared-context-label';
            nhan.innerHTML = `<i class="fa-solid fa-link"></i> Dựa vào thông tin sau, trả lời các câu hỏi ${soCauCumStr}.`;
            groupDiv.appendChild(nhan);
        }
        if (group.noiDungChung) {
            const ctx = document.createElement('div');
            ctx.className = 'shared-context';
            ctx.innerHTML = group.noiDungChung;
            groupDiv.appendChild(ctx);
        }

        // Gói các ô "tiến độ" của cụm đó lại với nhau (viền riêng) để học
        // sinh nhận ra ngay các câu này liên quan đến nhau, dễ quan sát hơn.
        let progressGroupWrap = null;
        if (isMultiGroup) {
            progressGroupWrap = document.createElement('div');
            progressGroupWrap.className = 'progress-cum-wrap';
            progressGroupWrap.title = `Dựa vào thông tin sau, trả lời các câu hỏi ${soCauCumStr}.`;
        }

        group.cauHoi.forEach((q, cIdx) => {
            qNo++;
            const globalNo = qNo;
            const qDiv = document.createElement('div');
            qDiv.className = isMultiGroup ? 'question-item question-item-cum' : 'question-item';
            qDiv.id = 'question-' + globalNo;

            const qText = document.createElement('div');
            qText.className = 'question-text';
            qText.innerHTML = `<span class="text-primary">Câu ${globalNo}:</span> ${q.question}`;
            qDiv.appendChild(qText);

            q.choices.forEach((choiceHtml, oIdx) => {
                const wrap = document.createElement('label');
                wrap.className = 'custom-option-wrapper';
                wrap.id = `opt-${globalNo}-${oIdx}`;
                wrap.innerHTML = `
                    <input class="form-check-input" type="radio" name="q_${globalNo}" value="${oIdx}">
                    <span class="form-check-label">${String.fromCharCode(65 + oIdx)}. ${choiceHtml}</span>
                `;
                wrap.querySelector('input').addEventListener('change', () => {
                    document.getElementById('progress-' + globalNo).classList.add('answered');
                });
                qDiv.appendChild(wrap);
            });

            const explainDiv = document.createElement('div');
            explainDiv.className = 'explain-box';
            explainDiv.id = 'explain-' + globalNo;
            explainDiv.innerHTML = `<b>Lời giải:</b><br>${q.explain || '(chưa có lời giải)'}`;
            qDiv.appendChild(explainDiv);

            qDiv.dataset.correct = q.correctIndex;
            groupDiv.appendChild(qDiv);

            const box = document.createElement('div');
            box.className = 'progress-box';
            box.id = 'progress-' + globalNo;
            box.textContent = globalNo;
            box.addEventListener('click', () => {
                document.getElementById('question-' + globalNo).scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            (progressGroupWrap || grid).appendChild(box);
        });

        if (progressGroupWrap) grid.appendChild(progressGroupWrap);

        container.appendChild(groupDiv);
    });

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([container]).catch(err => console.error('MathJax lỗi:', err));
    }
}

// ---------------- 4. ĐỒNG HỒ ĐẾM GIỜ ----------------
function startTimer() {
    const box = document.getElementById('timer-box');
    box.style.display = 'block';
    updateTimerDisplay();
    currentExam.timer = setInterval(() => {
        currentExam.timeLeft--;
        updateTimerDisplay();
        if (currentExam.timeLeft <= 0) {
            clearInterval(currentExam.timer);
            submitExam();
        }
    }, 1000);
}
function updateTimerDisplay() {
    const t = Math.max(0, currentExam.timeLeft);
    const mm = String(Math.floor(t / 60)).padStart(2, '0');
    const ss = String(t % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${mm}:${ss}`;
}

// ---------------- 5. NỘP BÀI & CHẤM ĐIỂM ----------------
function submitExam() {
    if (!currentExam || currentExam.submitted) return;
    currentExam.submitted = true;
    if (currentExam.timer) clearInterval(currentExam.timer);

    let soCau = 0, soDung = 0;
    document.querySelectorAll('.question-item').forEach(qDiv => {
        soCau++;
        const globalNo = qDiv.id.split('-')[1];
        const correctIndex = parseInt(qDiv.dataset.correct, 10);
        const checked = qDiv.querySelector('input[type=radio]:checked');
        const chosenIndex = checked ? parseInt(checked.value, 10) : -1;
        const isCorrect = chosenIndex === correctIndex;
        if (isCorrect) soDung++;

        for (let i = 0; i < 4; i++) {
            const optDiv = document.getElementById(`opt-${globalNo}-${i}`);
            const input = optDiv.querySelector('input');
            input.disabled = true;
            if (i === correctIndex) optDiv.classList.add('option-correct');
            else if (i === chosenIndex) optDiv.classList.add('option-wrong');
        }
        document.getElementById('explain-' + globalNo).style.display = 'block';
        const progBox = document.getElementById('progress-' + globalNo);
        progBox.classList.add(isCorrect ? 'correct-box' : 'wrong-box');
    });

    const diem = Math.round((soDung / soCau) * 10 * 100) / 100;
    const scoreBox = document.getElementById('score-wrap');
    scoreBox.style.display = 'block';
    scoreBox.innerHTML = `<i class="fa-solid fa-star"></i> Kết quả: đúng ${soDung}/${soCau} câu — Điểm: <span style="font-size:1.3rem;">${diem}</span>/10`;
    document.getElementById('submit-wrap').style.display = 'none';

    const thoiGianLamBai = currentExam.timeLeft !== null
        ? (Math.round((Date.now() - currentExam.startedAt) / 1000))
        : (Math.round((Date.now() - currentExam.startedAt) / 1000));

    if (window.DGNL_AUTH && window.DGNL_AUTH.saveResult) {
        window.DGNL_AUTH.saveResult({
            chuyenDe: currentExam.chuyenDeTen,
            soCau, soDung, diem,
            thoiGianLamBai
        });
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([document.getElementById('questions-container')]);
    }
}

// ---------------- 6. LỊCH SỬ LÀM BÀI ----------------
async function hienThiLichSu() {
    const modalEl = document.getElementById('history-modal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    const body = document.getElementById('history-body');
    body.innerHTML = '<div class="text-center text-muted py-4">Đang tải lịch sử...</div>';

    const history = await (window.DGNL_AUTH && window.DGNL_AUTH.loadHistory ? window.DGNL_AUTH.loadHistory() : []);
    if (!history || history.length === 0) {
        body.innerHTML = '<div class="text-center text-muted py-4">Chưa có lịch sử làm bài nào.</div>';
        return;
    }
    body.innerHTML = history.map(h => {
        const good = h.diem >= 5;
        let ngay = '';
        try {
            if (h.thoiDiem && h.thoiDiem.toDate) ngay = h.thoiDiem.toDate().toLocaleString('vi-VN');
        } catch (e) {}
        return `
        <div class="history-item">
            <div>
                <div class="fw-bold">${h.chuyenDe || ''}</div>
                <div class="small text-muted">${ngay} · ${h.soDung}/${h.soCau} câu đúng</div>
            </div>
            <div class="h-score ${good ? 'good' : 'bad'}">${h.diem}/10</div>
        </div>`;
    }).join('');
}

// ---------------- 7. GẮN SỰ KIỆN ----------------

// Ở chế độ "Đề tổng hợp phần Toán ĐGNL" (khi đã có dữ liệu đề thi thật):
// ẩn "Số câu hỏi" + "Bật đếm giờ làm bài" (đề luôn cố định 42 câu/50 phút,
// không cho tuỳ chỉnh) và hiện dòng ghi chú thay thế; các chuyên đề khác
// vẫn giữ nguyên như cũ.
function capNhatHienThiTheoCheDo() {
    const chuyenDeId = document.getElementById('select-chuyen-de').value;
    const laTongHopThat = chuyenDeId === '__TONG_HOP__' && coDeThatKhongDe();
    document.getElementById('wrap-so-cau').style.display = laTongHopThat ? 'none' : '';
    document.getElementById('wrap-check-timer').style.display = laTongHopThat ? 'none' : '';
    if (laTongHopThat) {
        document.getElementById('timer-minutes-wrap').style.display = 'none';
    } else {
        document.getElementById('timer-minutes-wrap').style.display =
            document.getElementById('check-timer').checked ? 'block' : 'none';
    }
}
document.getElementById('select-chuyen-de').addEventListener('change', capNhatHienThiTheoCheDo);

document.getElementById('check-timer').addEventListener('change', (e) => {
    document.getElementById('timer-minutes-wrap').style.display = e.target.checked ? 'block' : 'none';
});
document.getElementById('btn-generate').addEventListener('click', taoDe);
document.getElementById('btn-submit').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn nộp bài?')) submitExam();
});
document.getElementById('btn-show-history').addEventListener('click', hienThiLichSu);

document.addEventListener('dgnl-auth-ready', () => {
    napToanBoDuLieu();
});
