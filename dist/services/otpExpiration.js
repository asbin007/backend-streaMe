"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkOtpExpiration = (otpGeneratedTime, expirationTime) => {
    try {
        const generatedTime = parseInt(otpGeneratedTime);
        const currentTime = Date.now();
        if (currentTime - generatedTime > expirationTime) {
            return false; // OTP expired
        }
        return true; // OTP valid
    }
    catch (error) {
        return false;
    }
};
exports.default = checkOtpExpiration;
