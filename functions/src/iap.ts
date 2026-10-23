export interface IapReceipt {
  platform: 'apple' | 'google';
  productId: string;
  token: string;
}

export interface IapVerifier {
  verify(receipt: IapReceipt): Promise<{ transactionId: string }>;
}

/**
 * Placeholder for App Store / Google Play server verification.
 * Replace this class before taking real payments. It only accepts tokens
 * minted by Cloud Functions and never trusts a client-supplied price.
 */
export class StubIapVerifier implements IapVerifier {
  async verify(receipt: IapReceipt): Promise<{ transactionId: string }> {
    if (!/^stub\.[a-z0-9]{16,}$/i.test(receipt.token)) {
      throw new Error('Stub IAP verifier rejected the receipt.');
    }
    if (receipt.platform !== 'apple' && receipt.platform !== 'google') {
      throw new Error('Unknown app store.');
    }
    return { transactionId: `stub_txn_${receipt.token.slice(5)}` };
  }
}

/**
 * Real verification is not implemented yet.
 * TODO(App Store): verify a StoreKit 2 signed transaction (JWS) with the App Store
 *   Server API, check bundleId, productId, environment and revocation.
 * TODO(Google Play): call purchases.products.get / purchases.subscriptionsv2.get
 *   with a service account, check packageName, productId, purchaseState, acknowledge.
 * Until then live mode rejects every purchase.
 */
export class LiveIapVerifier implements IapVerifier {
  async verify(_receipt: IapReceipt): Promise<{ transactionId: string }> {
    throw new Error('Store purchase verification is not implemented. Purchases are disabled.');
  }
}

/** IAP_MODE=stub is honoured only where stubsAllowed() is true (emulator / non-prod). */
export function iapStubMode(stubsAllowed: boolean): boolean {
  return process.env.IAP_MODE === 'stub' && stubsAllowed;
}

/** Only for the emulator / non-production stub flow. Never used in live mode. */
export function mintStubReceipt(platform: 'apple' | 'google', productId: string): IapReceipt {
  return {
    platform,
    productId,
    token: `stub.${crypto.randomUUID().replace(/-/g, '')}`,
  };
}
