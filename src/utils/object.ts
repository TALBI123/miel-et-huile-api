export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}
export const filterObjectByKeys = <
  T extends Record<string, any>,
  K extends keyof T
>(
  obj: T,
  list: readonly K[]
): Pick<T, K> => {
  const SetList = new Set(list);
  const objFilterd = {} as Pick<T, K>;
  for (const key of Object.keys(obj ?? {}))
    if (SetList.has(key as K)) objFilterd[key as K] = obj[key];
  return objFilterd;
};

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
export const createOrderData = ({
  customerName,
  customerEmail,
  items,
  shippingCost = 201.78,
}: CreateOrderData) => {
  const orderId = `CMD-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
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
    dashboardUrl: "https://ecommercemiel-production.up.railway.app",
    supportEmail: "support@lanouvelleruche.fr",
  };
};
