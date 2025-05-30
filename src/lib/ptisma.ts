import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const connectToDatabase = async () => {
  try {
    console.log(process.env.DATABASE_URL);
    await prisma.$connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

export default prisma;
