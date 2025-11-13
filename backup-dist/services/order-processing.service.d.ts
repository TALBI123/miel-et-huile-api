import { CartItem, OrderWithRelations } from "../types/order.type";
import { Stripe } from "../config/stripe";
interface ProcessOrder {
    orderId: string;
    email: string;
    customerName: string | undefined;
    session: Stripe.Checkout.Session;
    order: any;
}
export declare class OrderProcessingService {
    /**
     * Traitement principal de confirmation de commande
     */
    static processOrderConfirmation({ orderId, email, customerName, session, order, }: ProcessOrder): Promise<any>;
    /**
     * Créer une nouvelle commande
     */
    static createOrder(userId: string, cart: CartItem[], shippingCost: number): Promise<OrderWithRelations>;
    /**
     * Transaction atomique pour la confirmation de commande
     */
    static executeOrderConfirmationTransaction(orderId: string, session: Stripe.Checkout.Session): Promise<any>;
    /**
     * Actions post-confirmation non-bloquantes
     */
    static executePostConfirmationActions(orderId: string, email: string, customerName: string | undefined, order: any): Promise<void>;
    /**
     * Créer une commande d'urgence en cas de paiement sans commande
     */
    static createEmergencyOrder(session: Stripe.Checkout.Session): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        totalAmount: number;
        stripePaymentIntentId: string | null;
        stripeSessionId: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        notes: string | null;
    }>;
    /**
     * Recherche d'une commande par payment_intent
     */
    static findOrderByPaymentIntent(paymentIntentId: string): Promise<{
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        items: ({
            product: {
                title: string;
                id: string;
            };
            variant: {
                stock: number;
                id: string;
            };
        } & {
            price: number;
            id: string;
            productId: string;
            orderId: string;
            quantity: number;
            variantId: string;
        })[];
        stripePaymentIntentId: string | null;
    } | null>;
    /**
     * Obtenir le nom complet du client avec fallback
     */
    static getCustomerName(user: any, fallbackName?: string): string;
    /**
     * Notification équipe pour intervention manuelle 💡
     */
    static notifyTeamCriticalIssue(session: Stripe.Checkout.Session, orderId: string): Promise<void>;
    /**
     * Notification pour commandes importantes
     */
    static notifyTeamLargeOrder(order: any): Promise<void>;
    /**
     * Envoi d'email de confirmation sécurisé
     */
    static sendConfirmationEmailSafely(orderId: string, email: string, customerName: string | undefined, order: any): Promise<void>;
    static runInBackground(fn: () => Promise<void>): void;
    static resolveOrder(session: Stripe.Checkout.Session): Promise<{
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        items: ({
            product: {
                title: string;
                id: string;
            };
            variant: {
                stock: number;
                id: string;
            };
        } & {
            price: number;
            id: string;
            productId: string;
            orderId: string;
            quantity: number;
            variantId: string;
        })[];
        stripePaymentIntentId: string | null;
    } | null>;
}
export {};
