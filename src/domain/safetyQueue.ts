export const REPORT_SLA_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SUPPORT_EMAIL = 'safety@dearx.app';

export type AccountStanding = 'active' | 'warned' | 'suspended' | 'banned';
export type ReportAction = 'dismiss' | 'warn' | 'remove' | 'suspend' | 'ban' | 'restore';

const BLOCKED: AccountStanding[] = ['suspended', 'banned'];

export function isAccountBlocked(standing: AccountStanding | null | undefined): boolean {
  return standing != null && BLOCKED.includes(standing);
}

export function reportDueAt(createdAt: string): string {
  const start = Date.parse(createdAt);
  if (!Number.isFinite(start)) return new Date(0).toISOString();
  return new Date(start + REPORT_SLA_MS).toISOString();
}

/** Open reports are overdue once 24 hours have passed since they were filed. */
export function reportSla(createdAt: string, status: string, nowMs: number): { overdue: boolean; remainingMs: number } {
  const open = status === 'open' || status === 'reviewing';
  const remainingMs = Date.parse(reportDueAt(createdAt)) - nowMs;
  return { overdue: open && remainingMs < 0, remainingMs };
}

export function requireAdminClaim(claim: unknown): void {
  if (claim !== true) throw new Error('Admin only.');
}

/** Custom claim is issued only when the server-side role is admin. A client flag is not enough. */
export function adminClaimAllowed(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function publishedSupportEmail(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)) return trimmed;
  return DEFAULT_SUPPORT_EMAIL;
}

export function supportTicketInput(subject: string, message: string): { subject: string; message: string } | null {
  const cleanSubject = subject.trim();
  const cleanMessage = message.trim();
  if (cleanSubject.length < 2 || cleanSubject.length > 80) return null;
  if (cleanMessage.length < 2 || cleanMessage.length > 2000) return null;
  return { subject: cleanSubject, message: cleanMessage };
}
