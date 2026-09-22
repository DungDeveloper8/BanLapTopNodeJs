const CartDetails = require("../../model/CartDetails");
const CartSession = require("../../model/CartSession");
const Order = require("../../model/Order");

async function show(req, res, next) {
  try {
    const cart = await CartDetails.get(req);

    if (!cart.items.length) {
      req.session.flash = {
        type: "warning",
        message: "Giỏ hàng đang trống.",
      };

      return res.redirect("/cart");
    }

    return res.render("orders/create", {
      title: "Mua hàng",
      ...cart,
      form: {
        customer_name: req.session.user.username,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const customerName = String(req.body.customer_name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const address = String(req.body.address || "").trim();
    const cart = await CartDetails.get(req);
    const form = {
      customer_name: customerName,
      phone,
      address,
    };

    if (!cart.items.length) {
      req.session.flash = {
        type: "warning",
        message: "Giỏ hàng đang trống.",
      };

      return res.redirect("/cart");
    }

    if (!customerName || !phone || !address) {
      return res.status(400).render("orders/create", {
        title: "Mua hàng",
        error: "Vui lòng nhập đầy đủ thông tin nhận hàng.",
        ...cart,
        form,
      });
    }

    const phonePattern = /^[0-9+\s.-]{8,20}$/;

    if (!phonePattern.test(phone)) {
      return res.status(400).render("orders/create", {
        title: "Mua hàng",
        error: "Số điện thoại không hợp lệ.",
        ...cart,
        form,
      });
    }

    const orderId = await Order.create(
      req.session.user.id,
      customerName,
      phone,
      address,
      cart.items,
    );

    CartSession.clear(req);
    req.session.lastOrderId = orderId;

    return res.redirect("/orders/success");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  show,
  create,
};
