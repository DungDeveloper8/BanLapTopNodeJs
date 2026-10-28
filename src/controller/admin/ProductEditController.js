const Product = require("../../model/Product");

async function show(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      req.session.flash = { type: "warning", message: "Sản phẩm không hợp lệ." };
      return res.redirect("/admin/products");
    }
    const product = await Product.findById(id, { includeInactive: true });
    if (!product) {
      req.session.flash = { type: "warning", message: "Không tìm thấy sản phẩm." };
      return res.redirect("/admin/products");
    }
    return res.render("admin/productEdit", {
      layout: "admin",
      title: "Sửa sản phẩm",
      product: {
        ...product,
        isPhone: product.category === "Điện thoại",
        isAccessory: product.category !== "Điện thoại",
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      req.session.flash = { type: "warning", message: "Sản phẩm không hợp lệ." };
      return res.redirect("/admin/products");
    }
    const existing = await Product.findById(id, { includeInactive: true });
    if (!existing) {
      req.session.flash = { type: "warning", message: "Không tìm thấy sản phẩm." };
      return res.redirect("/admin/products");
    }

    const { product, error } = Product.parseForm(req.body);
    if (error) {
      return res.status(400).render("admin/productEdit", {
        layout: "admin",
        title: "Sửa sản phẩm",
        error,
        product: { ...product, id },
      });
    }

    await Product.update(id, product);
    req.session.flash = {
      type: "success",
      message: "Cập nhật sản phẩm thành công.",
    };
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

module.exports = { show, update };
