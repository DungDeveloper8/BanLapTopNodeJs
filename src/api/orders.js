const express = require("express");
const Order = require("../model/Order");
const CartSession = require("../model/CartSession");
const { OrderService } = require("../service/OrderService");
const {
  asyncHandler,
  sendSuccess,
  throwApiError,
  isValidId,
  protect,
  authorize,
  checkCartOwner,
} = require("./common");

const router = express.Router();

router.use("/orders", protect, checkCartOwner);

router.post("/orders", asyncHandler(async (req, res) => {
  const result = await OrderService.create({
    userId: req.apiUser.id,
    customerName: req.body.customer_name,
    phone: req.body.phone,
    address: req.body.address,
    items: CartSession.get(req),
    checkoutKey: req.headers["idempotency-key"] || req.body.checkout_key,
  });

  if (!result.reused) {
    CartSession.clear(req);
  }

  const order = await Order.findById(result.id, req.apiUser.id);
  return sendSuccess(res, order, result.reused ? 200 : 201);
}));

router.get("/orders/me", asyncHandler(async (req, res) => {
  const orders = await Order.findByUserId(req.apiUser.id);
  return sendSuccess(res, orders);
}));

router.get("/orders", authorize("admin"), asyncHandler(async (req, res) => {
  const orders = await Order.findAll();
  return sendSuccess(res, orders);
}));

router.get("/orders/:id", asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID đơn không hợp lệ.");
  }

  const order = await Order.findById(
    req.params.id,
    req.apiUser.id,
    req.apiUser.is_admin,
  );

  if (!order) {
    throwApiError(404, "Không tìm thấy đơn hàng.", "NOT_FOUND");
  }

  return sendSuccess(res, order);
}));

router.patch("/orders/:id", asyncHandler(async (req, res) => {
  if (req.body.status !== "CANCELLED") {
    throwApiError(400, "Chỉ được yêu cầu hủy đơn.");
  }

  const order = await OrderService.updateStatus(
    req.params.id,
    "CANCELLED",
    req.apiUser.id,
    req.apiUser.is_admin,
  );

  return sendSuccess(res, order);
}));

router.patch("/orders/:id/status", authorize("admin"), asyncHandler(async (req, res) => {
  const status = String(req.body.status || "").trim().toUpperCase();
  const order = await OrderService.updateStatus(
    req.params.id,
    status,
    req.apiUser.id,
    true,
  );

  return sendSuccess(res, order);
}));

module.exports = router;
