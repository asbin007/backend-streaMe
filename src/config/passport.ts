import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import config from './config';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id || '',
      clientSecret: config.google_client_secret || '',
      callbackURL: `${config.base_url}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        const googleId = profile.id;
        const username = profile.displayName;

        if (!email) {
          return done(new Error('No email found from Google'), undefined);
        }

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (user) {
            // Link googleId if not present
            if (!user.googleId) {
                user.googleId = googleId;
            }
            // Update avatar if not present or changed
            if (profile.photos?.[0]?.value) {
                user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
        } else {
          // Create new user
          user = await User.create({
              username,
              email,
              googleId,
              avatarUrl: profile.photos?.[0]?.value,
              isVerified: true, // OAuth emails are verified
              password: '', // No password for OAuth users
              otp: '',
              otpGeneratedTime: ''
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

export default passport;
