import QRCode from 'qrcode'
import { randomBytes } from 'crypto'

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      width: 300,
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export function generateUniqueVoucherCode(): string {
  // Generate a unique code for the voucher
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(8).toString('hex')
  return `BABSY-${timestamp}-${randomPart}`.toUpperCase()
}

export async function generateVoucherQRCode(voucherCode: string, appUrl: string): Promise<string> {
  // The QR code will contain a URL to the voucher redemption page
  const redemptionUrl = `${appUrl}/voucher/${voucherCode}`
  return await generateQRCode(redemptionUrl)
}
