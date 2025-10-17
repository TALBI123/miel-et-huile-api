import { AlertSeverity, AlertType } from "@prisma/client";
import { Model } from "../types/enums";
import prisma from "../config/db";
interface AlertCreateParams {
  type: AlertType;
  message: string;
  severity?: AlertSeverity;
  userId?: string;
  entityId: string;
  entityType: Model;
  metadata?: Record<string, any>;
}
export class AlertService {
  static async create({
    type,
    message,
    severity = AlertSeverity.INFO,
    userId,
    entityId,
    entityType,
    metadata,
  }: AlertCreateParams) {
    const alert = await prisma.alert.create({
      data: {
        type,
        message,
        severity,
        // userId,
        entityId,
        entityType,
        // metadata,
      },
    });
    return alert;
  }
}
