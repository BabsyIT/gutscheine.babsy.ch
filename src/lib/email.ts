import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@babsy.ch',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; color: #9333ea; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Babsy Gutscheine</h1>
            <p>Partner Login Code</p>
          </div>
          <div class="content">
            <h2>Ihr Einmal-Code</h2>
            <p>Verwenden Sie den folgenden Code, um sich bei Babsy Gutscheine anzumelden:</p>
            <div class="otp">${otp}</div>
            <p><strong>Dieser Code ist 10 Minuten gültig.</strong></p>
            <p>Falls Sie diese Anmeldung nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Babsy. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Babsy Gutscheine - Partner Login Code

Ihr Einmal-Code: ${otp}

Dieser Code ist 10 Minuten gültig.

Falls Sie diese Anmeldung nicht angefordert haben, ignorieren Sie diese E-Mail.

© 2024 Babsy. Alle Rechte vorbehalten.
  `

  return sendEmail({
    to: email,
    subject: 'Ihr Login-Code für Babsy Gutscheine',
    html,
    text,
  })
}
