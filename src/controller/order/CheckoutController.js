const CartDetails = require("../../model/CartDetails");
const CartSession = require("../../model/CartSession");
const Order = require("../../model/Order");
const { OrderService, BusinessError } = require("../../service/OrderService");

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
    req.session.checkoutKey = req.session.checkoutKey || OrderService.createCheckoutKey();
    return res.render("orders/create", {
      title: "Mua hàng",
      ...cart,
      checkoutKey: req.session.checkoutKey,
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
        checkoutKey: req.session.checkoutKey,
      });
    }
    const phonePattern = /^[0-9+\s.-]{8,20}$/;
    if (!phonePattern.test(phone)) {
      return res.status(400).render("orders/create", {
        title: "Mua hàng",
        error: "Số điện thoại không hợp lệ.",
        ...cart,
        form,
        checkoutKey: req.session.checkoutKey,
      });
    }
    if (!req.session.checkoutKey || req.body.checkout_key !== req.session.checkoutKey) {
      return res.status(409).render("orders/create", {
        title: "Mua hàng",
        error: "Phiên đặt hàng đã hết hạn. Vui lòng tải lại trang.",
        ...cart,
        form,
        checkoutKey: req.session.checkoutKey,
      });
    }
    const result = await Order.create(
      req.session.user.id,
      customerName,
      phone,
      address,
      cart.items,
      req.session.checkoutKey,
    );
    CartSession.clear(req);
    delete req.session.checkoutKey;
    req.session.lastOrderId = result.id;
    return res.redirect("/orders/success");
  } catch (error) {
    if (error instanceof BusinessError) {
      const cart = await CartDetails.get(req);
      return res.status(error.status).render("orders/create", {
        title: "Mua hàng",
        error: error.message,
        ...cart,
        checkoutKey: req.session.checkoutKey,
        form: req.body,
      });
    }
    return next(error);
  }
}

module.exports = {
  show,
  create,
};
