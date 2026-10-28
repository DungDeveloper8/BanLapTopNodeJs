const Order = require("../../model/Order");
const { database } = require("../../config/database");
const { OrderService, BusinessError } = require("../../service/OrderService");

async function index(req, res, next) {
  try {
    const orders = await Order.findAll();
    return res.render("admin/orders", {
      layout: "admin",
      title: "Quản lý đơn hàng",
      orders,
    });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const order = await Order.findById(req.params.id, req.session.user.id, true);
    if (!order) {
      return res.status(404).send("Không tìm thấy đơn hàng.");
    }
    return res.render("admin/orderDetail", {
      layout: "admin",
      title: `Đơn hàng #${order.id}`,
      order,
      canShip: ["NEW", "CONFIRMED"].includes(order.order_status),
      canComplete: order.order_status === "SHIPPING",
      canCancel: ["NEW", "CONFIRMED"].includes(order.order_status),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    await OrderService.updateStatus(req.params.id, String(req.body.status || "").trim().toUpperCase(), req.session.user.id, true);
    req.session.flash = {
      type: "success",
      message: "Đã cập nhật trạng thái đơn hàng.",
    };
    return res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    if (error instanceof BusinessError) {
      req.session.flash = { type: "warning", message: error.message };
      return res.redirect(`/admin/orders/${req.params.id}`);
    }
    return next(error);
  }
}

async function showStatistics(req, res, next) {
  try {
    const [overview] = await database.collection("orders").aggregate([
      { $match: { order_status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total_price" },
          orders: { $sum: 1 },
        },
      },
    ]).toArray();
    const top = await database.collection("orders").aggregate([
      { $match: { order_status: "COMPLETED" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          name: { $last: "$items.product_name" },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 },
    ]).toArray();
    return res.render("admin/stats", {
      layout: "admin",
      title: "Thống kê",
      revenue: overview?.revenue || 0,
      completedOrders: overview?.orders || 0,
      top,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { index, detail, updateStatus, showStatistics };
