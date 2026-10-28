const CartSession = require("../../model/CartSession");
const Product = require("../../model/Product");

async function add(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      req.session.flash = { type: "warning", message: "Sản phẩm không hợp lệ." };
      return res.redirect("/");
    }

    const product = await Product.findById(id);
    if (!product) {
      req.session.flash = { type: "warning", message: "Sản phẩm không tồn tại hoặc đã ngừng bán." };
      return res.redirect("/");
    }

    const current = CartSession.get(req).find((item) => item.product_id === id);
    if (!Number.isSafeInteger(product.stock) ||
        (current?.quantity || 0) >= product.stock) {
      req.session.flash = { type: "warning", message: "Không đủ tồn kho để thêm sản phẩm." };
      return res.redirect("/cart");
    }

    CartSession.add(req, id);
    req.session.flash = { type: "success", message: "Đã thêm sản phẩm vào giỏ hàng." };
    return res.redirect("/cart");
  } catch (error) {
    return next(error);
  }
}

module.exports = { add };
