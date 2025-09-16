import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { handleServerError } from "../../utils/helpers";
export const googleCallback = (req: Request, res: Response) => {
  try {
    const googleUser = req.user;
    if (!googleUser)
      return res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`);
    const token = jwt.sign(googleUser, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    // ✅ Redirection avec token dans l'URL (hash ou query)
    res.redirect(
      `${process.env.CLIENT_URL}/auth/success?token=${encodeURIComponent(
        token
      )}`
    );
  } catch (err) {
    console.error(err);
    handleServerError(res, err);
  }
};
