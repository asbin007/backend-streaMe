
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
  console.log('Testing email configuration...');
  console.log('User:', process.env.EMAIL);
  // Don't log the password, just check if it exists
  console.log('Password exists:', !!process.env.PASSWORD);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.EMAIL, // Send to self
      subject: "Test Email from VeloraTV Debugger",
      text: "If you receive this, your email configuration is working correctly!",
    });
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

testEmail();
