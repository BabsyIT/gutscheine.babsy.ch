import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

/**
 * Exchange Online Email Service mit OAuth2
 * Verwendet ein dediziertes Postfach für OTP-Versand
 */

let transporter: Transporter | null = null

/**
 * Initialisiert den Exchange Online Transporter mit OAuth2
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  // Exchange Online mit OAuth2 (Modern Authentication)
  transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // TLS
    auth: {
      type: 'OAuth2',
      user: process.env.EXCHANGE_USER, // z.B. noreply@babsy.ch
      clientId: process.env.EXCHANGE_CLIENT_ID,
      clientSecret: process.env.EXCHANGE_CLIENT_SECRET,
      refreshToken: process.env.EXCHANGE_REFRESH_TOKEN,
      accessToken: process.env.EXCHANGE_ACCESS_TOKEN,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  })

  return transporter
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Sendet eine Email via Exchange Online
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailer = getTransporter()

    await mailer.sendMail({
      from: `Babsy Gutscheine <${process.env.EXCHANGE_USER || 'noreply@babsy.ch'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return true
  } catch (error) {
    console.error('Error sending email via Exchange:', error)
    return false
  }
}

/**
 * Sendet OTP-Code via Exchange Online
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #1f2937;
            margin: 0 0 20px;
            font-size: 20px;
          }
          .content p {
            color: #4b5563;
            margin: 0 0 15px;
          }
          .otp-box {
            background: #f9fafb;
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 12px;
            color: #9333ea;
            font-family: 'Courier New', monospace;
          }
          .validity {
            margin-top: 15px;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            padding: 20px 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 13px;
          }
          .footer a {
            color: #9333ea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Babsy Gutscheine</h1>
            <p>Ihr Einmal-Passwort (OTP)</p>
          </div>
          <div class="content">
            <h2>Sicherer Login</h2>
            <p>Sie haben einen Login-Code für die Babsy Gutschein-Plattform angefordert.</p>
            <p>Verwenden Sie den folgenden Code, um sich anzumelden:</p>

            <div class="otp-box">
              <div class="otp">${otp}</div>
              <div class="validity">⏱ Gültig für 10 Minuten</div>
            </div>

            <div class="warning">
              <p><strong>⚠️ Sicherheitshinweis:</strong> Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Teilen Sie diesen Code niemals mit anderen Personen.</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Der Code kann nur einmal verwendet werden und verfällt automatisch nach 10 Minuten.
            </p>
          </div>
          <div class="footer">
            <p><strong>Babsy AG</strong></p>
            <p>Gutschein-Plattform für Partner</p>
            <p style="margin-top: 15px;">
              <a href="https://babsy.ch">babsy.ch</a> |
              <a href="mailto:support@babsy.ch">support@babsy.ch</a>
            </p>
            <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} Babsy AG. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Babsy Gutscheine - Ihr Login-Code

Sie haben einen Login-Code für die Babsy Gutschein-Plattform angefordert.

Ihr Einmal-Code: ${otp}

⏱ Dieser Code ist 10 Minuten gültig.

⚠️ SICHERHEITSHINWEIS:
Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
Teilen Sie diesen Code niemals mit anderen Personen.

Der Code kann nur einmal verwendet werden und verfällt automatisch nach 10 Minuten.

---
Babsy AG
Gutschein-Plattform für Partner
babsy.ch | support@babsy.ch

© ${new Date().getFullYear()} Babsy AG. Alle Rechte vorbehalten.
  `

  return sendEmail({
    to: email,
    subject: 'Ihr Login-Code für Babsy Gutscheine',
    html,
    text,
  })
}

/**
 * Sendet eine Willkommens-Email an neue Partner
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .content { padding: 40px 30px; }
          .footer {
            text-align: center;
            padding: 20px 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Willkommen bei Babsy!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name},</h2>
            <p>Vielen Dank für Ihre Registrierung als Partner auf der Babsy Gutschein-Plattform!</p>
            <p>Ihre Registrierung wird nun von unserem Team geprüft. Sie erhalten eine Benachrichtigung, sobald Ihr Account freigeschaltet wurde.</p>
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Beste Grüße<br>Ihr Babsy Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Babsy AG. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Willkommen bei Babsy Gutscheine',
    html,
  })
}
