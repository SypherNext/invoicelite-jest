import type { NextFunction, Request, Response } from 'express';
import { InvalidInvoiceStateError, ValidationError } from '../errors';
import { InvoiceNotFoundError } from '../invoice-repository';
import { PaymentDeclinedError, PaymentGatewayUnavailableError } from '../payment-gateway-client';

// Which domain error becomes which HTTP status.
const STATUS_FOR: [new (...args: never[]) => Error, number][] = [
  [ValidationError, 400],
  [InvoiceNotFoundError, 404],
  [InvalidInvoiceStateError, 409],
  [PaymentDeclinedError, 402],
  [PaymentGatewayUnavailableError, 503],
];

// Express calls a four-argument middleware with any error a route throws or rejects with.
export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
  const match = STATUS_FOR.find(([type]) => error instanceof type);
  if (match) {
    res.status(match[1]).json({ error: (error as Error).message });
    return;
  }
  if (isBadJson(error)) {
    res.status(400).json({ error: 'The request body is not valid JSON' });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Something went wrong' });
}

function isBadJson(error: unknown): boolean {
  return (error as { type?: string }).type === 'entity.parse.failed';
}
