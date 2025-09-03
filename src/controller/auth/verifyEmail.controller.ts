import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
interface VerifyEmailQuery {
  token: string;
}
const verifyEmail = async (
  req: Request<{}, {}, {}, VerifyEmailQuery>,
  res: Response
) => {
  const token = req.query.token;
  if (!token) res.status(StatusCodes.NOT_FOUND).json("Not Founde");
  
  try {
  } catch (err) {}
};
