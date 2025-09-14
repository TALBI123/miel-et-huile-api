import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserTokenPayload } from "../types/type";
import { PrismaClient, User } from "@prisma/client";
const prisma = new PrismaClient();
interface GoogleProfile {
  firstName: string;
  lastName: string;
  email: string;
  image: string;
  isVerified: boolean;
}
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Here you can create or find a user in your database
        if (!profile.id || !profile.emails?.[0]?.value) {
          return done(
            new Error("Données de profil Google invalides"),
            undefined
          );
        }
        const email = profile.emails[0].value;
        // Create a user object based on the Google profile
        console.log(profile);
        const createUser: GoogleProfile = {
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          email,
          image: profile.photos?.[0]?.value || "",
          isVerified: profile.emails?.[0]?.verified || false,
        };
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (existingUser) {
          await prisma.user.update({
            where: { email },
            data: { ...createUser },
          });
        } else {
          await prisma.user.create({
            data: { ...createUser, role: "USER", password: null },
          });
        }
        // Simulate user retrieval/creation
        const user: UserTokenPayload = {
          id: profile.id,
          email,
          role: "USER",
        };
        done(null, user as UserTokenPayload);
      } catch (error) {
        done(error);
      }
    }
  )
);
