"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const order_processing_service_1 = require("./order-processing.service");
const alert_service_1 = require("./alert.service");
const enums_1 = require("../types/enums");
const db_1 = __importDefault(require("../config/db"));
const client_1 = require("@prisma/client");
class WebhookService {
    static async updateStockAndConfirmOrder(orderId) {
        try {
            const order = await db_1.default.order.findUnique({
                where: { id: orderId },
                include: { items: { include: { variant: true } } },
            });
            if (!order)
                throw new Error(`Order with ID ${orderId} not found`);
            console.log("✅ Stock mis à jour et commande confirmée");
        }
        catch (err) {
            console.error("❌ Erreur mise à jour stock/confirmation commande:", err);
        }
    }
    /**
     * Handle checkout.session.completed - Version ULTRA ROBUSTE
     */
    static async handleCheckoutSessionCompleted(session) {
        const sessionId = session.id;
        const paymentIntentId = session.payment_intent;
        console.log("metadata : ", session.metadata);
        const { orderId, email, customerName } = session.metadata || {};
        if (!orderId) {
            console.error(`🚨 CRITIQUE: orderId manquant mais paiement réussi`, {
                sessionId,
                paymentIntentId,
                metadata: session.metadata,
            });
        }
        try {
            // OrderProcessingService.sendConfirmationEmailSafely(orderId, email, customerName, order);
            // Tentative de récupération par payment_intent
            const order = await order_processing_service_1.OrderProcessingService.resolveOrder(session);
            if (!order) {
                console.error(`🚨 CRITIQUE: Commande ${orderId} introuvable mais paiement réussi`, {
                    orderId,
                    sessionId,
                    paymentIntentId,
                });
                return await order_processing_service_1.OrderProcessingService.createEmergencyOrder(session);
            }
            await order_processing_service_1.OrderProcessingService.processOrderConfirmation({
                orderId,
                email,
                customerName,
                session,
                order,
            });
            console.log(`✅ Commande ${orderId} marquée comme payée`);
        }
        catch (err) {
            // this.handleChargeRefunded(session as unknown as Stripe.Charge);
            console.error("❌ Erreur lors du traitement de checkout.session.completed:", err);
            // ⚠️ JAMAIS throw après un paiement réussi - gérer manuellement
            await order_processing_service_1.OrderProcessingService.notifyTeamCriticalIssue(session, orderId);
        }
    }
    static async handlePaymentFailed(session) {
        try {
            // ✅ Vérification stricte du type (utile si tu traites à la fois PaymentIntent et Checkout.Session)
            const isCheckoutSession = "metadata" in session && "id" in session;
            if (!isCheckoutSession) {
                console.error("❌ Session Stripe invalide ou format inattendu:", session);
                return { error: "Session Stripe invalide" };
            }
            const orderId = session.metadata?.orderId;
            console.log("OrderID bro : ", orderId, "  metadat:", session.metadata);
            if (!orderId) {
                console.warn("⚠️ Payment failed reçu sans orderId", {
                    paymentIntentId: session.id,
                });
                return {
                    warning: `⚠️ payment_failed sans orderId`,
                    paymentIntentId: session.id,
                };
            }
            // 🔎 Vérifie si la commande existe
            const existingOrder = await db_1.default.order.findUnique({
                where: { id: orderId },
            });
            if (!existingOrder) {
                console.error(`❌ Aucune commande trouvée avec l'ID ${orderId}`);
                return { error: "Commande introuvable" };
            }
            // 🚫 Vérifie si la commande est déjà marquée comme payée pour éviter les incohérences
            if (existingOrder.paymentStatus === client_1.PaymentStatus.PAID) {
                console.warn(`⚠️ La commande ${orderId} est déjà payée, pas de mise à jour`);
                return { message: "Commande déjà payée" };
            }
            await db_1.default.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: client_1.PaymentStatus.FAILED,
                    status: client_1.OrderStatus.CANCELLED,
                    notes: `Paiement échoué: ${session || "Erreur inconnue"}`,
                },
            });
            console.log(`❌ Commande ${orderId} marquée comme échouée`);
            return { success: true, message: "Commande marquée comme échouée" };
        }
        catch (error) {
            console.error("❌ Erreur traitement payment_failed:", error);
            return { error: "Erreur interne lors du traitement du paiement échoué" };
        }
    }
    static async handlePaymentIntentSucceeded(session) {
        try {
            const orderId = session.metadata?.orderId;
            if (orderId) {
                await db_1.default.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: client_1.PaymentStatus.PAID,
                        status: client_1.OrderStatus.CONFIRMED,
                    },
                });
                console.log(`✅ Commande ${orderId} marquée comme réussie`);
            }
        }
        catch (error) {
            console.error("❌ Erreur traitement payment succeeded:", error);
        }
    }
    static async handlePaymentRequiresAction(session) {
        try {
            const orderId = session.metadata?.orderId;
            if (!orderId) {
                console.warn("⚠️ Aucun orderId trouvé dans le metadata du PaymentIntent.");
                return;
            }
            // Vérifie que la commande existe avant mise à jour
            const existingOrder = await db_1.default.order.findUnique({
                where: { id: orderId },
                select: { id: true, paymentStatus: true },
            });
            if (!existingOrder) {
                console.error(`❌ Commande introuvable pour le paymentIntent ${session.id}`);
                return;
            }
            // Empêche une réécriture inutile si le statut est déjà correct
            if (existingOrder.paymentStatus === client_1.PaymentStatus.REQUIRES_ACTION) {
                console.log(`ℹ️ Commande ${orderId} déjà marquée comme REQUIRES_ACTION.`);
                return;
            }
            await db_1.default.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: client_1.PaymentStatus.REQUIRES_ACTION,
                    status: client_1.OrderStatus.PENDING,
                },
            });
            console.log(`🔄 Commande ${orderId} nécessite une action`);
        }
        catch (error) {
            console.error("❌ Erreur traitement payment requires action:", error);
        }
    }
    static async handlePaymentProcessing(session) {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.warn("⚠️ Aucun orderId trouvé dans le metadata du PaymentIntent.");
            return;
        }
        try {
            // Vérifie que la commande existe avant mise à jour
            const existingOrder = await db_1.default.order.findUnique({
                where: { id: orderId },
                select: { id: true, paymentStatus: true },
            });
            if (!existingOrder) {
                console.error(`❌ Commande introuvable pour le paymentIntent ${session.id}`);
                return;
            }
            // Empêche une réécriture inutile si le statut est déjà correct
            if (existingOrder.paymentStatus === client_1.PaymentStatus.PROCESSING) {
                console.log(`ℹ️ Commande ${orderId} déjà marquée comme PROCESSING.`);
                return;
            }
            // Mise à jour du statut
            await db_1.default.order.update({
                where: { id: orderId },
                data: { paymentStatus: "PROCESSING", status: "PENDING" },
            });
            console.log(`⌛ [Stripe] Commande ${orderId} en cours de traitement.`);
        }
        catch (err) {
            console.error("❌ Erreur traitement payment requires action:", err);
        }
    }
    static async handlePaymentCanceled(session) {
        try {
            const orderId = session.metadata?.orderId;
            // 🧩 1. Vérifier la présence et validité de l’orderId
            if (!orderId) {
                console.warn("⚠️ Aucun orderId trouvé dans metadata du PaymentIntent");
                return;
            }
            // 🧩 2. Vérifier si la commande existe
            const order = await db_1.default.order.findUnique({ where: { id: orderId } });
            if (!order) {
                console.warn(`⚠️ Aucune commande trouvée avec l'id ${orderId}`);
                return;
            }
            // 🧩 3. Éviter les doublons (Stripe peut renvoyer le même event)
            if (order.status === client_1.OrderStatus.CANCELLED) {
                console.log(`ℹ️ Commande ${orderId} déjà annulée — ignorée`);
                return;
            }
            // 🧩 4. Vérifier le statut Stripe avant d’agir
            if (session.status !== "canceled") {
                console.log(`⚠️ PaymentIntent ${session.id} non annulé (status: ${session.status})`);
                return;
            }
            // 🧩 5. Mettre à jour proprement la command
            await db_1.default.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: client_1.PaymentStatus.FAILED,
                    status: client_1.OrderStatus.CANCELLED,
                },
            });
            console.log(`❌ Commande ${orderId} annulée`);
        }
        catch (error) {
            console.error("❌ Erreur traitement payment canceled:", error);
        }
    }
    static async handleSessionExpired(session) {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.warn("⚠️ Session expirée sans orderId dans metadata");
            return;
        }
        try {
            await db_1.default.$transaction(async (tx) => {
                // 1️⃣ Vérifie si la commande existe
                const order = await tx.order.findUnique({ where: { id: orderId } });
                if (!order) {
                    console.warn(`⚠️ Commande ${orderId} introuvable lors de l'expiration`);
                    return;
                }
                // 2️⃣ Vérifie si elle n’a pas déjà un état final
                const finalStatuses = [
                    client_1.PaymentStatus.PAID,
                    client_1.PaymentStatus.REFUNDED,
                    client_1.PaymentStatus.FAILED,
                ];
                if (finalStatuses.includes(order.paymentStatus)) {
                    console.log(`ℹ️ Commande ${orderId} déjà traitée (${order.paymentStatus}), ignorée.`);
                    return;
                }
                // 3️⃣ Met à jour la commande
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: client_1.PaymentStatus.EXPIRED,
                        status: client_1.OrderStatus.CANCELLED,
                        notes: `Session Stripe expirée automatiquement à ${new Date().toISOString()}`,
                    },
                });
            });
            console.log(`⏰ Commande ${orderId} expirée`);
        }
        catch (error) {
            console.error("❌ Erreur traitement session expired:", error);
        }
    }
    static async handleDisputeCreated(session) {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.warn(`⚠️ Aucun orderId trouvé pour le chargeId ${session.id}`);
            return;
        }
        const order = await db_1.default.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true, paymentStatus: true },
        });
        if (!order) {
            console.warn(`⚠️ Commande ${orderId} introuvable.`);
            return;
        }
        const disputeExists = await db_1.default.dispute.findUnique({
            where: { stripeId: session.id },
            select: { status: true },
        });
        // Si le litige existe déjà et la commande est déjà en DISPUTED, on ne fait rien
        if (disputeExists?.status === session.status &&
            order.paymentStatus === client_1.PaymentStatus.DISPUTED) {
            console.log(`ℹ️ Litige ${session.id} et commande ${orderId} déjà à jour.`);
            return;
        }
        try {
            await db_1.default.$transaction(async (tx) => {
                // Crée le litige s'il n'existe pas
                if (!disputeExists) {
                    await tx.dispute.create({
                        data: {
                            stripeId: session.id,
                            orderId,
                            userId: order.userId,
                            status: session.status,
                            createdAt: new Date(),
                        },
                    });
                    console.log(`✅ Litige créé dans la DB: ${session.id}`);
                }
                // Met à jour la commande
                if (order.paymentStatus !== client_1.PaymentStatus.DISPUTED) {
                    await tx.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: client_1.PaymentStatus.DISPUTED,
                            status: client_1.OrderStatus.ON_HOLD,
                            updatedAt: new Date(),
                        },
                    });
                    console.log(`⚠️ Commande ${orderId} mise en litige.`);
                }
            });
            alert_service_1.alertService.create({
                type: client_1.AlertType.DISPUTE_CREATED,
                severity: client_1.AlertSeverity.URGENT,
                message: `Litige créé pour la commande ${orderId}. Prévenir le support et collecter preuves.`,
                entityType: enums_1.Model.ORDER,
                entityId: orderId,
            });
        }
        catch (error) {
            console.error("❌ Erreur traitement dispute created:", error);
            alert_service_1.alertService.create({
                type: client_1.AlertType.DISPUTE_CREATED,
                severity: client_1.AlertSeverity.URGENT,
                message: `Erreur traitement litige pour la commande ${orderId}: ${error}`,
                entityType: enums_1.Model.ORDER,
                entityId: orderId,
            });
        }
    }
    /**
     * 🔄 Met à jour le statut d'un litige en cours.
     * Utilisé pour refléter l’évolution d’un litige Stripe côté back-office.
     */
    static async handleDisputeUpdated(session) {
        const stripeToPaymentStatusMap = {
            needs_response: client_1.PaymentStatus.DISPUTED,
            under_review: client_1.PaymentStatus.DISPUTED,
            won: client_1.PaymentStatus.PAID,
            lost: client_1.PaymentStatus.REFUNDED,
        };
        const newPaymentStatus = stripeToPaymentStatusMap[session.status];
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.warn(`⚠️ Aucun orderId trouvé pour le chargeId ${session.id}`);
            return;
        }
        // Récupère litige et commande en une seule requête
        try {
            const disputeWithOrder = await db_1.default.dispute.findUnique({
                where: { stripeId: session.id },
                select: {
                    status: true,
                    order: { select: { id: true, paymentStatus: true, userId: true } },
                },
            });
            // Si le litige n’existe pas, on le crée
            if (!disputeWithOrder) {
                const order = await db_1.default.order.findUnique({ where: { id: orderId } });
                if (!order) {
                    console.warn(`⚠️ Aucune commande trouvée pour l'ID ${orderId}`);
                    return;
                }
                await db_1.default.$transaction(async (tx) => {
                    await tx.dispute.create({
                        data: {
                            stripeId: session.id,
                            orderId,
                            userId: order.userId,
                            status: session.status,
                            createdAt: new Date(),
                        },
                    });
                    await tx.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: newPaymentStatus,
                            updatedAt: new Date(),
                        },
                    });
                });
                console.log(`✅ Litige créé et commande mise à jour pour ${session.id}`);
                // Alertes non bloquantes
                alert_service_1.alertService.create({
                    type: client_1.AlertType.DISPUTE_UPDATED,
                    severity: client_1.AlertSeverity.CRITICAL,
                    message: `Litige créé pour la commande ${orderId}. Prévenir le support si nécessaire.`,
                    tags: [client_1.AlertTag.NOTIFY_ADMIN],
                    entityType: enums_1.Model.ORDER,
                    entityId: orderId,
                });
                return;
            }
            const { status: disputeStatus, order } = disputeWithOrder;
            // Vérifie si la mise à jour est nécessaire
            if (disputeStatus === session.status &&
                order.paymentStatus === newPaymentStatus) {
                console.log(`ℹ️ Litige ${session.id} et commande déjà à jour.`);
                return;
            }
            // Transaction pour mise à jour du litige et de la commande
            await db_1.default.$transaction(async (tx) => {
                if (disputeStatus !== session.status)
                    await tx.dispute.update({
                        where: { stripeId: session.id },
                        data: { status: session.status, updatedAt: new Date() },
                    });
                if (order.paymentStatus !== newPaymentStatus)
                    await tx.order.updateMany({
                        where: { id: orderId },
                        data: {
                            paymentStatus: newPaymentStatus,
                            updatedAt: new Date(),
                        },
                    });
            });
            console.log(`🟡 Litige ${session.id} mis à jour (${session.status}).`);
            // Crée une alerte pour suivi interne si le statut devient critique
            // Alertes si le statut devient critique
            if (["needs_response", "under_review"].includes(session.status)) {
                await alert_service_1.alertService.create({
                    type: client_1.AlertType.DISPUTE_UPDATED,
                    severity: client_1.AlertSeverity.CRITICAL,
                    message: `Litige ${session.id} pour la commande ${orderId} a changé de statut: ${session.status}`,
                    tags: [client_1.AlertTag.NOTIFY_ADMIN],
                    entityType: enums_1.Model.ORDER,
                    entityId: orderId,
                });
            }
            console.log(`🟡 Litige ${session.id} mis à jour (${session.status}).`);
        }
        catch (err) {
            console.log("❌ Erreur traitement dispute updated:", err);
            alert_service_1.alertService.create({
                type: client_1.AlertType.DISPUTE_UPDATED,
                severity: client_1.AlertSeverity.CRITICAL,
                message: `Erreur traitement litige ${session.id} pour la commande ${orderId}: ${err}`,
                entityType: enums_1.Model.ORDER,
                entityId: orderId,
            });
        }
    }
    /**
     * 🏁 Gère la clôture d’un litige Stripe.
     * Met à jour la commande selon le verdict (gagné ou perdu).
     */
    static async handleDisputeClosed(session) {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            console.warn("⚠️ handleDisputeClosed: orderId manquant dans les métadonnées Stripe.");
            return;
        }
        const dispute = await db_1.default.dispute.findUnique({
            where: { stripeId: session.id },
            select: { status: true },
        });
        if (!dispute || dispute.status === session.status) {
            console.log(`ℹ️ Litige ${session.id} déjà à jour ou inexistant.`);
            return;
        }
        const isWon = session.status === "won";
        try {
            await db_1.default.$transaction([
                db_1.default.order.update({
                    where: { id: orderId },
                    data: {
                        paymentStatus: isWon ? client_1.PaymentStatus.PAID : client_1.PaymentStatus.REFUNDED,
                        status: isWon ? client_1.OrderStatus.RESOLVED : client_1.OrderStatus.CANCELLED,
                        updatedAt: new Date(),
                    },
                }),
                db_1.default.dispute.update({
                    where: { stripeId: session.id },
                    data: { status: session.status, updatedAt: new Date() },
                }),
            ]);
            const resultMsg = isWon ? "✅ Litige gagné" : "❌ Litige perdu";
            console.log(`${resultMsg} pour la commande ${orderId}`);
            await alert_service_1.alertService.create({
                type: client_1.AlertType.DISPUTE_CLOSED,
                severity: client_1.AlertSeverity.INFO,
                message: `${resultMsg} pour la commande ${orderId}`,
                entityType: enums_1.Model.ORDER,
                entityId: orderId,
            });
        }
        catch (err) {
            console.error("❌ Erreur traitement dispute closed:", err);
            alert_service_1.alertService.create({
                type: client_1.AlertType.DISPUTE_CLOSED,
                severity: client_1.AlertSeverity.CRITICAL,
                message: `🚨 Erreur critique lors de la clôture du litige (Dispute Closed) pour la commande ${orderId}. Détails : ${err?.message || err}`,
                tags: [client_1.AlertTag.NOTIFY_ADMIN],
                entityType: enums_1.Model.ORDER,
                entityId: orderId,
            });
        }
    }
    static async handleChargeRefunded(refund) {
        try {
            const paymentIntentId = refund.payment_intent;
            const existingOrder = await db_1.default.order.findFirst({
                where: {
                    stripePaymentIntentId: paymentIntentId,
                    paymentStatus: "REFUNDED",
                },
                select: { stripePaymentIntentId: true },
            });
            if (existingOrder) {
                console.log("Remboursement déjà traité");
                return;
            }
            await db_1.default.order.update({
                where: { stripePaymentIntentId: paymentIntentId },
                data: { paymentStatus: "REFUNDED", status: client_1.OrderStatus.CANCELLED },
            });
            console.log(`↩️ Commande avec PaymentIntent ${paymentIntentId} remboursée`);
        }
        catch (err) {
            console.error("Erreur handleChargeRefunded:", err);
        }
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.service.js.map