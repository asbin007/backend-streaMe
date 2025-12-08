import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { WatchHistory } from '../models/WatchHistory';
import sendMail from '../services/sendMail';
import checkOtpExpiration from '../services/otpExpiration';

export class UserController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        res.status(400).json({ message: "Fill all the fields" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters long" });
        return;
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        otp,
        otpGeneratedTime: Date.now().toString(),
        isVerified: false,
        role: 'user'
      });

      try {
        await sendMail({
          to: email,
          subject: "Registration OTP - VeloraTV",
          text: `Your registration OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 10px;">
              <h2 style="color: #6366f1;">Welcome to VeloraTV! 🎬</h2>
              <p>Hi ${username},</p>
              <p>Thank you for joining VeloraTV. Please complete your registration using the OTP below:</p>
              <div style="background-color: #1e293b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you didn't create this account, please ignore this email.</p>
              <p>Best regards,<br>VeloraTV Team</p>
            </div>
          `
        });
        
        res.status(201).json({
          message: "User registered successfully. Please check your email for OTP.",
          userId: newUser.id,
          email: newUser.email,
          requiresOtp: true,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(201).json({
          message: "User registered successfully but email failed. Please try logging in to resend OTP.",
          userId: newUser.id,
          email: newUser.email,
          requiresOtp: true,
          emailWarning: "Email delivery failed. Please check your spam folder or try logging in to resend OTP.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        res.status(400).json({ message: "Email and OTP are required" });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.otp !== otp) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      }

      if (!checkOtpExpiration(user.otpGeneratedTime, 600000)) { // 10 minutes
        res.status(403).json({ message: "OTP expired. Please request a new one." });
        return;
      }

      user.isVerified = true;
      user.otp = "";
      user.otpGeneratedTime = "";
      await user.save();

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.WT_SECRET_KEY as Secret,
        { expiresIn: process.env.JWT_EXPIRE_IN || '24h' } as any
      );

      res.status(200).json({
        message: "OTP verified successfully! You can now login.",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      user.otp = otp;
      user.otpGeneratedTime = Date.now().toString();
      await user.save();

      try {
        await sendMail({
          to: email,
          subject: "New Registration OTP - VeloraTV",
          text: `Your new registration OTP is: ${otp}. This OTP will expire in 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 10px;">
              <h2 style="color: #6366f1;">New OTP Request - VeloraTV</h2>
              <p>Hi ${user.username},</p>
              <p>Here's your new OTP:</p>
              <div style="background-color: #1e293b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
              </div>
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>Best regards,<br>VeloraTV Team</p>
            </div>
          `
        });

        res.status(200).json({ message: "New OTP sent to your email" });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        res.status(500).json({ message: "Failed to send OTP. Please try again." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Fill all the fields" });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      if (!user.isVerified) {
        res.status(403).json({
          message: "Please verify your email with OTP before logging in.",
          requiresOtp: true,
          email: user.email
        });
        return;
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.WT_SECRET_KEY as Secret,
        { expiresIn: process.env.JWT_EXPIRE_IN || '24h' } as any
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
        digits: true,
      });

      user.otp = otp;
      user.otpGeneratedTime = Date.now().toString();
      await user.save();

      await sendMail({
        to: email,
        subject: "Password Reset OTP - VeloraTV",
        text: `Your OTP for password reset is ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 20px; border-radius: 10px;">
            <h2 style="color: #6366f1;">Password Reset Request</h2>
            <p>Hi ${user.username},</p>
            <p>Use the OTP below to reset your password:</p>
            <div style="background-color: #1e293b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #6366f1; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      });

      res.status(200).json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;

      if (!email || !otp || !newPassword || !confirmPassword) {
        res.status(400).json({ message: "Fill all the fields" });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ message: "Passwords do not match" });
        return;
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.otp !== otp) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      }

      if (!checkOtpExpiration(user.otpGeneratedTime, 600000)) {
        res.status(403).json({ message: "OTP expired. Please request a new one." });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.otp = "";
      user.otpGeneratedTime = "";
      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Admin Management
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.findAll({
        attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt'],
      });
      res.status(200).json({ data: users });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      if (user.role === 'admin' || user.role === 'super_admin') {
        res.status(403).json({ message: "Cannot delete admin users" });
        return;
      }

      await user.destroy();
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }

  // History & Recents
  static async addToHistory(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId, mediaType, title, posterPath, progress, duration } = req.body;
      const userId = (req as any).user.id;

      if (!mediaId || !mediaType) {
        res.status(400).json({ message: "Media ID and Type are required" });
        return;
      }

      let history = await WatchHistory.findOne({
        where: { userId, mediaId, mediaType }
      });

      if (history) {
        history.progress = progress || history.progress;
        history.duration = duration || history.duration;
        history.lastWatchedAt = new Date();
        await history.save();
      } else {
        history = await WatchHistory.create({
          userId,
          mediaId,
          mediaType,
          title,
          posterPath,
          progress: progress || 0,
          duration: duration || 0,
          lastWatchedAt: new Date()
        });
      }

      res.status(200).json({ message: "History updated", data: history });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const history = await WatchHistory.findAll({
        where: { userId },
        order: [['lastWatchedAt', 'DESC']],
        limit: 50
      });
      res.status(200).json({ data: history });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }

  static async getRecents(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const recents = await WatchHistory.findAll({
        where: { userId },
        order: [['lastWatchedAt', 'DESC']],
        limit: 10
      });
      res.status(200).json({ data: recents });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
  static async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;
      
      const token = jwt.sign(
        { id: user.id, role: user.role, avatarUrl: user.avatarUrl },
        process.env.WT_SECRET_KEY as Secret,
        { expiresIn: process.env.JWT_EXPIRE_IN || '24h' } as any
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
}
