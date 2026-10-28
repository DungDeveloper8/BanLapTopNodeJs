const jwt = require("jsonwebtoken");
const { createHmac } = require("node:crypto");
const { database } = require("../config/database");
const { BusinessError } = require("../service/OrderService");

const sessionSecret = process.env.SESSION_SECRET;
const configuredJwtSecret = process.env.JWT_SECRET;
const secretSource = configuredJwtSecret || sessionSecret;

if (!secretSource || secretSource.length < 32) {
  throw new Error("JWT_SECRET hoặc SESSION_SECRET phải có ít nhất 32 ký tự.");
}

const jwtSecret = configuredJwtSecret || createHmac("sha256", secretSource)
  .update("bk-mobile-jwt-v1")
  .digest("hex");

function asyncHandler(handler) {
  return (req, res, next) => {
    return Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function sendSuccess(res, data, status = 200, message = "Thành công") {
  return res.status(status).json({ success: true, message, data });
}

function throwApiError(status, message, code = "BAD_REQUEST") {
  throw new BusinessError(status, message, code);
}

function isValidId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function createToken(user) {
  const payload = {
    sub: String(user.id),
    role: user.is_admin ? "admin" : "customer",
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: "2h",
    algorithm: "HS256",
  });
}

const protect = asyncHandler(async (req, res, next) => {
  const authorization = String(req.headers.authorization || "");
  const parts = authorization.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throwApiError(401, "Thiếu JWT hợp lệ.", "UNAUTHENTICATED");
  }

  let payload;

  try {
    payload = jwt.verify(parts[1], jwtSecret, {
      algorithms: ["HS256"],
    });
  } catch (_) {
    throwApiError(401, "JWT đã hết hạn hoặc không hợp lệ.", "INVALID_TOKEN");
  }

  if (!isValidId(payload.sub)) {
    throwApiError(401, "JWT không hợp lệ.", "INVALID_TOKEN");
  }

  const user = await database.collection("users").findOne({
    id: Number(payload.sub),
  });

  if (!user) {
    throwApiError(401, "Tài khoản không tồn tại.", "UNAUTHENTICATED");
  }

  req.apiUser = {
    id: user.id,
    is_admin: Boolean(user.is_admin),
    username: user.username,
    email: user.email,
  };

  return next();
});

function authorize(...roles) {
  return (req, res, next) => {
    const role = req.apiUser?.is_admin ? "admin" : "customer";

    if (!req.apiUser || !roles.includes(role)) {
      return next(new BusinessError(403, "Không có quyền thực hiện.", "FORBIDDEN"));
    }

    return next();
  };
}

function checkCartOwner(req, res, next) {
  if (
    req.session.apiCartOwner !== undefined &&
    req.session.apiCartOwner !== req.apiUser.id
  ) {
    req.session.cart = [];
  }

  req.session.apiCartOwner = req.apiUser.id;
  return next();
}

module.exports = {
  asyncHandler,
  sendSuccess,
  throwApiError,
  isValidId,
  createToken,
  protect,
  authorize,
  checkCartOwner,
};
