let revenueHistory = JSON.parse(localStorage.getItem("revenueHistory")) || [];

let totalRevenue = Number(localStorage.getItem("totalRevenue")) || 0;

let transactionHistory = JSON.parse(localStorage.getItem("transactionHistory")) || [];

const movies = [
    {
        name: "Avengers",
        basePrice: 100000,
        revenue: 5000000
    },
    {
        name: "Batman",
        basePrice: 120000,
        revenue: 3000000
    },
    {
        name: "Superman",
        basePrice: 90000,
        revenue: 7000000
    }
];

const defaultRooms = [

    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0],
        [2, 2, 2, 2, 1, 1, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3]
    ],

    [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3]
    ],

    [
        [0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 0, 0],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3]
    ]

];

let rooms = JSON.parse(
    localStorage.getItem("rooms")
);

if (!rooms) {
    rooms = defaultRooms;
}

let currentRoom = 0;

let seats = rooms[currentRoom];

let selectedSeats = [];

/*
0 = Ghế thường
1 = Đã bán
2 = VIP
3 = Ghế đôi
*/

function isSelected(row, col) {
    return selectedSeats.some(
        seat =>
            seat.row === row &&
            seat.col === col
    );
}

function getSeatPrice(type) {
    switch (type) {
        case 0:
            return 100000;
        case 2:
            return 150000;
        case 3:
            return 250000;
        default:
            return 100000;
    }
}

function updateTotal() {
    const seatList =
        document.getElementById("selectedSeats");
    seatList.innerHTML = "";
    selectedSeats.forEach(seat => {
        const rowLetter = String.fromCharCode(65 + seat.row);

        const seatType = seats[seat.row][seat.col];

        const price = getSeatPrice(seatType);

        seatList.innerHTML += `<p>${rowLetter}${seat.col + 1} - ${formatCurrency(price)} VNĐ </p>`;
    });

    const total =
        selectedSeats.reduce((sum, seat) => {
            const seatType = seats[seat.row][seat.col];
            return sum + getSeatPrice(seatType);
        }, 0);

    document.getElementById("total")
        .textContent =
        formatCurrency(total)
}

function switchRoom(roomIndex) {
    if (roomIndex < 0 || roomIndex >= rooms.length) {
        alert("Phòng chiếu không tồn tại!");
        return;
    }
    currentRoom = roomIndex;
    seats = rooms[currentRoom];
    selectedSeats = [];

    document.querySelectorAll(".room-selector button").forEach(btn => btn.classList.remove("active-room"));
    document.querySelectorAll(".room-selector button")[roomIndex].classList.add("active-room");

    renderSeats();
    updateTotal();
}

function renderSeats() {
    const seatMap = document.getElementById("seatMap");

    seatMap.innerHTML = "";

    seats.forEach((row, rowIndex) => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");

        row.forEach((seat, colIndex) => {
            const btn = document.createElement("button");

            const rowLetter = String.fromCharCode(65 + rowIndex);

            btn.textContent = `${rowLetter}${colIndex + 1}`;

            if (isSelected(rowIndex, colIndex)) {
                btn.className = "seat selected";
            } else {
                btn.className = seat === 1 ? "seat sold"
                    : seat === 2 ? "seat vip"
                        : seat === 3 ? "seat couple" : "seat empty";
            }

            if (
                rowIndex === seats.length - 1
            ) {
                btn.classList.add(
                    "couple-seat"
                );
            }

            btn.addEventListener("click", () => {
                if (seat === 1) {
                    return;
                }

                const index = selectedSeats.findIndex(item => item.row === rowIndex && item.col === colIndex);

                if (index >= 0) {
                    selectedSeats.splice(index, 1);
                } else {
                    selectedSeats.push({ row: rowIndex, col: colIndex });
                }
                updateTotal();
                renderSeats();
            }
            );
            rowDiv.appendChild(btn);
        });
        seatMap.appendChild(rowDiv);
    });
}

renderSeats();
updateTotal();

function validateCart() {
    if (selectedSeats.length === 0) {
        throw new Error(
            "Giỏ hàng đang trống!"
        );
    }
}

function hasVipSeat() {
    return selectedSeats.some(
        seat =>
            seats[seat.row][seat.col] === 2
    );
}

function verifyAdmin() {
    if (!hasVipSeat()) {
        return;
    }
    const pass =
        prompt(
            "Có ghế VIP. Nhập mật khẩu Admin:"
        );
    if (pass !== "admin123") {
        throw new Error(
            "Sai mật khẩu Admin!"
        );
    }
}

function confirmCheckout() {
    return confirm(
        "Xác nhận thanh toán?"
    );
}

function calculateRevenue() {
    return selectedSeats.reduce(
        (sum, seat) => {
            const seatType =
                seats[seat.row][seat.col];
            return sum +
                getSeatPrice(
                    seatType
                );
        }, 0);
}

function markSeatsSold() {
    selectedSeats.forEach(seat => {
        seats[seat.row][seat.col] = 1;
    });
}

function updateRevenue(orderRevenue) {
    totalRevenue += orderRevenue;
    revenueHistory.push(orderRevenue);
}

function refreshUI() {
    renderSeats();
    updateTotal();
    drawRevenueChart();
}

function checkout() {
    try {
        validateCart();
        verifyAdmin();

        if (
            !confirmCheckout()
        ) {
            return;
        }

        const orderRevenue = calculateRevenue();

        const customerName =
            prompt(
                "Nhập tên khách hàng:"
            ) || "Khách lẻ";

        transactionHistory.push({

            customer:
                customerName,

            seats:
                JSON.parse(
                    JSON.stringify(
                        selectedSeats
                    )
                ),

            total:
                orderRevenue

        });

        markSeatsSold();
        updateRevenue(orderRevenue);

        saveData();

        selectedSeats = [];

        refreshUI();

        alert("Thanh toán thành công!");

    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("checkoutBtn").addEventListener("click", checkout);

function findAdjacentSeats(seatMatrix, quantity) {
    for (
        let row = 0;
        row < seatMatrix.length;
        row++
    ) {
        let count = 0;
        let startCol = -1;
        for (
            let col = 0;
            col < seatMatrix[row].length;
            col++
        ) {
            const seatType = seatMatrix[row][col];

            if (seatType !== 1) {
                if (count === 0) {
                    startCol = col;
                }
                count++;

                if (count === quantity) {
                    const result = [];
                    for (let i = startCol; i < startCol + quantity; i++) {
                        result.push({ row, col: i });
                    }
                    return result;
                }
            } else {
                count = 0;
                startCol = -1;
            }
        }
    }
    return null;
}

function autoPick() {
    const quantity = Number(prompt("Nhập số ghế cần tìm:"));

    if (!quantity || quantity <= 0) {
        return;
    }

    const seatsFound = findAdjacentSeats(seats, quantity);

    if (!seatsFound) {
        alert("Không tìm thấy đủ ghế liền kề!");
        return;
    }

    selectedSeats = seatsFound;
    renderSeats();
    updateTotal();
}

document.getElementById("autoPickBtn").addEventListener("click", autoPick);

function saveData() {
    localStorage.setItem("rooms", JSON.stringify(rooms));

    localStorage.setItem("totalRevenue", totalRevenue);

    localStorage.setItem("revenueHistory", JSON.stringify(revenueHistory));

    localStorage.setItem("transactionHistory", JSON.stringify(transactionHistory));
}

function drawRevenueChart() {
    const canvas = document.getElementById("revenueChart");

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (revenueHistory.length === 0) {
        ctx.font = "20px Arial";
        ctx.fillStyle = "#000";
        ctx.fillText("Chưa có doanh thu", 250, 150);
        return;
    }

    const maxRevenue = Math.max(...revenueHistory);

    const chartHeight = 220;
    const chartBottom = 260;

    const barWidth = 50;
    const gap = 20;

    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, chartBottom);
    ctx.lineTo(canvas.width - 20, chartBottom);
    ctx.stroke();

    revenueHistory.forEach((revenue, index) => {
        const barHeight = revenue / maxRevenue * chartHeight;
        const x = 60 + index * (barWidth + gap);
        const y = chartBottom - barHeight;
        ctx.fillStyle = "#28a745";
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.fillText(`Đ${index + 1}`, x + 10, chartBottom + 20);
        ctx.fillText((revenue / 1000).toFixed(0) + "k", x, y - 10);
    });

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Tổng doanh thu: " + formatCurrency(totalRevenue) + " VNĐ", 50, 15);
}

function renderMovies(movieArray) {
    const movieList = document.getElementById("movieList");
    movieList.innerHTML = "";
    movieArray.forEach(movie => {
        movieList.innerHTML += `
            <div class="movie-item">
                <b>${movie.name}</b>
                <br>
                Giá:
               ${formatCurrency(movie.basePrice)}
                <br>
                Doanh thu:
                ${formatCurrency(movie.revenue)}
            </div>
        `;
    });
}

function searchMovie() {
    const keyword = document.getElementById("searchMovie").value.toLowerCase();
    const result = movies.filter(movie => movie.name.toLowerCase().includes(keyword));
    renderMovies(result);
}

function sortByPrice() {
    movies.sort((a, b) => a.basePrice - b.basePrice);
    renderMovies(movies);
}

function sortByRevenue() {
    movies.sort((a, b) => a.revenue - b.revenue);
    renderMovies(movies);
}

function showVipTickets() {
    const vipTickets = transactionHistory.filter(transaction =>
        transaction.seats.some(seat =>
            seat.row >= 2
        ));
    document.getElementById("reportResult").innerHTML = vipTickets.map(transaction => {
        const seatNames = transaction.seats.map(seat =>
            String.fromCharCode(65 + seat.row) + (seat.col + 1)).join(", ");
        return `
                <p>
                    Khách:
                    ${transaction.customer}
                    <br>
                    Ghế VIP:
                    ${seatNames}
                </p>
            `;
    }).join("");
}

function showTotalRevenue() {
    const total = transactionHistory.reduce((sum, transaction) => sum + transaction.total, 0);

    document.getElementById("reportResult").innerHTML =
        `<h3>
            Tổng doanh thu:
            ${formatCurrency(total)}
            VNĐ
        </h3>`;
}

function printTickets() {
    const ticketData = transactionHistory.map(transaction => {
        const seatNames = transaction.seats.map(seat => String.fromCharCode(65 + seat.row) + (seat.col + 1)).join(", ");
        return { customer: transaction.customer, seats: seatNames };
    }
    );

    document.getElementById("reportResult").innerHTML = ticketData.map(ticket => `
                <p>
                    Khách:
                    ${ticket.customer}
                    <br>
                    Ghế:
                    ${ticket.seats}
                </p>
            `).join("");
}

const customers = [
    {
        id: 1,
        name: "A",
        referrals: [2, 3]
    },
    {
        id: 2,
        name: "B",
        referrals: [4]
    },
    {
        id: 3,
        name: "C",
        referrals: []
    },
    {
        id: 4,
        name: "D",
        referrals: []
    }
];

function calculateReferralPoints(customerId, level = 1) {
    const customer = customers.find(customer => customer.id === customerId);
    if (!customer || customer.referrals.length === 0) {
        return 0;
    }
    let points = 0;
    customer.referrals.forEach(referralId => {
        points += level === 1 ? 10 : 5;

        points += calculateReferralPoints(referralId, level + 1);
    });
    return points;
}

renderSeats();
updateTotal();
drawRevenueChart();
renderMovies(movies);