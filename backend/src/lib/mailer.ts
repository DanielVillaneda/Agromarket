import nodemailer from 'nodemailer';

/**
 * Transporter de correo vía SMTP (pensado para una cuenta de Gmail con
 * "contraseña de aplicación", pero funciona con cualquier proveedor SMTP).
 * Si no hay credenciales configuradas, queda en null: en vez de romper el
 * flujo de recuperación en desarrollo, el código se imprime en la consola
 * del servidor (ver sendRecoveryCodeEmail).
 */
const transporter =
  process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export async function sendRecoveryCodeEmail(to: string, code: string): Promise<void> {
  if (!transporter) {
    console.warn(
      `[mailer] SMTP no configurado: el código de recuperación para ${to} es ${code} (válido 15 minutos). ` +
        'Configura SMTP_USER/SMTP_PASS en .env para enviarlo de verdad.',
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject: 'Tu código para recuperar tu cuenta en AgroMarket',
    text: `Tu código de recuperación es: ${code}\n\nExpira en 15 minutos. Si no fuiste tú, ignora este correo.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">AgroMarket</h2>
        <p>Usa este código para recuperar tu cuenta:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #24331f;">${code}</p>
        <p style="color: #6b7568; font-size: 13px;">Expira en 15 minutos. Si no fuiste tú, ignora este correo.</p>
      </div>
    `,
  });
}
