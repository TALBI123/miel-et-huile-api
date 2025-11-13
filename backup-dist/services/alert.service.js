"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertService = exports.AlertService = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../config/db"));
const events_1 = require("events");
const severityRank = {
    INFO: 1,
    WARNING: 2,
    CRITICAL: 3,
    URGENT: 4,
};
class AlertService extends events_1.EventEmitter {
    constructor() {
        super();
        this.escalationInterval = 15 * 60 * 1000; // 15 minutes
        this.startEscalationMonitor();
    }
    static getInstance() {
        if (!this.instance)
            this.instance = new AlertService();
        return this.instance;
    }
    async create({ type, message, severity = client_1.AlertSeverity.INFO, entityId, entityType, tags, }) {
        const deduplicationKey = `${type}-${entityType}-${entityId}`;
        const existingAlert = await db_1.default.alert.findFirst({
            where: {
                deduplicationKey,
                type,
                status: client_1.AlertStatus.ACTIVE,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                resolvedAt: null,
            },
        });
        if (existingAlert) {
            const updatedAlert = await db_1.default.alert.update({
                where: { id: existingAlert.id },
                data: {
                    occurrences: { increment: 1 },
                    lastOccurrenceAt: new Date(),
                },
            });
            console.info(`🟡 Alerte existante mise à jour: ${deduplicationKey}, occurrences = ${updatedAlert.occurrences}`);
            return existingAlert;
        }
        const alert = await db_1.default.alert.create({
            data: {
                type,
                message,
                severity,
                deduplicationKey,
                entityId,
                occurrences: 1,
                slaDeadline: this.calculateSLADeadline(severity),
                severityRank: severityRank[severity],
                entityType,
                tags,
            },
        });
        console.info(`✅ Nouvelle alerte créée: ${deduplicationKey}`);
        return alert;
    }
    /** Résout l’alerte */
    async resolve(alertId, notes) {
        const alert = await db_1.default.alert.update({
            where: { id: alertId },
            data: {
                status: client_1.AlertStatus.RESOLVED,
                resolved: true,
                resolvedAt: new Date(),
                lastNotes: notes || null,
            },
        });
        console.log(`✅ Alerte résolue: ${alert.type} - ${alert.message}`);
        return alert;
    }
    async listActive() {
        return db_1.default.alert.findMany({
            where: { status: client_1.AlertStatus.ACTIVE },
            orderBy: { severityRank: "desc" }, // tri fiable par gravité
        });
    }
    calculateSLADeadline(severity) {
        const minutes = AlertService.SLA_TIMES[severity];
        return new Date(Date.now() + minutes * 60 * 1000);
    }
    startEscalationMonitor() {
        setInterval(async () => {
            try {
                const alerts = await db_1.default.alert.updateMany({
                    where: { status: client_1.AlertStatus.ACTIVE, slaDeadline: { lt: new Date() } },
                    data: {
                        status: client_1.AlertStatus.ESCALATED,
                        lastAction: "ESCALATED",
                        lastActionAt: new Date(),
                    },
                });
                console.log("⚠️ Alerte(s) escaladée(s) en attente de SLA dépassée.", alerts);
            }
            catch (err) {
                console.error("❌ Erreur monitor escalade:", err);
            }
        }, this.escalationInterval);
    }
}
exports.AlertService = AlertService;
AlertService.SLA_TIMES = {
    [client_1.AlertSeverity.URGENT]: 15,
    [client_1.AlertSeverity.CRITICAL]: 60,
    [client_1.AlertSeverity.WARNING]: 240,
    [client_1.AlertSeverity.INFO]: 1440,
};
exports.alertService = AlertService.getInstance();
//# sourceMappingURL=alert.service.js.map