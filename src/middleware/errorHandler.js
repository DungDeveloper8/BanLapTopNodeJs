function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const api = req.originalUrl.startsWith("/api/v1");
  const status = error.status || (error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(error);
  const message = status >= 500 ? "Lỗi máy chủ. Vui lòng thử lại." : status === 409 && error.code === 11000 ? "Dữ liệu đã tồn tại." : error.message;
  if (api) return res.status(status).json({ success: false, message, error: { code: error.code === 11000 ? "DUPLICATE" : error.code || "ERROR" } });
  return res.status(status).send(message);
}
module.exports = errorHandler;
