import { MailOptions } from "../types/type";
export declare const sendEmail: <T extends Record<string, any>>({ to, subject, htmlFileName, context, }: MailOptions<T>) => Promise<void>;
export declare const verifySendGridConnection: () => Promise<boolean>;
export declare const testEmailConnection: (testEmail?: string) => Promise<void>;
export declare const verifyEmailConfig: () => boolean;
