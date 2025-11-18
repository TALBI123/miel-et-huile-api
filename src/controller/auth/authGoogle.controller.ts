import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { handleServerError } from "../../utils/helpers";
const getCallbackURL = () => {
  return process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_LOCAL_URL
    : process.env.FRONTEND_PROD_URL;
};
export const googleCallback = (req: Request, res: Response) => {
  try {
    const googleUser = req.user;
    console.log("Google User:", googleUser);
    console.log("Callback function called :");
    console.log("User from Google:");
    if (!googleUser) return res.redirect(`${process.env.FRONTEND_URL}`);
    const token = jwt.sign(googleUser, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });
    console.log(googleUser, token);
    // Configeration du cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    // ✅ Redirection avec token dans l'URL (hash ou query)
    res.redirect(`${getCallbackURL()}`);
  } catch (err) {
    console.error(err);
    handleServerError(res, err);
  }
};
