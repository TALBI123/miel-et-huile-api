import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { handleServerError } from "../../utils/helpers";
import { success } from "zod";

export const googleCallback = (req: Request, res: Response) => {
  try {
    const googleUser = req.user;
    if (!googleUser)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const token = jwt.sign(
      { userId: req.user?.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Renvoyer une page HTML qui envoie le token au parent
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              token: '${token}',
              message: 'Authentication successful'
            }, 'http://localhost:3000');
            window.close();
          </script>
          <p>Connexion réussie! Vous pouvez fermer cette fenêtre.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    handleServerError(res, err);
  }
};
