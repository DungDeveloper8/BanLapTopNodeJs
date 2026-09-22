const Product = require("../../model/Product");

async function index(req, res, next) {
  try {
    const products = await Product.findAll();

    return res.render("home", {
      title: "Trang chủ",
      products,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
};
