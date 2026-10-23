export type KycVendorName = 'didit' | 'veriff';

export interface KycVendor {
  readonly name: KycVendorName;
  createSession(input: { userId: string; reference: string }): Promise<{
    sessionId: string;
    redirectUrl: string;
  }>;
}

/**
 * Identity-check vendor boundary. Didit and Veriff are named so a live
 * integration can replace the body of createSession. This build returns a
 * non-routable stub URL and does not contact a vendor.
 */
export function createKycVendor(): KycVendor {
  const name: KycVendorName = process.env.KYC_VENDOR === 'veriff' ? 'veriff' : 'didit';
  return {
    name,
    async createSession({ userId, reference }) {
      return {
        sessionId: `stub_${reference}`,
        redirectUrl: `https://kyc.invalid/${name}/session/${encodeURIComponent(userId)}`,
      };
    },
  };
}

export function stubKycCompletionAllowed(): boolean {
  return process.env.KYC_MODE !== 'live';
}
