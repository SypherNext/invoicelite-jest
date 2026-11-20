import type { Money } from './money';

export interface ChargeRequest {
  invoiceNumber: string;
  customer: string;
  amount: Money;
}

export interface ChargeResult {
  chargeId: string;
}

// Takes money from the customer. The real one calls a payment provider over HTTP.
export interface PaymentGateway {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
