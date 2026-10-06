import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp, title = 'Verification Code') => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border-radius: 12px; background-color: #12141a; color: #f4f4f6;">
      <h2 style="color: #d4af37; text-align: center; margin-bottom: 5px;">THE CLASSIC CUT SALON</h2>
      <p style="text-align: center; color: #a0a5b5; font-size: 14px;">Gentleman Grooming & Luxury Barber</p>
      <div style="margin: 30px 0; padding: 20px; background: #1c1f26; text-align: center; border-radius: 8px; border: 1px dashed #d4af37;">
        <p style="margin: 0; font-size: 14px; color: #cbd5e1;">Your 6-Digit ${title}:</p>
        <h1 style="font-size: 36px; letter-spacing: 6px; color: #ffffff; margin: 10px 0;">${otp}</h1>
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Valid for 10 minutes only. Do not share this code.</p>
      </div>
      <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
  `;

  // 1. Support Google Apps Script Relay (100% Free, NO Domain needed, sends directly from your personal Gmail over Port 443 HTTPS)
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const gRes = await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          subject: `Your ${title}: ${otp} - The Classic Cut Salon`,
          html: htmlContent,
        }),
      });
      if (gRes.ok) {
        console.log(`✉️ Real OTP email delivered via Google Apps Script to ${email}`);
        return { success: true, mode: 'google-script-https' };
      }
      const errText = await gRes.text();
      console.warn('Google Script Web App returned error:', errText);
    } catch (err) {
      console.warn('Google Script Web App failed:', err.message);
    }
  }

  // 2. Support EmailJS HTTPS API (100% Free, NO Domain needed, connects directly to Gmail)
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    try {
      const ejsRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            to_email: email,
            email: email,
            otp: otp,
            otp_code: otp,
            message: `Your Classic Cut Salon verification code is ${otp}. Valid for 10 minutes.`,
          },
        }),
      });
      if (ejsRes.ok) {
        console.log(`✉️ Real OTP email delivered via EmailJS HTTPS API to ${email}`);
        return { success: true, mode: 'emailjs-https' };
      }
      const errText = await ejsRes.text();
      console.warn('EmailJS returned error:', errText);
    } catch (err) {
      console.warn('EmailJS failed:', err.message);
    }
  }

  // 3. Support Resend HTTPS REST API (Port 443 - NEVER blocked by Render or Cloud firewalls)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'The Classic Cut Salon <onboarding@resend.dev>',
          to: [email],
          subject: `Your Verification Code: ${otp} - The Classic Cut Salon`,
          html: htmlContent,
        }),
      });
      if (resendRes.ok) {
        console.log(`✉️ Real OTP email delivered via Resend HTTPS API to ${email}`);
        return { success: true, mode: 'resend-https' };
      }
      const errText = await resendRes.text();
      console.warn('Resend HTTPS API returned error:', errText);
    } catch (err) {
      console.warn('Resend HTTPS API failed:', err.message);
    }
  }

  // 2. Support Brevo (Sendinblue) HTTPS REST API (Port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'The Classic Cut Salon', email: process.env.EMAIL_USER || 'noreply@classiccut.com' },
          to: [{ email }],
          subject: `Your Verification Code: ${otp} - The Classic Cut Salon`,
          htmlContent,
        }),
      });
      if (brevoRes.ok) {
        console.log(`✉️ Real OTP email delivered via Brevo HTTPS API to ${email}`);
        return { success: true, mode: 'brevo-https' };
      }
      const errText = await brevoRes.text();
      console.warn('Brevo HTTPS API returned error:', errText);
    } catch (err) {
      console.warn('Brevo HTTPS API failed:', err.message);
    }
  }

  // 3. Fallback to Nodemailer SMTP with fast 4.5s timeout (Works locally and in open networks)
  const smtpUser = process.env.EMAIL_USER;
  const smtpPass = process.env.EMAIL_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️ SMTP email credentials (EMAIL_USER / EMAIL_PASS) not configured in environment variables.');
    return { success: false, error: 'Email service credentials not configured in environment variables' };
  }

  try {
    const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const isGmail = smtpHost.includes('gmail') || smtpUser.includes('@gmail.com');

    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 4500,
            greetingTimeout: 4000,
            socketTimeout: 5000,
          }
        : {
            host: smtpHost,
            port: Number(process.env.EMAIL_PORT) || 465,
            secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 4500,
            greetingTimeout: 4000,
            socketTimeout: 5000,
          }
    );

    await transporter.sendMail({
      from: `"The Classic Cut Salon" <${smtpUser}>`,
      to: email,
      subject: `Your Verification Code: ${otp} - The Classic Cut Salon`,
      html: htmlContent,
    });
    console.log(`✉️ Real OTP email sent successfully via SMTP to ${email}`);
    return { success: true, mode: isGmail ? 'gmail-service' : 'smtp' };
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

