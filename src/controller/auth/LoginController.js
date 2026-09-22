const User = require("../../model/User");

function show(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }

  return res.render("auth/login", {
    title: "Đăng nhập",
  });
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).render("auth/login", {
        title: "Đăng nhập",
        error: "Vui lòng nhập email và mật khẩu.",
        email,
      });
    }

    const user = await User.findByEmail(email);

    if (!user || String(user.password) !== password) {
      return res.status(401).render("auth/login", {
        title: "Đăng nhập",
        error: "Email hoặc mật khẩu không đúng.",
        email,
      });
    }

    req.session.user = {
      id: Number(user.id),
      username: user.username,
      email: user.email,
      is_admin: Boolean(user.is_admin),
    };

    const returnTo = req.session.returnTo || "/";

    delete req.session.returnTo;

    return res.redirect(returnTo);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  show,
  login,
};
