import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import multer from "multer";

const prisma = new PrismaClient();
const router = express.Router();

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads/"),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// загрузка файла
router.post(
  "/file/upload",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const userId = req.userId!;

    const newFile = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        fileName: file.filename,
        extension: path.extname(file.originalname).slice(1),
        mime: file.mimetype,
        size: file.size,
      },
    });

    res.json(newFile);
  }
);

// список файлов (с пагинацией)
router.get(
  "/file/list",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const listSize = parseInt((req.query.list_size as string) || "10");
    const page = parseInt((req.query.page as string) || "1");
    if (Number.isNaN(listSize) || Number.isNaN(page)) {
      res.status(400).json({
        error: "listSize and page must be a numbers",
      });
      return;
    }

    const skip = (page - 1) * listSize;
    const files = await prisma.file.findMany({
      where: { userId },
      skip,
      take: listSize,
      orderBy: { uploadDate: "desc" },
    });

    res.json(files);
  }
);

router.delete(
  "/file/delete/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const fileId = parseInt(req.params.id);

    if (Number.isNaN(fileId)) {
      res.status(400).json({
        error: "fileId must be a number",
      });
      return;
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    fs.unlinkSync(path.join("uploads", file.fileName));

    await prisma.file.delete({ where: { id: fileId } });

    res.json({ message: "File deleted" });
  }
);

router.get(
  "/file/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const fileId = parseInt(req.params.id);

    if (Number.isNaN(fileId)) {
      res.status(400).json({
        error: "fileId must be a number",
      });
      return;
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.json(file);
  }
);

router.get(
  "/file/download/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const fileId = parseInt(req.params.id);

    if (Number.isNaN(fileId)) {
      res.status(400).json({
        error: "fileId must be a number",
      });
      return;
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.userId !== userId) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    res.download(path.join("uploads", file.fileName), file.originalName);
  }
);

router.put(
  "/file/update/:id",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const fileId = parseInt(req.params.id);

    if (Number.isNaN(fileId)) {
      res.status(400).json({
        error: "fileId must be a number",
      });
      return;
    }

    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!existingFile || existingFile.userId !== userId) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    fs.unlinkSync(path.join("uploads", existingFile.fileName));

    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const ext = path.extname(file.originalname).slice(1);

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        originalName: file.originalname,
        fileName: file.filename,
        extension: ext,
        mime: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
      },
    });

    res.json(updatedFile);
  }
);

export default router;

// 3 добавить gitignore, залить на гит, и отправить ссылку
