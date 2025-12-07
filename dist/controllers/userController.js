"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const User_1 = require("../models/User");
const WatchHistory_1 = require("../models/WatchHistory");
const sendMail_1 = __importDefault(require("../services/sendMail"));
const otpExpiration_1 = __importDefault(require("../services/otpExpiration"));
class UserController {
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const existingUser = yield User_1.User.findOne({ where: { email } });
                if (existingUser) {
                    res.status(400).json({ message: "User already exists" });
                    return;
                }
                const otp = otp_generator_1.default.generate(6, {
                    lowerCaseAlphabets: false,
                    upperCaseAlphabets: false,
                    specialChars: false,
                    digits: true,
                });
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const newUser = yield User_1.User.create({
                    username,
                    email,
                    password: hashedPassword,
                    otp,
                    otpGeneratedTime: Date.now().toString(),
                    isVerified: false,
                    role: 'user'
                });
                try {
                    yield (0, sendMail_1.default)({
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
                }
                catch (emailError) {
                    console.error("Email sending failed:", emailError);
                    res.status(201).json({
                        message: "User registered successfully but email failed. Please try logging in to resend OTP.",
                        userId: newUser.id,
                        email: newUser.email,
                        requiresOtp: true,
                        emailWarning: "Email delivery failed. Please check your spam folder or try logging in to resend OTP.",
                    });
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static verifyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, otp } = req.body;
                if (!email || !otp) {
                    res.status(400).json({ message: "Email and OTP are required" });
                    return;
                }
                const user = yield User_1.User.findOne({ where: { email } });
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                if (user.otp !== otp) {
                    res.status(400).json({ message: "Invalid OTP" });
                    return;
                }
                if (!(0, otpExpiration_1.default)(user.otpGeneratedTime, 600000)) { // 10 minutes
                    res.status(403).json({ message: "OTP expired. Please request a new one." });
                    return;
                }
                user.isVerified = true;
                user.otp = "";
                user.otpGeneratedTime = "";
                yield user.save();
                const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.WT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE_IN || '24h' });
                res.status(200).json({
                    message: "OTP verified successfully! You can now login.",
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        isVerified: user.isVerified,
                    },
                });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(400).json({ message: "Email is required" });
                    return;
                }
                const user = yield User_1.User.findOne({ where: { email } });
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                const otp = otp_generator_1.default.generate(6, {
                    lowerCaseAlphabets: false,
                    upperCaseAlphabets: false,
                    specialChars: false,
                    digits: true,
                });
                user.otp = otp;
                user.otpGeneratedTime = Date.now().toString();
                yield user.save();
                try {
                    yield (0, sendMail_1.default)({
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
                }
                catch (emailError) {
                    console.error("Email sending failed:", emailError);
                    res.status(500).json({ message: "Failed to send OTP. Please try again." });
                }
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    res.status(400).json({ message: "Fill all the fields" });
                    return;
                }
                const user = yield User_1.User.findOne({ where: { email } });
                if (!user) {
                    res.status(400).json({ message: "Invalid credentials" });
                    return;
                }
                const isMatch = yield bcrypt_1.default.compare(password, user.password);
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
                const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.WT_SECRET_KEY, { expiresIn: process.env.JWT_EXPIRE_IN || '24h' });
                res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                    },
                });
            }
            catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ message: 'Server error' });
            }
        });
    }
    static forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(400).json({ message: "Email is required" });
                    return;
                }
                const user = yield User_1.User.findOne({ where: { email } });
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                const otp = otp_generator_1.default.generate(6, {
                    lowerCaseAlphabets: false,
                    upperCaseAlphabets: false,
                    specialChars: false,
                    digits: true,
                });
                user.otp = otp;
                user.otpGeneratedTime = Date.now().toString();
                yield user.save();
                yield (0, sendMail_1.default)({
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
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    static resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const user = yield User_1.User.findOne({ where: { email } });
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                if (user.otp !== otp) {
                    res.status(400).json({ message: "Invalid OTP" });
                    return;
                }
                if (!(0, otpExpiration_1.default)(user.otpGeneratedTime, 600000)) {
                    res.status(403).json({ message: "OTP expired. Please request a new one." });
                    return;
                }
                user.password = yield bcrypt_1.default.hash(newPassword, 10);
                user.otp = "";
                user.otpGeneratedTime = "";
                yield user.save();
                res.status(200).json({ message: "Password updated successfully" });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    // Admin Management
    static getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield User_1.User.findAll({
                    attributes: ['id', 'username', 'email', 'role', 'isVerified', 'createdAt'],
                });
                res.status(200).json({ data: users });
            }
            catch (error) {
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    static deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = yield User_1.User.findByPk(id);
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                if (user.role === 'admin' || user.role === 'super_admin') {
                    res.status(403).json({ message: "Cannot delete admin users" });
                    return;
                }
                yield user.destroy();
                res.status(200).json({ message: "User deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    // History & Recents
    static addToHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaId, mediaType, title, posterPath, progress, duration } = req.body;
                const userId = req.user.id;
                if (!mediaId || !mediaType) {
                    res.status(400).json({ message: "Media ID and Type are required" });
                    return;
                }
                let history = yield WatchHistory_1.WatchHistory.findOne({
                    where: { userId, mediaId, mediaType }
                });
                if (history) {
                    history.progress = progress || history.progress;
                    history.duration = duration || history.duration;
                    history.lastWatchedAt = new Date();
                    yield history.save();
                }
                else {
                    history = yield WatchHistory_1.WatchHistory.create({
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
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    static getHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const history = yield WatchHistory_1.WatchHistory.findAll({
                    where: { userId },
                    order: [['lastWatchedAt', 'DESC']],
                    limit: 50
                });
                res.status(200).json({ data: history });
            }
            catch (error) {
                res.status(500).json({ message: "Server error" });
            }
        });
    }
    static getRecents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const recents = yield WatchHistory_1.WatchHistory.findAll({
                    where: { userId },
                    order: [['lastWatchedAt', 'DESC']],
                    limit: 10
                });
                res.status(200).json({ data: recents });
            }
            catch (error) {
                res.status(500).json({ message: "Server error" });
            }
        });
    }
}
exports.UserController = UserController;
