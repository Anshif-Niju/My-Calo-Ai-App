import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../config/env";
import { User } from "../models/User.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const profilePhoto = profile.photos?.[0]?.value;

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email, isEmailVerified: true });
        if (user) {
          user.googleId = profile.id;
          if (!user.profilePhoto) user.profilePhoto = profilePhoto;
          await user.save();
          return done(null, user);
        }

        user = new User({
          name: profile.displayName,
          email,
          googleId: profile.id,
          isEmailVerified: true,
          profilePhoto,
          role: "user",
          onboardingCompleted: false,
        });
        await user.save();

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    },
  ),
);
