import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import config from '../config/config';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: config.mailgun_api_key ? config.mailgun_api_key.trim() : '',
});

const sendMail = async (options: MailOptions): Promise<boolean> => {
  try {
    const domain = config.mailgun_domain ? config.mailgun_domain.trim() : '';
    
    const data = await mg.messages.create(domain, {
      from: `VeloraTV <postmaster@${domain}>`,
      to: [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Email sent:", data);
    return true;
  } catch (error) {
    console.error("Mailgun email error:", error);
    return false;
  }
};

export default sendMail;