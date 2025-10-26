"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderData = exports.filterObjectByKeys = void 0;
exports.isEmptyObject = isEmptyObject;
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}
const filterObjectByKeys = (obj, list) => {
    const SetList = new Set(list);
    const objFilterd = {};
    for (const key of Object.keys(obj ?? {}))
        if (SetList.has(key))
            objFilterd[key] = obj[key];
    return objFilterd;
};
exports.filterObjectByKeys = filterObjectByKeys;
const createOrderData = ({ customerName, customerEmail, items, shippingCost = 201.78, }) => {
    const orderId = `CMD-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
    const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = itemsTotal + shippingCost;
    return {
        customerName: customerName || "l'Arbi tboricha",
        customerEmail: customerEmail,
        orderId,
        orderItems: items.map((item) => ({
            name: item.title,
            quantity: item.quantity,
            price: new Intl.NumberFormat("fr-FR", {
                minimumFractionDigits: 2,
                style: "currency",
                currency: "EUR",
            }).format(item.price * item.quantity),
        })),
        shippingCost: new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
            style: "currency",
            currency: "EUR",
        }).format(shippingCost),
        totalAmount: new Intl.NumberFormat("fr-FR", {
            minimumFractionDigits: 2,
            style: "currency",
            currency: "EUR",
        }).format(totalAmount),
        dashboardUrl: process.env.DASHBOARD_CLIENT_URL ||
            "https://ecommercemiel-production.up.railway.app",
        supportEmail: process.env.SUPPORT_EMAIL || "support@lanouvelleruche.fr",
    };
};
exports.createOrderData = createOrderData;
//# sourceMappingURL=object.js.map