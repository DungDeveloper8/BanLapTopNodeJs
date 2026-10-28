const Order = require("../../model/Order");
const ProductReview = require("../../model/ProductReview");
const { OrderService, BusinessError } = require("../../service/OrderService");

async function index(req, res, next) {
  try {
    const orders = await Order.findByUserId(req.session.user.id);
    return res.render("orders/history", {
      title: "Đơn hàng của tôi",
      orders,
    });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const order = await Order.findById(req.params.id, req.session.user.id);
    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng.");
    }
    const reviews = await ProductReview.findByUserAndProductIds(req.session.user.id, order.items.map((item) => item.product_id));
    const delivered = order.order_status === "COMPLETED";
    const items = order.items.map((item) => {
      const review = reviews.get(Number(item.product_id));
      return {
        ...item,
        canReview: delivered && !review,
        review: review ? {
          rating: review.rating,
          comment: review.comment,
          stars: "★".repeat(review.rating),
          emptyStars: "☆".repeat(5 - review.rating),
        } : null,
      };
    });
    return res.render("orders/detail", {
      title: `Đơn hàng #${order.id}`,
      order: { ...order, items },
      canCancel: ["NEW", "CONFIRMED"].includes(order.order_status),
      delivered,
    });
  } catch (error) {
    return next(error);
  }
}

async function cancel(req, res, next) {
  try {
    await OrderService.updateStatus(req.params.id, "CANCELLED", req.session.user.id, false);
    req.session.flash = {
      type: "success",
      message: "Đã hủy đơn hàng và hoàn tồn kho.",
    };
    return res.redirect(`/orders/${req.params.id}`);
  } catch (error) {
    if (error instanceof BusinessError) {
      req.session.flash = { type: "warning", message: error.message };
      return res.redirect("/orders/history");
    }
    return next(error);
  }
}

async function createReview(req, res, next) {
  const redirectTo = `/orders/${req.params.id}`;
  try {
    await ProductReview.create({
      userId: req.session.user.id,
      orderId: req.params.id,
      productId: req.params.productId,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    req.session.flash = {
      type: "success",
      message: "Đánh giá sản phẩm đã được gửi thành công.",
    };
    return res.redirect(redirectTo);
  } catch (error) {
    if (error instanceof BusinessError) {
      req.session.flash = { type: "warning", message: error.message };
      return res.redirect(redirectTo);
    }
    return next(error);
  }
}

module.exports = { index, detail, cancel, createReview };
