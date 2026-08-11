const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, toName, subject, html }: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.warn(`Brevo not configured, skipping email "${subject}" to ${to}`);
    return;
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'LabCMS' },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`Brevo send failed (${res.status}) for "${subject}" to ${to}: ${errBody}`);
    }
  } catch (error: any) {
    console.error(`Brevo send error for "${subject}" to ${to}:`, error.message);
  }
}
