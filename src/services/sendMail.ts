import nodemailer from 'nodemailer';
import config from '../config/config';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const sendMail = async (options: MailOptions): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: config.email,
        pass: config.password,
      },
    });

    const info = await transporter.sendMail({
      from: `"stream me " <${config.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email with Nodemailer:', error);
    return false;
  }
};

export default sendMail;
