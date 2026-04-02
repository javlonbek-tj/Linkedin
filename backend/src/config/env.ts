function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const ENV = {
  PORT: Number(requireEnv('PORT')),
  NODE_ENV: requireEnv('NODE_ENV'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  SMTP_USER: requireEnv('SMTP_USER'),
  SMTP_PASSWORD: requireEnv('SMTP_PASSWORD'),
  SMTP_HOST: requireEnv('SMTP_HOST'),
  SMTP_PORT: Number(requireEnv('SMTP_PORT')),
  SMTP_SECURE: requireEnv('SMTP_SECURE'),
};
