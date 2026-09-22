const CartSession = require("../../model/CartSession");
const Product = require("../../model/Product");

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(id) || id < 1) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không hợp lệ.",
      };

      return res.redirect("/cart");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      req.session.flash = {
        type: "warning",
        message: "Số lượng không hợp lệ.",
      };

      return res.redirect("/cart");
    }

    const product = await Product.findById(id);

    if (!product) {
      CartSession.remove(req, id);

      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không còn tồn tại.",
      };

      return res.redirect("/cart");
    }

    CartSession.update(req, id, quantity);

    return res.redirect("/cart");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  update,
};
