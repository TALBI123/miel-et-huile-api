export interface MailOptions<T> {
  to: string;
  subject: string;
  htmlFileName: string;
  context: T;
}