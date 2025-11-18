import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient, User } from "@prisma/client";
import { UserTokenPayload } from "../types/type";
import passport from "passport";

const prisma = new PrismaClient();

interface GoogleAccountInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  googleId?: string;
  image?: string;
  isVerified?: boolean;
}

// Définissez manuellement le type Profile
interface GoogleProfile {
  id: string;
  displayName: string;
  name?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
  };
  emails?: Array<{
    value: string;
    verified: boolean;
  }>;
  photos?: Array<{
    value: string;
  }>;
  provider: string;
  _raw: string;
  _json: any;
}

console.log(
  "🎯 Client ID:",
  process.env.GOOGLE_CLIENT_ID ? "✓ Présent" : "✗ Manquant", process.env.GOOGLE_CLIENT_ID
);
console.log(
  "🎯 Client Secret:",
  process.env.GOOGLE_CLIENT_SECRET ? "✓ Présent" : "✗ Manquant", process.env.GOOGLE_CLIENT_SECRET
);
console.log(
  "🎯 Backend URL:",
  process.env.BACKEND_URL + "/api/auth/google/callback"
);
const getCallbackURL = () => {
  if (process.env.NODE_ENV === "development") {
    return process.env.LOCAL_URL + "/api/auth/google/callback";
  }
  return process.env.BACKEND_URL + "/api/auth/google/callback";
};

console.log("🔧 Using callback URL:", getCallbackURL());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: getCallbackURL(),
      scope:["profile","email"]
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: any
    ) => {
      try {
        console.log("Google profile:", profile);
        
        if (!profile.id || !profile.emails?.[0]?.value) {
          return done(
            new Error("Données de profil Google invalides"),
            undefined
          );
        }

        const email = profile.emails[0].value;
        const googleId = profile.id;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const image = profile.photos?.[0]?.value;
        const isVerified = profile.emails[0].verified;

        let existingUser = await prisma.user.findFirst({
          where: { OR: [{ email: email }, { googleId: googleId }] },
          select: { id: true, googleId: true, role: true },
        });

        if (existingUser) {
          if (existingUser.googleId && existingUser.googleId !== googleId) {
            return done(
              new Error("Ce compte Google est déjà lié à un autre utilisateur"),
              undefined
            );
          }

          const updateUser: GoogleAccountInfo = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(!existingUser?.googleId && { googleId }),
            ...(image && { image }),
            isVerified: isVerified,
          };

          existingUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: updateUser,
          });
        } else {
          existingUser = await prisma.user.create({
            data: {
              email: email,
              googleId: googleId,
              firstName: firstName || email.split("@")[0] || "Utilisateur",
              lastName: lastName || "",
              image: image || null,
              role: "USER",
              password: null,
            },
          });
        }

        const user: UserTokenPayload = {
          id: existingUser.id,
          email,
          role: existingUser.role,
        };
        
        done(null, user);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        done(error, undefined);
      }
    }
  )
);


export default passport;
