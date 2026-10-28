const Product = require("../../model/Product");
const ProductReview = require("../../model/ProductReview");

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

    const reviews = await ProductReview.findByProductId(product.id);
    const ratingAverage = reviews.length
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : null;

    return res.render("product/detail", {
      title: product.name,
      product,
      reviews,
      ratingAverage,
      ratingCount: reviews.length,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  detail,
};
