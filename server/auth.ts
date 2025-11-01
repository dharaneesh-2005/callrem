import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { storage } from "./storage";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const APP_NAME = "FeeManager";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const generateTOTPSecret = (username: string) => {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${username})`,
    issuer: APP_NAME,
  });

  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!,
  };
};

export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  return await QRCode.toDataURL(otpauthUrl);
};

export const verifyTOTP = (token: string, secret: string): boolean => {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 4, // Increased window for clock drift tolerance
      step: 30, // 30 second time step (standard)
    });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateJWT = (user: { id: number; username: string }): string => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

export const verifyJWT = (token: string): { id: number; username: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
};

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  const user = await storage.getUser(decoded.id);
  if (!user || !user.isActive) {
    return res.status(403).json({ message: "User not found or inactive" });
  }

  req.user = { id: user.id, username: user.username };
  next();
};
