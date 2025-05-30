import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import fileRoutes from "./routes/file.routes";
import { connectToDatabase } from "./lib/ptisma";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/", authRoutes);
app.use("/", fileRoutes);

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
  });
