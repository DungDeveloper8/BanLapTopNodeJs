const Product = require("../../model/Product");

function show(req, res) {
  return res.render("admin/productCreate", {
    layout: "admin",
    title: "Thêm sản phẩm",
    form: {},
  });
}

async function create(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const brand = String(req.body.brand || "").trim();
    const image = String(req.body.image || "").trim();
    const description = String(req.body.description || "").trim();
    let price = Number(req.body.price);

    if (req.body.price === "" || req.body.price == null) {
      price = NaN;
    }

    const product = {
      name,
      brand,
      price,
      image,
      description,
    };

    if (!name || !brand) {
      return res.status(400).render("admin/productCreate", {
        layout: "admin",
        title: "Thêm sản phẩm",
        error: "Vui lòng nhập tên sản phẩm và hãng.",
        form: product,
      });
    }

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).render("admin/productCreate", {
        layout: "admin",
        title: "Thêm sản phẩm",
        error: "Giá sản phẩm không hợp lệ.",
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

module.exports = {
  show,
  create,
};
