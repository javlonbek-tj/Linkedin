import crypto from 'crypto';

export function generateOtp(): string {
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}
