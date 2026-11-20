import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { HttpResponse, http } from 'msw/http';
import { sendMail } from './mailer';
import { setupMockNetwork } from './test-support/msw';

const RELAY = 'https://mail-relay.example.test';
const message = { to: 'billing@northwind.example', subject: 'Invoice INV-2026-0001', text: 'Hello' };

const server = setupMockNetwork(
  http.post(`${RELAY}/messages`, async ({ request }) => {
    const body = (await request.json()) as typeof message;
    return body.to ? new HttpResponse(null, { status: 202 }) : new HttpResponse(null, { status: 400 });
  }),
);

describe('sendMail', () => {
  beforeEach(() => {
    process.env.MAIL_RELAY_URL = RELAY;
  });

  afterEach(() => {
    delete process.env.MAIL_RELAY_URL;
  });

  test('posts the message to the relay', async () => {
    await expect(sendMail(message)).resolves.toBeUndefined();
  });

  test('fails when the relay answers with an error', async () => {
    server.use(http.post(`${RELAY}/messages`, () => new HttpResponse(null, { status: 500 })));

    await expect(sendMail(message)).rejects.toThrow('Mail relay answered 500');
  });

  test('refuses to send without a relay address', async () => {
    delete process.env.MAIL_RELAY_URL;

    await expect(sendMail(message)).rejects.toThrow('MAIL_RELAY_URL is not set');
  });
});
