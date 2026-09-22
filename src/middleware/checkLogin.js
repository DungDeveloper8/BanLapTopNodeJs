function checkLogin(req, res, next) {
  if (req.session.user) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  req.session.flash = {
    type: "warning",
    message: "Vui lòng đăng nhập để tiếp tục.",
  };

  return res.redirect("/login");
}

module.exports = checkLogin;
