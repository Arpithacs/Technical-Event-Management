import sql from "mssql";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "EventManagement",
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 60000,
  connectionTimeout: 30000,
};

// Use SQL auth only if user/password are provided
if (process.env.DB_USER) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
} else {
  // Windows Authentication (trusted connection)
  config.authentication = {
    type: "ntlm",
    options: { domain: "" },
  };
  config.user = "";
  config.password = "";
  config.options.trustedConnection = true;
}

const pool = new sql.ConnectionPool(config);

pool
  .connect()
  .then(() => {
    console.log("Connected to SQL Server database:", config.database);
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

export { sql };
export default pool;
