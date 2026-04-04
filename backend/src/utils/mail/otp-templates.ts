export type OTPType = 'registration' | 'password_reset';

export const subjects: Record<OTPType, string> = {
  registration: 'Verify your email — LinkedIn Clone',
  password_reset: 'Reset your password — LinkedIn Clone',
};

const config: Record<OTPType, { title: string; body: string; footer: string }> = {
  registration: {
    title: 'Verify your email',
    body: 'use the code below to complete your registration. It expires in <strong>10 minutes</strong>.',
    footer: "If you didn't create an account, you can safely ignore this email.",
  },
  password_reset: {
    title: 'Reset your password',
    body: 'use the code below to reset your password. It expires in <strong>10 minutes</strong>.',
    footer: "If you didn't request a password reset, you can safely ignore this email.",
  },
};

export function otpTemplate(type: OTPType, otp: string): string {
  const { title, body, footer } = config[type];
  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5e7eb;">
                <tr>
                  <td>
                    <h2 style="margin:0 0 8px;color:#111827;font-size:24px;">${title}</h2>
                    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
                      Hi there, ${body}
                    </p>
                    <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                      <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#111827;">${otp}</span>
                    </div>
                    <p style="margin:0;color:#9ca3af;font-size:13px;">${footer}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
