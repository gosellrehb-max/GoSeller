declare module 'nodemailer' {
  export interface Transporter {
    sendMail(options: { from?: string; to: string; subject: string; text?: string; html?: string }): Promise<unknown>;
  }
  export function createTransport(options: Record<string, unknown>): Transporter;
}
