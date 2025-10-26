import { AlertSeverity, AlertTag, AlertType } from "@prisma/client";
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
export declare class AlertService extends EventEmitter {
    private escalationInterval;
    private static instance;
    private static SLA_TIMES;
    private constructor();
    static getInstance(): AlertService;
    create({ type, message, severity, entityId, entityType, tags, }: AlertConfig): Promise<{
        type: import(".prisma/client").$Enums.AlertType;
        message: string;
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        createdAt: Date;
        severity: import(".prisma/client").$Enums.AlertSeverity;
        entityId: string | null;
        entityType: string;
        tags: import(".prisma/client").$Enums.AlertTag[];
        severityRank: number;
        resolved: boolean;
        occurrences: number;
        lastOccurrenceAt: Date | null;
        deduplicationKey: string | null;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
        lastAction: string | null;
        lastActionAt: Date | null;
        lastNotes: string | null;
    }>;
    /** Résout l’alerte */
    resolve(alertId: string, notes?: string): Promise<{
        type: import(".prisma/client").$Enums.AlertType;
        message: string;
        id: string;
        status: import(".prisma/client").$Enums.AlertStatus;
        createdAt: Date;
        severity: import(".prisma/client").$Enums.AlertSeverity;
        entityId: string | null;
        entityType: string;
        tags: import(".prisma/client").$Enums.AlertTag[];
        severityRank: number;
        resolved: boolean;
        occurrences: number;
        lastOccurrenceAt: Date | null;
        deduplicationKey: string | null;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
        lastAction: string | null;
        lastActionAt: Date | null;
        lastNotes: string | null;
    }>;
    private listActive;
    private calculateSLADeadline;
    private startEscalationMonitor;
}
export declare const alertService: AlertService;
