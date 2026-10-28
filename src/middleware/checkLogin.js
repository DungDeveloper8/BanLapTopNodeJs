const { database } = require("../config/database");

async function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    req.session.flash = { type: "warning", message: "Vui lòng đăng nhập để tiếp tục." };
    return res.redirect("/login");
  }
  try {
    const user = await database.collection("users").findOne({ id: Number(req.session.user.id) });
    if (!user) {
      delete req.session.user;
      req.session.flash = { type: "warning", message: "Phiên đăng nhập không hợp lệ." };
      return res.redirect("/login");
    }
    return next();
  } catch (error) { return next(error); }
}
module.exports = checkLogin;
