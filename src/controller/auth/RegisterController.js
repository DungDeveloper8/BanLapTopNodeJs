const User = require("../../model/User");

function show(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }
  return res.render("auth/register", { title: "Đăng ký" });
}

async function register(req, res, next) {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirm_password || "");
  const form = { username, email };

  const renderError = (status, error) =>
    res.status(status).render("auth/register", {
      title: "Đăng ký",
      error,
      form,
    });

  try {
    if (!username || !email || !password || !confirmPassword) {
      return renderError(400, "Vui lòng nhập đầy đủ thông tin.");
    }
    if (username.length < 3 || username.length > 50) {
      return renderError(400, "Tên đăng nhập phải dài từ 3 đến 50 ký tự.");
    }
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return renderError(400, "Email không hợp lệ.");
    }
    if (password.length < 8 || password.length > 128) {
      return renderError(400, "Mật khẩu phải dài từ 8 đến 128 ký tự.");
    }
    if (password !== confirmPassword) {
      return renderError(400, "Mật khẩu xác nhận không khớp.");
    }
    if (await User.findByEmail(email)) {
      return renderError(409, "Email đã được sử dụng.");
    }
    if (await User.findByUsername(username)) {
      return renderError(409, "Tên đăng nhập đã tồn tại.");
    }

    const id = await User.create(username, email, password);
    const cart = Array.isArray(req.session.cart) ? req.session.cart : [];
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
    req.session.cart = cart;
    req.session.user = { id, username, email, is_admin: false };
    await new Promise((resolve, reject) => {
      req.session.save((error) => (error ? reject(error) : resolve()));
    });
    return res.redirect("/");
  } catch (error) {
    if (error?.code === 11000) {
      return renderError(409, "Email hoặc tên đăng nhập đã tồn tại.");
    }
    return next(error);
  }
}

module.exports = { show, register };
