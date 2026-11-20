import { describe, expect, test } from '@jest/globals';
import { HttpResponse, http } from 'msw/http';
import { Money } from './money';
import { PaymentDeclinedError, PaymentGatewayClient, PaymentGatewayUnavailableError } from './payment-gateway-client';
import { setupMockNetwork } from './test-support/msw';
import { acceptCharges, API_KEY, declineCharges, failCharges, PROVIDER_URL } from './test-support/payment-provider';

const server = setupMockNetwork(acceptCharges);

const client = new PaymentGatewayClient({ baseUrl: PROVIDER_URL, apiKey: API_KEY, retryDelayMs: 1 });
const charge = { invoiceNumber: 'INV-2026-0001', customer: 'Northwind Traders', amount: Money.of(2975) };

describe('PaymentGatewayClient', () => {
  test('returns the charge id the provider created', async () => {
    await expect(client.charge(charge)).resolves.toEqual({ chargeId: 'ch_INV-2026-0001' });
  });

  test('a wrong API key is not retried and not hidden', async () => {
    const wrongKey = new PaymentGatewayClient({ baseUrl: PROVIDER_URL, apiKey: 'sk_wrong', retryDelayMs: 1 });

    await expect(wrongKey.charge(charge)).rejects.toThrow('Unexpected answer from the payment gateway: 401');
  });

  test('turns a 402 into PaymentDeclinedError with the reason', async () => {
    server.use(declineCharges('insufficient_funds'));

    const result = client.charge(charge);

    await expect(result).rejects.toThrow(PaymentDeclinedError);
    await expect(result).rejects.toMatchObject({ reason: 'insufficient_funds' });
  });

  test('tries again after a 503 and succeeds', async () => {
    server.use(failCharges(1));

    await expect(client.charge(charge)).resolves.toEqual({ chargeId: 'ch_INV-2026-0001' });
  });

  test('gives up after three 503 answers', async () => {
    server.use(failCharges(3));

    await expect(client.charge(charge)).rejects.toThrow(
      new PaymentGatewayUnavailableError('Payment gateway answered 503'),
    );
  });

  test('treats a network failure as unavailable', async () => {
    server.use(http.post(`${PROVIDER_URL}/v1/charges`, () => HttpResponse.error()));

    await expect(client.charge(charge)).rejects.toThrow(PaymentGatewayUnavailableError);
  });

  test('sends one request per attempt, with the invoice number as idempotency key', async () => {
    const keys: (string | null)[] = [];
    server.events.on('request:start', ({ request }) => {
      keys.push(request.headers.get('idempotency-key'));
    });
    server.use(failCharges(2));

    await client.charge(charge);
    server.events.removeAllListeners();

    expect(keys).toEqual(['INV-2026-0001', 'INV-2026-0001', 'INV-2026-0001']);
  });
});
