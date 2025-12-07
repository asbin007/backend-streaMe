import { Resend } from 'resend';
import config from '../config/config';

const resend = new Resend(config.resend_api_key as string);

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const sendMail = async (options: MailOptions): Promise<boolean> => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'stream me <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error sending email:', error);
    return false;
  }
};

export default sendMail;
