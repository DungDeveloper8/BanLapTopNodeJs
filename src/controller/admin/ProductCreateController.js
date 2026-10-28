const Product = require("../../model/Product");

function show(req, res) {
  return res.render("admin/productCreate", {
    layout: "admin",
    title: "Thêm sản phẩm",
    form: { stock: 0, category: "Điện thoại", isPhone: true },
  });
}

async function create(req, res, next) {
  try {
    const { product, error } = Product.parseForm(req.body);
    if (error) {
      return res.status(400).render("admin/productCreate", {
        layout: "admin",
        title: "Thêm sản phẩm",
        error,
        form: product,
      });
    }

    await Product.create(product);
    req.session.flash = {
      type: "success",
      message: "Thêm sản phẩm thành công.",
    };
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

module.exports = { show, create };
