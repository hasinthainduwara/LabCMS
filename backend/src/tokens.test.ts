import { describe, it, expect } from 'vitest';
import { hashToken, generateResetToken, RESET_TOKEN_TTL_MS } from './tokens';

describe('tokens', () => {
  it('generates 64-char hex tokens that are unique per call', () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('hashes the same token to the same value deterministically', () => {
    const token = generateResetToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('hashes different tokens to different values', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });

  it('sets a 1 hour TTL', () => {
    expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });
});
