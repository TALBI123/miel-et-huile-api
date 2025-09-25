import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserTokenPayload } from "../types/type";
import { PrismaClient, User } from "@prisma/client";
const prisma = new PrismaClient();
interface GoogleAccountInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  googleId?: string;
  image?: string;
  isVerified?: boolean;
}
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Présent' : '✗ Manquant');
console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Présent' : '✗ Manquant');
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.NODE_ENV !== "development"
          ? process.env.LOCAL_URL! + "/api/auth/google/callback"
          : process.env.BACKEND_URL! + "/api/auth/google/callback",
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
        const googleId = profile.id;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const image = profile.photos?.[0]?.value;
        const isVerified = profile.emails[0].verified;
        // Create a user object based on the Google profile
        let existingUser = await prisma.user.findFirst({
          where: { OR: [{ email: email }, { googleId: googleId }] },
          select: { id: true, googleId: true },
        });
        //🚨 2. GESTION DES CONFLITS
        if (existingUser) {
          // Cas 2: Utilisateur trouvé par email mais googleId différent

          if (existingUser.googleId && existingUser.googleId !== googleId)
            return done(
              new Error("Ce compte Google est déjà lié à un autre utilisateur"),
              undefined
            );
          const updateUser: GoogleAccountInfo = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(!existingUser?.googleId && { googleId }),
            ...(image && { image }),
            isVerified: isVerified,
          };
          // Cas 2: Utilisateur trouvé par email mais googleId différent
          existingUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: updateUser,
          });
        } else {
          // Cas 4: Nouvel utilisateur → CRÉATION
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
        // Simulate user retrieval/creation
        const user: UserTokenPayload = {
          id: existingUser.id,
          email,
          role: "USER",
        };
        done(null, user as UserTokenPayload);
      } catch (error) {
        console.error(error);
        done(error);
      }
    }
  )
);
