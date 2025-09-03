import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
interface VerifyEmailQuery {
  token: string;
}
export const verifyEmail = async (
  req: Request<{}, {}, {}, VerifyEmailQuery>,
  res: Response
) => {
  const token = req.query.token;
  
  try {
  } catch (err) {}
};
