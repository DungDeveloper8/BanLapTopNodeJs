function checkAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;

    return res.redirect("/login");
  }

  if (!req.session.user.is_admin) {
    req.session.flash = {
      type: "warning",
      message: "Bạn không có quyền truy cập trang quản trị.",
    };

    return res.redirect("/");
  }

  return next();
}

module.exports = checkAdmin;
