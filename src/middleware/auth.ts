import { eq } from "drizzle-orm";
import { UUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../db/schema";

export interface AuthRequest extends Request {
  user?: UUID;
  token?: string;
}
export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    //get the header
    const token = req.header("x-auth-token");
    if (!token) {
      res.status(401).json({ msg: "No auth token. Access denied!" });
      return;
    }

    //verify if the token is valid
    const verified = jwt.verify(token, "passwordKey");
    if (!verified) {
      res.status(401).json({ msg: "Token verification failed!" });
      return;
    }

    //get the user data if the token is valid
    const verifiedToken = verified as { id: UUID };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, verifiedToken.id));

    if (!user) {
      res.status(401).json({ msg: "User not found!" });
      return;
    }
    req.user = verifiedToken.id;
    req.token = token;

    next();
    //if no user, return false
  } catch (error) {
    res.status(500).json(false);
  }
};
