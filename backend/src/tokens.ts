import crypto from 'crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const generateResetToken = () => crypto.randomBytes(32).toString('hex');
