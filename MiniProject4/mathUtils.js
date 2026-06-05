function formatCurrency(amount, currency = "VND") {
    return (amount.toLocaleString() + " " + currency);
}

function calculateTax(amount, taxRate = 0.1) {
    return amount * taxRate;
}

function calculateDiscount(amount, discount = 0) {
    return amount - discount;
}