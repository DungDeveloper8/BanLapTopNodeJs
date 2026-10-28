const fs = require("node:fs");
const path = require("node:path");

const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const express = require("express");
const { connectDatabase } = require("./config/database");
const configureHandlebars = require("./config/handlebars");
const sessionMiddleware = require("./config/session");
const shareViewData = require("./middleware/shareViewData");
const csrf = require("./middleware/csrf");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const route = require("./router");

const app = express();
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT phai la so nguyen tu 1 den 65535.");
}

configureHandlebars(app);

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use("/api/v1", express.json({ limit: "100kb" }));
app.use("/api/v1", (req, res, next) => {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== "object") req.body = {};
  next();
});
app.use(sessionMiddleware);
app.use(csrf);
app.use(shareViewData);

route(app);

app.use(notFound);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server đang chạy tại cổng ${port}`);
    });
  })
  .catch((error) => {
    console.error("Không thể khởi động ứng dụng:", error.message);
    process.exitCode = 1;
  });
