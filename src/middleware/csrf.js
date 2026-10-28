const { randomBytes, timingSafeEqual } = require("node:crypto");

function csrf(req, res, next) {
  if (req.originalUrl.startsWith("/api/v1")) return next();
  if (!req.session.csrfToken)
    req.session.csrfToken = randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const sent = String(req.body?._csrf || "");
  const expected = req.session.csrfToken;
  if (!/^[0-9a-f]{64}$/.test(sent))
    return res
      .status(403)
      .send("Phiên biểu mẫu không hợp lệ. Vui lòng tải lại trang.");
  const a = Buffer.from(sent, "hex");
  const b = Buffer.from(expected, "hex");
  if (!timingSafeEqual(a, b))
    return res
      .status(403)
      .send("Phiên biểu mẫu không hợp lệ. Vui lòng tải lại trang.");
  return next();
}
module.exports = csrf;
