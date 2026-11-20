import type { ChargeRequest, ChargeResult, PaymentGateway } from './payment-gateway';
import { retry } from './retry';

// The card was refused. Trying again will not help.
export class PaymentDeclinedError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`Payment declined: ${reason}`);
    this.name = 'PaymentDeclinedError';
    this.reason = reason;
  }
}

// The provider is down or unreachable. Trying again later may work.
export class PaymentGatewayUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentGatewayUnavailableError';
  }
}

export interface PaymentGatewayClientOptions {
  baseUrl: string;
  apiKey: string;
  attempts?: number;
  retryDelayMs?: number;
}

// Talks to the payment provider's HTTP API with fetch.
// POST {baseUrl}/v1/charges answers 201 { id }, 402 { reason } or 5xx.
export class PaymentGatewayClient implements PaymentGateway {
  private readonly options: Required<PaymentGatewayClientOptions>;

  constructor(options: PaymentGatewayClientOptions) {
    this.options = { attempts: 3, retryDelayMs: 200, ...options };
  }

  charge(request: ChargeRequest): Promise<ChargeResult> {
    return retry(() => this.postCharge(request), {
      attempts: this.options.attempts,
      delayMs: this.options.retryDelayMs,
      shouldRetry: (error) => error instanceof PaymentGatewayUnavailableError,
    });
  }

  private async postCharge(request: ChargeRequest): Promise<ChargeResult> {
    const response = await this.send(request);
    if (response.status === 201) {
      const body = (await response.json()) as { id: string };
      return { chargeId: body.id };
    }
    if (response.status === 402) {
      const body = (await response.json()) as { reason: string };
      throw new PaymentDeclinedError(body.reason);
    }
    if (response.status >= 500) {
      throw new PaymentGatewayUnavailableError(`Payment gateway answered ${response.status}`);
    }
    throw new Error(`Unexpected answer from the payment gateway: ${response.status}`);
  }

  private async send(request: ChargeRequest): Promise<Response> {
    try {
      return await fetch(`${this.options.baseUrl}/v1/charges`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.options.apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': request.invoiceNumber,
        },
        body: JSON.stringify({
          reference: request.invoiceNumber,
          customer: request.customer,
          amount: request.amount.cents,
          currency: request.amount.currency,
        }),
      });
    } catch (error) {
      throw new PaymentGatewayUnavailableError(`Payment gateway unreachable: ${(error as Error).message}`);
    }
  }
}
