const nodemailer = require('nodemailer');

function hasMailerConfig() {
  //ép kiểu
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    secure: true,
  });
}

async function sendOtpEmail(toEmail, otp) {
  if (!hasMailerConfig()) {
    throw new Error('Mailer is not configured (GMAIL_USER/GMAIL_APP_PASSWORD)');
  }

  const from = process.env.MAIL_FROM || process.env.GMAIL_USER;
  const appName = process.env.APP_NAME || 'Limousine Booking';
  const transporter = createTransport();
  console.log('Sending OTP to:', toEmail);

  try {

    await transporter.verify();
    console.log('Mail transporter is ready');
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `[${appName}] Mã OTP đăng nhập`,
      text: `Mã OTP của bạn là: ${otp}\nMã có hiệu lực trong 5 phút.\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 12px 0">${appName}</h2>
          <p>Mã OTP của bạn là:</p>
          <div style="font-size:28px;font-weight:800;letter-spacing:4px;margin:12px 0">${otp}</div>
          <p>Mã có hiệu lực trong <b>5 phút</b>.</p>
          <p style="color:#666">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });

    console.log(' Email sent:', info.response);

    return true;

  } catch (error) {
    console.error('Send mail error:', error);
    throw new Error('Không gửi được email OTP');
  }
}
module.exports = {
  hasMailerConfig,
  sendOtpEmail,
};