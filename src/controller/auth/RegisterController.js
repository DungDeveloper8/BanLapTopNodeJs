const User = require("../../model/User");

function show(req, res) {
  if (req.session.user) {
    return res.redirect("/");
  }

  return res.render("auth/register", {
    title: "Đăng ký",
  });
}

async function register(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirm_password || "");
    const form = {
      username,
      email,
    };

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).render("auth/register", {
        title: "Đăng ký",
        error: "Vui lòng nhập đầy đủ thông tin.",
        form,
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).render("auth/register", {
        title: "Đăng ký",
        error: "Email không hợp lệ.",
        form,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("auth/register", {
        title: "Đăng ký",
        error: "Mật khẩu xác nhận không khớp.",
        form,
      });
    }

    const userByEmail = await User.findByEmail(email);

    if (userByEmail) {
      return res.status(409).render("auth/register", {
        title: "Đăng ký",
        error: "Email đã được sử dụng.",
        form,
      });
    }

    const userByUsername = await User.findByUsername(username);

    if (userByUsername) {
      return res.status(409).render("auth/register", {
        title: "Đăng ký",
        error: "Tên đăng nhập đã tồn tại.",
        form,
      });
    }

    const id = await User.create(username, email, password);

    req.session.user = {
      id,
      username,
      email,
      is_admin: false,
    };

    return res.redirect("/");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  show,
  register,
};
