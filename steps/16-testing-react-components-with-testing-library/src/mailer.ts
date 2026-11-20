export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

// Sends one email through the mail relay named in MAIL_RELAY_URL.
// Unit tests replace this whole module with jest.mock('./mailer').
export async function sendMail(message: MailMessage): Promise<void> {
  const relay = process.env.MAIL_RELAY_URL;
  if (!relay) {
    throw new Error('MAIL_RELAY_URL is not set');
  }
  const response = await fetch(`${relay}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!response.ok) {
    throw new Error(`Mail relay answered ${response.status}`);
  }
}
