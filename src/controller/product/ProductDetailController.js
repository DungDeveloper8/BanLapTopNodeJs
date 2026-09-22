const Product = require("../../model/Product");

async function detail(req, res, next) {
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
        message: "Không tìm thấy sản phẩm.",
      };

      return res.redirect("/");
    }

    return res.render("product/detail", {
      title: product.name,
      product,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  detail,
};
