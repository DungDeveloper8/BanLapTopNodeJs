const CartSession = require("../../model/CartSession");
const Product = require("../../model/Product");

async function add(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không hợp lệ.",
      };

      return res.redirect("/");
    }

    const product = await Product.findById(id);

    if (!product) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không tồn tại.",
      };

      return res.redirect("/");
    }

    CartSession.add(req, id);

    req.session.flash = {
      type: "success",
      message: "Đã thêm sản phẩm vào giỏ hàng.",
    };

    return res.redirect("/cart");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  add,
};
