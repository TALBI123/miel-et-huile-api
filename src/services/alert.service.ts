import { AlertSeverity, AlertStatus, AlertTag, AlertType } from "@prisma/client";
import prisma from "../config/db";
import { EventEmitter } from "events";
export interface AlertConfig {
  type: AlertType;
  message: string;
  severity?: AlertSeverity;
  entityId?: string;
  entityType: string;
  meta?: Record<string, any>;
  deduplicationKey?: string;
  tags?: AlertTag[];
}
const severityRank: Record<AlertSeverity, number> = {
  INFO: 1,
  WARNING: 2,
  CRITICAL: 3,
  URGENT: 4,
};

export class AlertService extends EventEmitter {
  private escalationInterval = 15 * 60 * 1000; // 15 minutes
  private static instance: AlertService;
  private static SLA_TIMES: Record<AlertSeverity, number> = {
    [AlertSeverity.URGENT]: 15,
    [AlertSeverity.CRITICAL]: 60,
    [AlertSeverity.WARNING]: 240,
    [AlertSeverity.INFO]: 1440,
  };

  private constructor() {
    super();
    // this.startEscalationMonitor();
  }
  public static getInstance(): AlertService {
    if (!this.instance) this.instance = new AlertService();
    return this.instance;
  }

  async create({
    type,
    message,
    severity = AlertSeverity.INFO,
    entityId,
    entityType,
    tags,
  }: AlertConfig) {
    const deduplicationKey = `${type}-${entityType}-${entityId}`;
    const existingAlert = await prisma.alert.findFirst({
      where: {
        deduplicationKey,
        type,
        status: AlertStatus.ACTIVE,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        resolvedAt: null,
      },
    });

    if (existingAlert) {
      const updatedAlert = await prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          occurrences: { increment: 1 },
          lastOccurrenceAt: new Date(),
        },
      });
      console.info(
        `🟡 Alerte existante mise à jour: ${deduplicationKey}, occurrences = ${updatedAlert.occurrences}`
      );

      return existingAlert;
    }
    const alert = await prisma.alert.create({
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
  async resolve(alertId: string, notes?: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolved: true,
        resolvedAt: new Date(),
        lastNotes: notes || null,
      },
    });
    console.log(`✅ Alerte résolue: ${alert.type} - ${alert.message}`);
    return alert;
  }
  private async listActive() {
    return prisma.alert.findMany({
      where: { status: AlertStatus.ACTIVE },
      orderBy: { severityRank: "desc" }, // tri fiable par gravité
    });
  }

  private calculateSLADeadline(severity: AlertSeverity) {
    const minutes = AlertService.SLA_TIMES[severity];
    return new Date(Date.now() + minutes * 60 * 1000);
  }
  private startEscalationMonitor() {
    setInterval(async () => {
      try {
     const alerts =  await prisma.alert.updateMany({
        where: { status: AlertStatus.ACTIVE, slaDeadline: { lt: new Date() } },
        data: {
          status: AlertStatus.ESCALATED,
          lastAction: "ESCALATED",
          lastActionAt: new Date(),
        },
      });
      console.log("⚠️ Alerte(s) escaladée(s) en attente de SLA dépassée.", alerts);
    } catch (err) {
      console.error("❌ Erreur monitor escalade:", err);
    }
    }, this.escalationInterval);
  }
}
export const alertService = AlertService.getInstance();
