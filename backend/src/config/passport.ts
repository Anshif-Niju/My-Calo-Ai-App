import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.model";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {

          const email = profile.emails?.[0]?.value;
          user = await User.findOne({ email });

          if (user) {
            user.googleId = profile.id;
            user.profilePhoto = profile.photos?.[0]?.value;
            await user.save();
          } else {

            user = new User({
              name: profile.displayName,
              email: email,
              googleId: profile.id,
              isEmailVerified: true, 
              profilePhoto: profile.photos?.[0]?.value,
              onboardingCompleted: false,
            });
            await user.save();
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
