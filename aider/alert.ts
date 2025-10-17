import  prisma  from "../src/config/db";
import { EventEmitter } from "events";

export enum AlertType {
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_FRAUD_DETECTED = "PAYMENT_FRAUD_DETECTED",
  PAYMENT_REFUND_FAILED = "PAYMENT_REFUND_FAILED",
  DISPUTE_CREATED = "DISPUTE_CREATED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  STOCK_LOW = "STOCK_LOW",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  SECURITY_BREACH_ATTEMPT = "SECURITY_BREACH_ATTEMPT",
  REVENUE_DROP = "REVENUE_DROP",
}

export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  URGENT = "URGENT",
}

export enum AlertStatus {
  ACTIVE = "ACTIVE",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  INVESTIGATING = "INVESTIGATING",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  ESCALATED = "ESCALATED",
}

export interface AlertConfig {
  type: AlertType;
  message: string;
  severity?: AlertSeverity;
  entityId?: string;
  entityType?: string;
  meta?: Record<string, any>;
  assignedTo?: string;
  deduplicationKey?: string;
  source?: string;
  tags?: string[];
}

export class AlertService extends EventEmitter {
  private static instance: AlertService;

  private static SLA_TIMES: Record<AlertSeverity, number> = {
    [AlertSeverity.URGENT]: 15,
    [AlertSeverity.CRITICAL]: 60,
    [AlertSeverity.WARNING]: 240,
    [AlertSeverity.INFO]: 1440,
  };

  private escalationInterval = 5 * 60 * 1000; // 5 minutes
  private notificationQueue: (() => Promise<void>)[] = [];
  private isProcessingQueue = false;

  private constructor() {
    super();
    this.startEscalationMonitor();
    this.setupNotificationHandlers();
  }

  static getInstance(): AlertService {
    if (!this.instance) this.instance = new AlertService();
    return this.instance;
  }

  /** Créer une alerte avec déduplication intelligente */
  async create(config: AlertConfig) {
    const {
      type,
      message,
      severity = AlertSeverity.INFO,
      entityId,
      entityType,
      meta,
      assignedTo,
      deduplicationKey,
      source = "system",
      tags = [],
    } = config;

    if (deduplicationKey) {
      const existing = await this.findActiveDuplicate(deduplicationKey, type);
      if (existing) {
        await this.incrementOccurrence(existing.id, meta);
        return existing;
      }
    }

    const alert = await prisma.alert.create({
      data: {
        type,
        message,
        severity,
        status: AlertStatus.ACTIVE,
        entityId,
        entityType,
        meta: meta ? JSON.stringify(meta) : null,
        assignedTo,
        deduplicationKey,
        source,
        tags,
        occurrences: 1,
        slaDeadline: this.calculateSLADeadline(severity),
      },
    });

    await this.logAlertHistory(alert.id, "CREATED", "system", { initialData: alert });
    this.enqueueNotification(alert, "created");

    return alert;
  }

  /** Prend en charge l’alerte */
  async acknowledge(alertId: string, userId: string, comment?: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        // status: AlertStatus.ACKNOWLEDGED,
        // acknowledgedAt: new Date(),
        // acknowledgedBy: userId,
      },
    });
    await this.logAlertHistory(alertId, "ACKNOWLEDGED", userId, { comment });
    this.emit("alert:acknowledged", alert);
    return alert;
  }

  /** Met l’alerte en investigation */
  async investigate(alertId: string, userId: string, notes?: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.INVESTIGATING,
        investigatedBy: userId,
      },
    });
    await this.logAlertHistory(alertId, "INVESTIGATING", userId, { notes });
    this.emit("alert:investigating", alert);
    return alert;
  }

  /** Résout l’alerte */
  async resolve(alertId: string, userId: string, resolution: { notes: string; rootCause?: string; actionTaken?: string }) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolutionNotes: resolution.notes,
        rootCause: resolution.rootCause,
        actionTaken: resolution.actionTaken,
      },
    });

    await this.logAlertHistory(alertId, "RESOLVED", userId, resolution);
    this.emit("alert:resolved", alert);
    await this.calculateResolutionMetrics(alert);

    return alert;
  }

  /** Escalade automatique ou manuelle */
  async escalate(alertId: string, reason: string, escalateTo?: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.ESCALATED,
        severity: AlertSeverity.URGENT,
        escalatedAt: new Date(),
        escalationReason: reason,
        assignedTo: escalateTo,
      },
    });

    await this.logAlertHistory(alertId, "ESCALATED", "system", { reason, escalateTo });
    this.enqueueNotification(alert, "escalated");

    return alert;
  }

  /** Liste les alertes actives */
  async listActive(filters?: {
    severity?: AlertSeverity[];
    type?: AlertType[];
    assignedTo?: string;
    entityType?: string;
    tags?: string[];
  }) {
    const where: any = { status: { in: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.INVESTIGATING] } };
    if (filters?.severity) where.severity = { in: filters.severity };
    if (filters?.type) where.type = { in: filters.type };
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.tags?.length) where.tags = { hasSome: filters.tags };

    return prisma.alert.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { history: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
  }

  /** Récupère les alertes en breach SLA */
  private async getSLABreaches() {
    return prisma.alert.findMany({
      where: { status: { notIn: [AlertStatus.RESOLVED, AlertStatus.CLOSED] }, slaDeadline: { lt: new Date() } },
      orderBy: { severity: "desc" },
    });
  }

  /** Statistiques */
  async getMetrics(period: { from: Date; to: Date }) {
    const alerts = await prisma.alert.findMany({ where: { createdAt: { gte: period.from, lte: period.to } } });
    const resolved = alerts.filter((a) => a.resolved);
    const avgResolutionTime = resolved.reduce((sum, a) => (a.resolvedAt ? sum + (a.resolvedAt.getTime() - a.createdAt.getTime()) : sum), 0) / (resolved.length || 1);

    return {
      total: alerts.length,
      byType: this.groupBy(alerts, "type"),
      bySeverity: this.groupBy(alerts, "severity"),
      byStatus: this.groupBy(alerts, "status"),
      resolved: resolved.length,
      resolutionRate: (resolved.length / alerts.length) * 100,
      avgResolutionTimeMinutes: Math.round(avgResolutionTime / 60000),
      slaBreaches: alerts.filter((a) => a.slaBreached).length,
      mostCommon: this.getMostCommonType(alerts),
    };
  }

  /** PRIVATE METHODS */

  private async findActiveDuplicate(key: string, type: AlertType) {
    return prisma.alert.findFirst({
      where: { deduplicationKey: key, type, status: { notIn: [AlertStatus.RESOLVED, AlertStatus.CLOSED] }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  }

  private async incrementOccurrence(alertId: string, meta?: Record<string, any>) {
    return prisma.alert.update({
      where: { id: alertId },
      data: {
        occurrences: { increment: 1 },
        lastOccurrenceAt: new Date(),
        meta: meta ? { set: JSON.stringify(meta) } : undefined,
      },
    });
  }

  private calculateSLADeadline(severity: AlertSeverity) {
    const minutes = AlertService.SLA_TIMES[severity];
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private async logAlertHistory(alertId: string, action: string, userId: string, meta?: any) {
    await prisma.alertHistory.create({ data: { alertId, action, userId, meta: meta ? JSON.stringify(meta) : null } });
  }

  private async calculateResolutionMetrics(alert: any) {
    if (alert.resolvedAt) {
      const resolutionTime = alert.resolvedAt.getTime() - alert.createdAt.getTime();
      const slaBreached = alert.resolvedAt > alert.slaDeadline;

      await prisma.alert.update({
        where: { id: alert.id },
        data: { resolutionTimeMinutes: Math.round(resolutionTime / 60000), slaBreached },
      });
    }
  }

  private startEscalationMonitor() {
    setInterval(async () => {
      const breaches = await this.getSLABreaches();
      for (const alert of breaches) {
        if (alert.status !== AlertStatus.ESCALATED) {
          await this.escalate(alert.id, `SLA breach: deadline was ${alert.slaDeadline}`);
        }
      }
    }, this.escalationInterval);
  }

  private setupNotificationHandlers() {
    this.on("alert:created", (alert) => this.enqueueNotification(alert, "created"));
    this.on("alert:escalated", (alert) => this.enqueueNotification(alert, "escalated"));
  }

  private enqueueNotification(alert: any, event: string) {
    this.notificationQueue.push(async () => this.sendNotification(alert, event));
    if (!this.isProcessingQueue) this.processQueue();
  }

  private async processQueue() {
    this.isProcessingQueue = true;
    while (this.notificationQueue.length) {
      const job = this.notificationQueue.shift()!;
      try { await job(); } catch (err) { console.error("Notification error:", err); }
    }
    this.isProcessingQueue = false;
  }

  private async sendNotification(alert: any, event: string) {
    console.log(`📢 Notification [${event}]: ${alert.type} - ${alert.message}`);
    // TODO: Slack / Email / PagerDuty integration
  }

  private groupBy(items: any[], key: string) {
    return items.reduce((acc, item) => { const value = item[key]; acc[value] = (acc[value] || 0) + 1; return acc; }, {} as Record<string, number>);
  }

  private getMostCommonType(alerts: any[]) {
    const grouped = this.groupBy(alerts, "type");
    return Object.entries(grouped).sort(([, a], [, b]) => b - a)[0]?.[0];
  }
}

// Export singleton
export const alertService = AlertService.getInstance();
