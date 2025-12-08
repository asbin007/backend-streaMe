import FormData from "form-data";
import Mailgun from "mailgun.js";
import config from './src/config/config';

async function sendSimpleMessage() {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: config.mailgun_api_key ? config.mailgun_api_key.trim() : "", 
  });

  try {
    const domain = config.mailgun_domain ? config.mailgun_domain.trim() : "";
    console.log("Sending to domain:", domain);
    
    // Using the user's exact structure
    const data = await mg.messages.create(domain, {
      from: `Mailgun Sandbox <postmaster@${domain}>`,
      to: ["asbin pokharel <asbinofficial@gmail.com>"],
      subject: "Hello asbin pokharel",
      text: "Congratulations asbin pokharel, you just sent an email with Mailgun! You are truly awesome!",
    });

    console.log("Success:", data); 
  } catch (error) {
    console.error("Error:", error); 
  }
}

sendSimpleMessage();
