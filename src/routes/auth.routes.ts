import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { idSchema } from "../validators/id.validator";

export const refreshTokensStore = new Map<string, string[]>();

const prisma = new PrismaClient();
const router = express.Router();

// регистрация
router.post("/signup", async (req: Request, res: Response) => {
  const { id, password } = req.body;

  if (!id || !password) {
    res.status(400).json({ message: "Id and password required" });
    return;
  }

  const { error } = idSchema.validate(id);
  if (error) {
    res.status(400).json({
      error: "ID must be a valid email or phone number",
    });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (existing) {
    res.status(409).json({ message: "User already exists" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { id, password: hash } });

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  const accessToken = jwt.sign({ userId: id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET);

  const refreshTokens = [refreshToken];
  refreshTokensStore.set(id, refreshTokens);

  res.json({ accessToken, refreshToken });
});

// вход
router.post("/signin", async (req: Request, res: Response) => {
  const { id, password } = req.body;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  const accessToken = jwt.sign({ userId: id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });
  const refreshToken = jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET);

  const refreshTokens = refreshTokensStore.get(id) || [];

  refreshTokensStore.set(id, [...refreshTokens, refreshToken]);

  res.json({ accessToken, refreshToken });
});

// обновление access токена по refresh
router.post("/signin/new_token", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token required" });
    return;
  }

  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  try {
    const { userId } = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: string };

    const storedRefreshs = refreshTokensStore.get(userId);

    if (!storedRefreshs?.includes(refreshToken))
      throw new Error("Invalid token");

    const newAccess = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "10m",
    });

    res.json({ accessToken: newAccess });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
});

// ID текущего пользователя
router.get("/info", authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ id: req.userId });
});

// выход (отзыв текущего refresh-токена)
router.get("/logout", authMiddleware, (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ message: "Refresh token required" });
    return;
  }

  const userId = req.userId!;

  const refreshTokens = refreshTokensStore.get(userId);
  const refreshTokensWithoutCurrent =
    refreshTokens?.filter((value) => value !== refreshToken) || [];

  refreshTokensStore.set(userId, refreshTokensWithoutCurrent);

  console.log(refreshTokensStore);

  res.json({ message: "Logged out" });
});

export default router;
