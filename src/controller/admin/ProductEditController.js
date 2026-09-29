const Product = require("../../model/Product");

async function show(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không hợp lệ.",
      };

      return res.redirect("/admin/products");
    }

    const product = await Product.findById(id);

    if (!product) {
      req.session.flash = {
        type: "warning",
        message: "Không tìm thấy sản phẩm.",
      };
      return res.redirect("/admin/products");
    }

    return res.render("admin/productEdit", {
      layout: "admin",
      title: "Sửa sản phẩm",
      product,
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không hợp lệ.",
      };

      return res.redirect("/admin/products");
    }

    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      req.session.flash = {
        type: "warning",
        message: "Không tìm thấy sản phẩm.",
      };

      return res.redirect("/admin/products");
    }

    const name = String(req.body.name || "").trim();
    const brand = String(req.body.brand || "").trim();
    const image = String(req.body.image || "").trim();
    const description = String(req.body.description || "").trim();
    let price = Number(req.body.price);

    if (req.body.price === "" || req.body.price == null) {
      price = NaN;
    }

    const product = {
      id,
      name,
      brand,
      price,
      image,
      description,
    };

    if (!name || !brand) {
      return res.status(400).render("admin/productEdit", {
        layout: "admin",
        title: "Sửa sản phẩm",
        error: "Vui lòng nhập tên sản phẩm và hãng.",
        product,
      });
    }

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).render("admin/productEdit", {
        layout: "admin",
        title: "Sửa sản phẩm",
        error: "Giá sản phẩm không hợp lệ.",
        product,
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

module.exports = {
  show,
  update,
};
