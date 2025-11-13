import nodemailer from "nodemailer";
import { MailOptions } from "../types/type";
type PlainObject = {
    [key: string]: any;
};
export declare const transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-pool").SentMessageInfo, import("nodemailer/lib/smtp-pool").Options>;
export declare const sendEmail: <T extends PlainObject>({ to, subject, htmlFileName, context, }: MailOptions<T>) => Promise<void>;
export {};
