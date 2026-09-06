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
        trangThai.textContent = 'Chưa có dữ liệu chuyên đề nào trong data/manifest.js.';
        return;
    }
    const ketQua = await Promise.all(manifest.map(m => napMotFileDuLieu(m.file)));
    const soLoi = ketQua.filter(r => !r.ok).length;
    trangThai.textContent = soLoi > 0
        ? `Đã nạp ${ketQua.length - soLoi}/${ketQua.length} chuyên đề (có ${soLoi} lỗi, xem Console).`
        : `Đã nạp xong ${ketQua.length} chuyên đề câu hỏi.`;
    DGNL_DATA_READY = true;
    populateDropdown();
    document.getElementById('btn-generate').disabled = false;
}

function populateDropdown() {
    const sel = document.getElementById('select-chuyen-de');
    sel.innerHTML = '';
    const manifest = (window.DGNL_MANIFEST && window.DGNL_MANIFEST.chuyenDe) || [];
    const optTong = document.createElement('option');
    optTong.value = '__TONG_HOP__';
    optTong.textContent = '⭐ Đề tổng hợp phần Toán ĐGNL (random toàn bộ chuyên đề)';
    sel.appendChild(optTong);
    manifest.forEach(m => {
        const arr = (window.DGNL_CHUYEN_DE && window.DGNL_CHUYEN_DE[m.id]) || [];
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.ten} (${arr.length} câu)`;
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

// ---------------- 2. TẠO ĐỀ ----------------
function taoDe() {
    const chuyenDeId = document.getElementById('select-chuyen-de').value;
    const chuyenDeTen = document.getElementById('select-chuyen-de').selectedOptions[0].textContent;
    let soCau = parseInt(document.getElementById('input-so-cau').value, 10) || 20;

    const pool = taoNguonCauHoi(chuyenDeId);
    if (pool.length === 0) {
        alert('Chuyên đề này chưa có câu hỏi nào.');
        return;
    }
    soCau = Math.min(soCau, pool.length);
    const chosen = shuffleArray(pool).slice(0, soCau);

    // Mỗi câu hỏi độc lập được coi là 1 "bộ" chỉ có 1 câu con, để dùng
    // chung 1 cơ chế hiển thị/chấm điểm với các đề có nhiều câu con dùng
    // chung 1 đoạn nội dung (noiDungChung).
    const groups = chosen.map(q => {
        // xáo trộn thứ tự 4 đáp án nhưng vẫn theo dõi đúng đáp án đúng
        const order = shuffleArray([0, 1, 2, 3]);
        const choices = order.map(i => q.choices[i]);
        const correctIndex = order.indexOf(q.correctIndex);
        return {
            noiDungChung: q.noiDungChung || null,
            cauHoi: [{ question: q.question, choices, correctIndex, explain: q.explain }]
        };
    });

    const enableTimer = document.getElementById('check-timer').checked;
    const soPhut = parseInt(document.getElementById('input-so-phut').value, 10) || 30;

    currentExam = {
        chuyenDeTen,
        groups,
        submitted: false,
        timeLeft: enableTimer ? soPhut * 60 : null,
        timer: null,
        startedAt: Date.now()
    };

    renderExam();
    if (enableTimer) startTimer();
    else document.getElementById('timer-box').style.display = 'none';
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

    let qNo = 0;
    currentExam.groups.forEach((group, gIdx) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group-block';

        if (group.noiDungChung) {
            const ctx = document.createElement('div');
            ctx.className = 'shared-context';
            ctx.innerHTML = group.noiDungChung;
            groupDiv.appendChild(ctx);
        }

        group.cauHoi.forEach((q, cIdx) => {
            qNo++;
            const globalNo = qNo;
            const qDiv = document.createElement('div');
            qDiv.className = 'question-item';
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
            grid.appendChild(box);
        });

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
