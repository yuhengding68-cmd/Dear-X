export interface PayoutTransferRequest {
  creatorId: string;
  amountCents: number;
  currency: 'AUD';
}

export interface PayoutProvider {
  readonly name: 'airwallex';
  createTransfer(input: PayoutTransferRequest): Promise<{ transferId: string; status: 'pending' }>;
}

/**
 * Licensed payout boundary. Airwallex is the intended provider for Australia.
 * This stub does not move money and is only called from Cloud Functions.
 */
export function createPayoutProvider(): PayoutProvider {
  return {
    name: 'airwallex',
    async createTransfer(input) {
      return {
        transferId: `awx_stub_${input.creatorId.slice(0, 12)}_${Date.now()}`,
        status: 'pending',
      };
    },
  };
}
