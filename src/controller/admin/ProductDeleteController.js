const Product = require("../../model/Product");

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      req.session.flash = {
        type: "warning",
        message: "Sản phẩm không hợp lệ.",
      };
      return res.redirect("/admin/products");
    }

    const result = await Product.delete(id);

    if (!result.deletedCount) {
      req.session.flash = {
        type: "warning",
        message: "Không tìm thấy sản phẩm.",
      };
      return res.redirect("/admin/products");
    }

    req.session.flash = {
      type: "success",
      message: "Đã xóa sản phẩm.",
    };

    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  remove,
};
