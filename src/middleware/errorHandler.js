function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  return res.status(500).send("Có lỗi xảy ra. Vui lòng thử lại.");
}

module.exports = errorHandler;
