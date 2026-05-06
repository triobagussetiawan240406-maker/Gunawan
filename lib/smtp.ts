import nodemailer from 'nodemailer'

// Inisialisasi transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true untuk port 465, false untuk 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Verifikasi koneksi SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Error:', error)
  } else {
    console.log('SMTP Server ready to send emails')
  }
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

/**
 * Mengirim email via Custom SMTP
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.SMTP_FROM_EMAIL || 'noreply@example.com'
}: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

/**
 * Mengirim email verifikasi
 */
export async function sendVerificationEmail(email: string, verificationLink: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verifikasi Email Anda</h2>
      <p>Terima kasih sudah mendaftar. Silakan klik tombol di bawah untuk memverifikasi email Anda:</p>
      <a href="${verificationLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      ">Verifikasi Email</a>
      <p style="margin-top: 20px; color: #666;">
        Atau copy link ini: <a href="${verificationLink}">${verificationLink}</a>
      </p>
      <p style="color: #999; font-size: 12px;">
        Link ini berlaku selama 24 jam.
      </p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Verifikasi Email - E-Learning Code Evaluator',
    html
  })
}

/**
 * Mengirim email reset password
 */
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Reset Password</h2>
      <p>Anda meminta untuk mereset password. Klik tombol di bawah untuk melanjutkan:</p>
      <a href="${resetLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #28a745;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin-top: 20px;
      ">Reset Password</a>
      <p style="margin-top: 20px; color: #666;">
        Atau copy link ini: <a href="${resetLink}">${resetLink}</a>
      </p>
      <p style="color: #999; font-size: 12px;">
        Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset ini, abaikan email ini.
      </p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Reset Password - E-Learning Code Evaluator',
    html
  })
}

/**
 * Mengirim email notifikasi
 */
export async function sendNotificationEmail(email: string, title: string, message: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `${title} - E-Learning Code Evaluator`,
    html
  })
}
