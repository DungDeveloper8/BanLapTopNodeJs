const { database } = require("../config/database");

async function checkAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/login");
  }
  try {
    const user = await database.collection("users").findOne({ id: Number(req.session.user.id) });
    if (!user || !user.is_admin) {
      req.session.flash = { type: "warning", message: "Bạn không có quyền truy cập trang quản trị." };
      return res.redirect("/");
    }
    return next();
  } catch (error) { return next(error); }
}
module.exports = checkAdmin;
