"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const connectToDatabase = async () => {
    try {
        console.log(process.env.DATABASE_URL);
        await prisma.$connect();
        console.log("Connected to database");
    }
    catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};
exports.connectToDatabase = connectToDatabase;
exports.default = prisma;
