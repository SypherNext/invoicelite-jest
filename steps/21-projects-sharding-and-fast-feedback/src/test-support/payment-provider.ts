import { HttpResponse, http } from 'msw/http';

export const PROVIDER_URL = 'https://payments.example.test';
export const API_KEY = 'sk_test_invoicelite';

interface ChargeBody {
  reference: string;
  customer: string;
  amount: number;
  currency: string;
}

// A small fake of the payment provider: it checks the key and the body the way
// the real one does, and answers 201 with a charge id made from the reference.
export const acceptCharges = http.post(`${PROVIDER_URL}/v1/charges`, async ({ request }) => {
  if (request.headers.get('authorization') !== `Bearer ${API_KEY}`) {
    return HttpResponse.json({ error: 'invalid api key' }, { status: 401 });
  }
  const body = (await request.json()) as ChargeBody;
  if (!Number.isInteger(body.amount) || body.amount <= 0 || !body.currency) {
    return HttpResponse.json({ error: 'invalid amount' }, { status: 400 });
  }
  return HttpResponse.json({ id: `ch_${body.reference}`, amount: body.amount }, { status: 201 });
});

export function declineCharges(reason: string) {
  return http.post(`${PROVIDER_URL}/v1/charges`, () => HttpResponse.json({ reason }, { status: 402 }));
}

// Answers 503 to the next `times` requests, then lets later handlers answer.
export function failCharges(times: number) {
  let left = times;
  return http.post(`${PROVIDER_URL}/v1/charges`, () => {
    if (left === 0) {
      return undefined;
    }
    left -= 1;
    return new HttpResponse(null, { status: 503 });
  });
}
