const checkOtpExpiration = (otpGeneratedTime: string, expirationTime: number): boolean => {
  try {
    const generatedTime = parseInt(otpGeneratedTime);
    const currentTime = Date.now();
    
    if (currentTime - generatedTime > expirationTime) {
      return false; // OTP expired
    }
    
    return true; // OTP valid
  } catch (error) {
    return false;
  }
};

export default checkOtpExpiration;
