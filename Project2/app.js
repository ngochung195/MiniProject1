// POS-01: KHỞI TẠO CẤU TRÚC DỮ LIỆU (MOCK DATA)
const MOVIE = { name: "Avengers: Endgame", basePrice: 100000 };

// Quy ước loại ghế: 0: Thường, 1: VIP, 2: Couple
// Quy ước trạng thái: empty (trống), selected (đang chọn), sold (đã bán)

const ROWS = 5;
const COLS = 8;

let seatMap = [];
let totalRevenue = 0;

function initData() {
    if (localStorage.getItem('seatMap')) {
        seatMap = JSON.parse(localStorage.getItem('seatMap'));
    } else {
        for (let r = 0; r < ROWS; r++) {
            let row = [];
            for (let c = 0; c < COLS; c++) {
                let type = 0;
                if (r === 2 || r === 3) type = 1;
                if (r === 4) type = 2;

                row.push({
                    type: type,
                    status: 'empty'
                });
            }
            seatMap.push(row);
        }
    }

    if (localStorage.getItem('totalRevenue')) {
        totalRevenue = parseFloat(localStorage.getItem('totalRevenue'));
    }
}

// POS-02 & POS-04: RENDER GIAO DIỆN & TÍNH TOÁN GIÁ VÉ VỚI SWITCH-CASE
function getSeatClassName(seat) {
    if (seat.status === 'sold') return 'seat sold';
    if (seat.status === 'selected') return 'seat selected';

    return seat.type === 1 ? 'seat vip' : (seat.type === 2 ? 'seat couple' : 'seat empty');
}

function getSeatPrice(type) {
    switch (type) {
        case 1: return MOVIE.basePrice * 1.5;
        case 2: return MOVIE.basePrice * 2.0;
        default: return MOVIE.basePrice * 1.0;
    }
}

function getSeatTypeName(type) {
    switch (type) {
        case 1: return "VIP";
        case 2: return "Couple";
        default: return "Thường";
    }
}

function renderSeats() {
    const grid = document.getElementById('seatingGrid');
    grid.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const seat = seatMap[r][c];
            const btn = document.createElement('button');

            const rowLabel = String.fromCharCode(65 + r);
            btn.innerText = `${rowLabel}${c + 1}`;

            btn.className = getSeatClassName(seat);

            if (seat.status !== 'sold') {
                btn.addEventListener('click', () => toggleSeat(r, c));
            }

            grid.appendChild(btn);
        }
    }
}

// POS-03: XỬ LÝ TƯƠNG TÁC CHỌN GHẾ & GIỎ HÀNG REAL-TIME WITH REDUCE
function toggleSeat(r, c) {
    const seat = seatMap[r][c];
    if (seat.status === 'empty') {
        seat.status = 'selected';
    } else if (seat.status === 'selected') {
        seat.status = 'empty';
    }

    renderSeats();
    updateCart();
}

function updateCart() {
    let selectedSeats = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (seatMap[r][c].status === 'selected') {
                selectedSeats.push({
                    row: r,
                    col: c,
                    type: seatMap[r][c].type,
                    name: `${String.fromCharCode(65 + r)}${c + 1}`
                });
            }
        }
    }

    const cartDetails = document.getElementById('cartDetails');
    const totalPriceEl = document.getElementById('totalPrice');

    if (selectedSeats.length === 0) {
        cartDetails.innerHTML = 'Chưa chọn ghế nào';
        totalPriceEl.innerText = '0';
        return;
    }

    cartDetails.innerHTML = selectedSeats.map(s =>
        `<div>Ghế <strong>${s.name}</strong> (${getSeatTypeName(s.type)}): ${getSeatPrice(s.type).toLocaleString()} đ</div>`
    ).join('');

    const total = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s.type), 0);
    totalPriceEl.innerText = total.toLocaleString();
}

// POS-05 & POS-08: XÁC THỰC, THANH TOÁN, TRY...CATCH & LOCALSTORAGE
document.getElementById('btnCheckout').addEventListener('click', () => {
    try {
        let selectedCoords = [];
        let hasVip = false;
        let currentBillTotal = 0;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (seatMap[r][c].status === 'selected') {
                    selectedCoords.push({ r, c });
                    currentBillTotal += getSeatPrice(seatMap[r][c].type);
                    if (seatMap[r][c].type === 1) hasVip = true;
                }
            }
        }

        if (selectedCoords.length === 0) {
            throw new Error("Giỏ hàng đang rỗng! Vui lòng chọn ghế trước khi thanh toán.");
        }

        if (hasVip) {
            const adminPass = prompt("Phát hiện ghế VIP trong đơn hàng. Vui lòng nhập mã PIN Admin để xác nhận:");
            if (adminPass !== "1234") {
                alert("Mã PIN Admin không chính xác. Giao dịch bị hủy bỏ!");
                return;
            }
        }

        const confirmPay = confirm(`Xác nhận thanh toán thành công số tiền ${currentBillTotal.toLocaleString()} đ?`);
        if (!confirmPay) return;

        selectedCoords.forEach(coord => {
            seatMap[coord.r][coord.col].status = 'sold';
        });

        totalRevenue += currentBillTotal;

        saveData();

        renderSeats();
        updateCart();
        drawChart();

        alert("Xuất vé thành công!");

    } catch (error) {
        alert("Lỗi: " + error.message);
    }
});

function saveData() {
    localStorage.setItem('seatMap', JSON.stringify(seatMap));
    localStorage.setItem('totalRevenue', totalRevenue.toString());
}

// 
// POS-06: THUẬT TOÁN AUTO-PICK - TÌM N GHẾ TRỐNG LIỀN KỀ
function autoPickSeats(n) {
    clearSelection();

    for (let r = 0; r < ROWS; r++) {
        let count = 0;
        let startCol = -1;

        for (let c = 0; c < COLS; c++) {
            if (seatMap[r][c].status === 'empty') {
                if (count === 0) startCol = c;
                count++;

                if (count === n) {
                    for (let i = startCol; i <= c; i++) {
                        seatMap[r][i].status = 'selected';
                    }
                    return true;
                }
            } else {
                count = 0;
                startCol = -1;
            }
        }
    }
    return false;
}

function clearSelection() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (seatMap[r][c].status === 'selected') {
                seatMap[r][c].status = 'empty';
            }
        }
    }
}

document.getElementById('btnAutoPick').addEventListener('click', () => {
    const count = parseInt(document.getElementById('autoPickCount').value);
    if (isNaN(count) || count <= 0) {
        alert("Vui lòng nhập số lượng ghế hợp lệ.");
        return;
    }

    const success = autoPickSeats(count);
    if (success) {
        renderSeats();
        updateCart();
    } else {
        alert(`Không tìm thấy dãy ${count} ghế trống liền kề nào cùng hàng!`);
    }
});

// POS-07: ĐỒ HỌA CANVAS - VẼ BIỂU ĐỒ DOANH THU THỜI GIAN THỰC
function drawChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, 200);
    ctx.lineTo(550, 200);
    ctx.stroke();

    const barWidth = 60;
    const barX = 100;
    const barYMax = 200;

    const maxDataValue = 2000000;
    const computedHeight = (totalRevenue / maxDataValue) * 160;
    const barHeight = Math.min(computedHeight, 160);

    // Tiến hành vẽ Cột Doanh Thu
    ctx.fillStyle = '#3498db';
    ctx.fillRect(barX, barYMax - barHeight, barWidth, barHeight);

    // Thêm nhãn tên cột bên dưới trục X
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Tổng Doanh Thu", barX + (barWidth / 2), 220);

    // Hiển thị số tiền thực tế động trên đầu cột
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`${totalRevenue.toLocaleString()} đ`, barX + (barWidth / 2), barYMax - barHeight - 10);

    // Ghi chú mức trần để kiểm chứng trực quan
    ctx.fillStyle = '#aaa';
    ctx.font = '10px Arial';
    ctx.fillText("Mốc trần đồ thị: 2,000,000 đ", 500, 35);
}

// RUNTIME: KHỞI CHẠY ỨNG DỤNG LẦN ĐẦU TẢI TRANG
window.onload = function () {
    initData();
    renderSeats();
    updateCart();
    drawChart();
};