let revenueHistory =
    JSON.parse(
        localStorage.getItem(
            "revenueHistory"
        )
    ) || [];

let totalRevenue =
    Number(
        localStorage.getItem(
            "totalRevenue"
        )
    ) || 0;

const movies = [
    {
        name: "Avengers",
        basePrice: 100000
    },
    {
        name: "Batman",
        basePrice: 120000
    }
];

const defaultSeats = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 1, 2, 2],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3]
];

let seats = JSON.parse(
    localStorage.getItem("seats")
);

if (!seats) {
    seats = defaultSeats;
}

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

        const rowLetter =
            String.fromCharCode(65 + seat.row);

        const seatType =
            seats[seat.row][seat.col];

        const price =
            getSeatPrice(seatType);

        seatList.innerHTML += `
            <p>
                ${rowLetter}${seat.col + 1}
                - ${price.toLocaleString()} VNĐ
            </p>
        `;
    });

    const total =
        selectedSeats.reduce((sum, seat) => {

            const seatType =
                seats[seat.row][seat.col];

            return sum +
                getSeatPrice(seatType);

        }, 0);

    document.getElementById("total")
        .textContent =
        total.toLocaleString();
}

function renderSeats() {

    const seatMap =
        document.getElementById("seatMap");

    seatMap.innerHTML = "";

    seats.forEach((row, rowIndex) => {

        const rowDiv =
            document.createElement("div");

        rowDiv.classList.add("row");

        row.forEach((seat, colIndex) => {

            const btn =
                document.createElement("button");

            const rowLetter =
                String.fromCharCode(
                    65 + rowIndex
                );

            btn.textContent =
                `${rowLetter}${colIndex + 1}`;

            if (
                isSelected(
                    rowIndex,
                    colIndex
                )
            ) {

                btn.className =
                    "seat selected";

            } else {
                btn.className =
                    seat === 1
                        ? "seat sold"
                        : seat === 2
                            ? "seat vip"
                            : seat === 3
                                ? "seat couple"
                                : "seat empty";
            }

            if (
                rowIndex === seats.length - 1
            ) {
                btn.classList.add(
                    "couple-seat"
                );
            }

            btn.addEventListener(
                "click",
                () => {

                    if (seat === 1) {
                        return;
                    }

                    const index =
                        selectedSeats.findIndex(
                            item =>
                                item.row === rowIndex &&
                                item.col === colIndex
                        );

                    if (index >= 0) {

                        selectedSeats.splice(
                            index,
                            1
                        );

                    } else {

                        selectedSeats.push({
                            row: rowIndex,
                            col: colIndex
                        });
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

function checkout() {

    try {

        if (selectedSeats.length === 0) {
            throw new Error(
                "Giỏ hàng đang trống!"
            );
        }

        const hasVipSeat =
            selectedSeats.some(seat => {

                return seats[
                    seat.row
                ][
                    seat.col
                ] === 2;

            });

        if (hasVipSeat) {

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

        const confirmPay =
            confirm(
                "Xác nhận thanh toán?"
            );

        if (!confirmPay) {
            return;
        }

        const orderRevenue =
            selectedSeats.reduce(
                (sum, seat) => {

                    const seatType =
                        seats[
                        seat.row
                        ][
                        seat.col
                        ];

                    return sum +
                        getSeatPrice(
                            seatType
                        );

                },
                0
            );

        selectedSeats.forEach(seat => {

            seats[
                seat.row
            ][
                seat.col
            ] = 1;

        });

        totalRevenue += orderRevenue;

        revenueHistory.push(
            orderRevenue
        );

        saveData();

        drawRevenueChart();

        selectedSeats = [];

        renderSeats();
        updateTotal();

        alert(
            "Thanh toán thành công!"
        );

    } catch (error) {

        alert(error.message);

    }
}

document
    .getElementById("checkoutBtn")
    .addEventListener(
        "click",
        checkout
    );

function findAdjacentSeats(
    seatMatrix,
    quantity
) {

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

            const seatType =
                seatMatrix[row][col];

            if (seatType !== 1) {

                if (count === 0) {
                    startCol = col;
                }

                count++;

                if (
                    count === quantity
                ) {

                    const result = [];

                    for (
                        let i = startCol;
                        i <
                        startCol +
                        quantity;
                        i++
                    ) {

                        result.push({
                            row,
                            col: i
                        });
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

    const quantity =
        Number(
            prompt(
                "Nhập số ghế cần tìm:"
            )
        );

    if (
        !quantity ||
        quantity <= 0
    ) {
        return;
    }

    const seatsFound =
        findAdjacentSeats(
            seats,
            quantity
        );

    if (!seatsFound) {

        alert(
            "Không tìm thấy đủ ghế liền kề!"
        );

        return;
    }

    selectedSeats = seatsFound;

}

document
    .getElementById("autoPickBtn")
    .addEventListener(
        "click",
        autoPick
    );

function saveData() {

    localStorage.setItem(
        "seats",
        JSON.stringify(seats)
    );

    localStorage.setItem(
        "totalRevenue",
        totalRevenue
    );

    localStorage.setItem(
        "revenueHistory",
        JSON.stringify(
            revenueHistory
        )
    );
}

function drawRevenueChart() {

    const canvas =
        document.getElementById(
            "revenueChart"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (
        revenueHistory.length === 0
    ) {

        ctx.font =
            "20px Arial";

        ctx.fillStyle =
            "#000";

        ctx.fillText(
            "Chưa có doanh thu",
            250,
            150
        );

        return;
    }

    const maxRevenue =
        Math.max(
            ...revenueHistory
        );

    const chartHeight = 220;
    const chartBottom = 260;

    const barWidth = 50;
    const gap = 20;

    ctx.strokeStyle =
        "#000";

    ctx.beginPath();

    ctx.moveTo(
        40,
        20
    );

    ctx.lineTo(
        40,
        chartBottom
    );

    ctx.lineTo(
        canvas.width - 20,
        chartBottom
    );

    ctx.stroke();

    revenueHistory.forEach(
        (
            revenue,
            index
        ) => {

            const barHeight =
                revenue /
                maxRevenue *
                chartHeight;

            const x =
                60 +
                index *
                (
                    barWidth +
                    gap
                );

            const y =
                chartBottom -
                barHeight;

            ctx.fillStyle =
                "#28a745";

            ctx.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );

            ctx.fillStyle =
                "#000";

            ctx.font =
                "12px Arial";

            ctx.fillText(
                `Đ${index + 1}`,
                x + 10,
                chartBottom + 20
            );

            ctx.fillText(
                (
                    revenue /
                    1000
                ).toFixed(0) +
                "k",
                x,
                y - 10
            );
        }
    );

    ctx.font =
        "bold 16px Arial";

    ctx.fillStyle =
        "#000";

    ctx.fillText(
        "Tổng doanh thu: " +
        totalRevenue.toLocaleString() +
        " VNĐ",
        50,
        15
    );
}

renderSeats();
updateTotal();
drawRevenueChart();