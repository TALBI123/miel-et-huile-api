"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("@prisma/client");
const passport_1 = __importDefault(require("passport"));
const prisma = new client_1.PrismaClient();
console.log("🎯 Client ID:", process.env.GOOGLE_CLIENT_ID ? "✓ Présent" : "✗ Manquant", process.env.GOOGLE_CLIENT_ID);
console.log("🎯 Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "✓ Présent" : "✗ Manquant", process.env.GOOGLE_CLIENT_SECRET);
console.log("🎯 Backend URL:", process.env.BACKEND_URL + "/api/auth/google/callback");
const getCallbackURL = () => {
    if (process.env.NODE_ENV === "development") {
        return process.env.LOCAL_URL + "/api/auth/google/callback";
    }
    return process.env.BACKEND_URL + "/api/auth/google/callback";
};
console.log("🔧 Using callback URL:", getCallbackURL());
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackURL(),
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Google profile:", profile);
        // Here you can create or find a user in your database
        if (!profile.id || !profile.emails?.[0]?.value) {
            return done(new Error("Données de profil Google invalides"), undefined);
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
            select: { id: true, googleId: true, role: true },
        });
        //🚨 2. GESTION DES CONFLITS
        if (existingUser) {
            // Cas 2: Utilisateur trouvé par email mais googleId différent
            if (existingUser.googleId && existingUser.googleId !== googleId)
                return done(new Error("Ce compte Google est déjà lié à un autre utilisateur"), undefined);
            const updateUser = {
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
        }
        else {
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
        const user = {
            id: existingUser.id,
            email,
            role: existingUser.role,
        };
        done(null, user);
    }
    catch (error) {
        console.error(error);
        done(error);
    }
}));
//# sourceMappingURL=passport.js.map