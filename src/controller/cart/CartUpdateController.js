const CartSession = require("../../model/CartSession");
const Product = require("../../model/Product");

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const quantity = Number(req.body.quantity);
    if (!Number.isSafeInteger(id) || id < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1) {
      req.session.flash = { type: "warning", message: "Sản phẩm hoặc số lượng không hợp lệ." };
      return res.redirect("/cart");
    }

    const product = await Product.findById(id);
    if (!product) {
      CartSession.remove(req, id);
      req.session.flash = { type: "warning", message: "Sản phẩm không còn được bán." };
      return res.redirect("/cart");
    }

    if (!Number.isSafeInteger(product.stock) || quantity > product.stock) {
      req.session.flash = { type: "warning", message: "Số lượng vượt quá tồn kho." };
      return res.redirect("/cart");
    }

    CartSession.update(req, id, quantity);
    return res.redirect("/cart");
  } catch (error) {
    return next(error);
  }
}

module.exports = { update };
