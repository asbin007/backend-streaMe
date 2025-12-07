import { Resend } from 'resend';
import config from '../config/config';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (options: MailOptions): Promise<boolean> => {
  try {
    const response = await resend.emails.send({
      from: "Stream Me <noreply@yourdomain.com>", // IMPORTANT
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Email sent:", response);
    return true;
  } catch (error) {
    console.error("Resend email error:", error);
    return false;
  }
};

export default sendMail;
