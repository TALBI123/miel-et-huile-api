export declare function isEmptyObject(obj: object): boolean;
export declare const filterObjectByKeys: <T extends Record<string, any>, K extends keyof T>(obj: T, list: readonly K[]) => Pick<T, K>;
interface OrderItem {
    title: string;
    quantity: number;
    price: number;
}
interface CreateOrderData {
    customerName?: string;
    customerEmail: string;
    items: OrderItem[];
    shippingCost?: number;
}
export declare const createOrderData: ({ customerName, customerEmail, items, shippingCost, }: CreateOrderData) => {
    customerName: string;
    customerEmail: string;
    orderId: string;
    orderItems: {
        name: string;
        quantity: number;
        price: string;
    }[];
    shippingCost: string;
    totalAmount: string;
    dashboardUrl: string;
    supportEmail: string;
};
export {};
