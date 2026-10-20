import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.logger.log(
      `📧 EmailService init — host=${host} port=${port} user=${user} passSet=${!!pass}`,
    );

    if (!host || !user || !pass) {
      this.logger.error(
        '❌ SMTP config missing. Check .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: { user, pass },
      // Helps with Gmail on some networks
      tls: { rejectUnauthorized: false },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });

    // Verify on startup — surfaces auth problems immediately
    this.transporter.verify((err, ok) => {
      if (err) {
        this.logger.error(`❌ SMTP verify FAILED: ${err.message}`);
      } else {
        this.logger.log('✅ SMTP ready — Gmail connection verified');
      }
    });
  }

  async sendActivationEmail(params: {
    to: string;
    firstName: string;
    role: string;
    token: string;
    invitedByName: string;
  }) {
    const activationBase = process.env.ACTIVATION_URL || 'http://localhost:3000/activate';
    const activationLink = `${activationBase}?token=${params.token}`;

    this.logger.log(`📧 Sending activation email to ${params.to}`);
    this.logger.log(`🔗 Activation link: ${activationLink}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a73e8;">Welcome to TrainerMatrix</h2>
        <p>Hi <strong>${params.firstName}</strong>,</p>
        <p>You've been invited by <strong>${params.invitedByName}</strong> as a <strong>${params.role}</strong>.</p>
        <p>Click the button below to activate your account and set your password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}"
             style="background: #1a73e8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Activate Account
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Or copy this link:<br/>
          <a href="${activationLink}">${activationLink}</a>
        </p>
        <p style="color: #666; font-size: 13px;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          If you didn't expect this email, you can ignore it.
        </p>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: params.to,
        subject: 'Activate your TrainerMatrix account',
        html,
      });
      this.logger.log(`✉️  Email SENT — MessageId: ${info.messageId}`);
      return info;
    } catch (err: any) {
      this.logger.error(`❌ Email SEND FAILED to ${params.to}`);
      this.logger.error(`   Error: ${err?.message || err}`);
      this.logger.error(`   Code: ${err?.code || 'unknown'}`);
      this.logger.error(`   Response: ${err?.response || 'no response'}`);
      throw err;
    }
  }
}