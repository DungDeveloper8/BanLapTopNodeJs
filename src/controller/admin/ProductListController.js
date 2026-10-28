const Product = require("../../model/Product");

async function index(req, res, next) {
  try {
    const products = await Product.findAll({ includeInactive: true });

    return res.render("admin/products", {
      layout: "admin",
      title: "Quản lý sản phẩm",
      products,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
};
