import nodemailer from 'nodemailer';
import { ENV } from '../../config/env';
import { otpTemplate, subjects } from './otp-templates';
import type { OTPType } from './otp-templates';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE === 'true',
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(
  to: string,
  otp: string,
  type: OTPType,
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"${ENV.SMTP_FROM_NAME}" <${ENV.SMTP_FROM_EMAIL}>`,
      to,
      subject: subjects[type],
      html: otpTemplate(type, otp),
    });
  } catch {
    throw new Error('Failed to send verification email');
  }
}
