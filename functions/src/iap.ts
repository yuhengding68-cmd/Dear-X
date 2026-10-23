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

export function mintStubReceipt(platform: 'apple' | 'google', productId: string): IapReceipt {
  return {
    platform,
    productId,
    token: `stub.${crypto.randomUUID().replace(/-/g, '')}`,
  };
}
