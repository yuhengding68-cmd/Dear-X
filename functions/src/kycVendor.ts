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

/**
 * Live is the default. The stub completion callable only works when
 * KYC_MODE=stub is set explicitly AND the functions run in the emulator
 * (FUNCTIONS_EMULATOR=true) or with ALLOW_STUBS=true on a non-production project.
 */
export function stubsAllowed(): boolean {
  const emulator = process.env.FUNCTIONS_EMULATOR === 'true';
  const project = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? '';
  const nonProd = process.env.ALLOW_STUBS === 'true' && !/prod/i.test(project);
  return emulator || nonProd;
}

export function stubKycCompletionAllowed(): boolean {
  return process.env.KYC_MODE === 'stub' && stubsAllowed();
}
