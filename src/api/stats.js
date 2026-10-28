const express = require("express");
const { database } = require("../config/database");
const {
  asyncHandler,
  sendSuccess,
  throwApiError,
  protect,
  authorize,
} = require("./common");

const router = express.Router();

router.use("/stats", protect, authorize("admin"));

router.get("/stats/revenue", asyncHandler(async (req, res) => {
  const groupBy = req.query.groupBy || "day";

  if (!["day", "month"].includes(groupBy)) {
    throwApiError(400, "Kiểu thống kê không hợp lệ.");
  }

  const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
  const from = req.query.from ? new Date(req.query.from) : new Date("2000-01-01");
  const to = req.query.to ? new Date(req.query.to) : new Date();

  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf()) || from > to) {
    throwApiError(400, "Khoảng ngày không hợp lệ.");
  }

  const revenue = await database.collection("orders").aggregate([
    {
      $match: {
        order_status: "COMPLETED",
        created_at: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: "$created_at",
            timezone: "+07:00",
          },
        },
        revenue: { $sum: "$total_price" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray();

  return sendSuccess(res, revenue);
}));

router.get("/stats/top-products", asyncHandler(async (req, res) => {
  const products = await database.collection("orders").aggregate([
    { $match: { order_status: "COMPLETED" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product_id",
        name: { $last: "$items.product_name" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.subtotal" },
      },
    },
    { $sort: { quantity: -1, _id: 1 } },
    { $limit: 20 },
  ]).toArray();

  return sendSuccess(res, products);
}));

module.exports = router;
