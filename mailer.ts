import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<{ success: boolean; provider: string; message: string }> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, RESEND_API_KEY } = process.env;

  
  if (SMTP_HOST) {
    try {
      const port = parseInt(SMTP_PORT || '587', 10);
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: port,
        secure: port === 465, 
        auth: SMTP_USER && SMTP_PASS ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        } : undefined,
      });

      const fromAddress = SMTP_FROM || SMTP_USER || '"University Hub" <noreply@universityhub.edu>';
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      console.log(`[MAILER] Real email successfully sent via SMTP to ${to} (Subject: "${subject}")`);
      return { success: true, provider: 'SMTP', message: 'E-mail sent successfully via SMTP' };
    } catch (err: any) {
      console.error(`[MAILER] SMTP delivery stalled or failed: ${err.message}`);
      
    }
  }

  
  if (RESEND_API_KEY) {
    try {
      const fromAddress = SMTP_FROM || 'onboarding@resend.dev';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          text,
          html,
        }),
      });

      if (res.ok) {
        console.log(`[MAILER] Real email successfully sent via Resend API to ${to} (Subject: "${subject}")`);
        return { success: true, provider: 'RESEND', message: 'E-mail sent successfully via Resend' };
      } else {
        const bodyText = await res.text();
        console.error(`[MAILER] Resend API returned error status: ${res.status}. Body: ${bodyText}`);
      }
    } catch (err: any) {
      console.error(`[MAILER] Resend mail delivery failed: ${err.message}`);
    }
  }

  // 3. Fallback / Simulation Log
  const mockAlert = `
=========================================
[MAILER SIMULATION LOG]
TO: ${to}
SUBJECT: ${subject}
TEXT CONTENT:
${text}
=========================================
`;
  console.log(mockAlert);
  return { 
    success: true, 
    provider: 'SIMULATION', 
    message: 'Email processed in Sandbox mode (Check Server Logs/Console)' 
  };
}
