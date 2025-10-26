import { Stripe } from "../config/stripe";
export declare class WebhookService {
    private static updateStockAndConfirmOrder;
    /**
     * Handle checkout.session.completed - Version ULTRA ROBUSTE
     */
    static handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<{
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
    } | undefined>;
    static handlePaymentFailed(session: Stripe.PaymentIntent | Stripe.Checkout.Session): Promise<{
        error: string;
        warning?: undefined;
        paymentIntentId?: undefined;
        message?: undefined;
        success?: undefined;
    } | {
        warning: string;
        paymentIntentId: string;
        error?: undefined;
        message?: undefined;
        success?: undefined;
    } | {
        message: string;
        error?: undefined;
        warning?: undefined;
        paymentIntentId?: undefined;
        success?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
        warning?: undefined;
        paymentIntentId?: undefined;
    }>;
    static handlePaymentIntentSucceeded(session: Stripe.PaymentIntent): Promise<void>;
    static handlePaymentRequiresAction(session: Stripe.PaymentIntent): Promise<void>;
    static handlePaymentProcessing(session: Stripe.PaymentIntent): Promise<void>;
    static handlePaymentCanceled(session: Stripe.PaymentIntent): Promise<void>;
    static handleSessionExpired(session: Stripe.Checkout.Session): Promise<void>;
    static handleDisputeCreated(session: Stripe.Dispute): Promise<void>;
    /**
     * 🔄 Met à jour le statut d'un litige en cours.
     * Utilisé pour refléter l’évolution d’un litige Stripe côté back-office.
     */
    static handleDisputeUpdated(session: Stripe.Dispute): Promise<void>;
    /**
     * 🏁 Gère la clôture d’un litige Stripe.
     * Met à jour la commande selon le verdict (gagné ou perdu).
     */
    static handleDisputeClosed(session: Stripe.Dispute): Promise<void>;
    static handleChargeRefunded(refund: Stripe.Charge): Promise<void>;
}
