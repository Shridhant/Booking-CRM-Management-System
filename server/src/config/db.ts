import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === "production" || 
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1"));

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

db.connect()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err: Error) => {
    console.error("Database connection error", err);
  });

