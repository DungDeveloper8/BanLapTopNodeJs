const express = require("express");
const checkLogin = require("../middleware/checkLogin");
const checkout = require("../controller/order/CheckoutController");
const orderSuccess = require("../controller/order/OrderSuccessController");

const orderHistory = require("../controller/order/OrderHistoryController");
const router = express.Router();

router.use("/orders", checkLogin);

router.get("/orders/create", checkout.show);
router.post("/orders/create", checkout.create);
router.get("/orders/success", orderSuccess.success);
router.get("/orders/history", orderHistory.index);
router.get("/orders/:id", orderHistory.detail);
router.post("/orders/:id/cancel", orderHistory.cancel);
router.post("/orders/:id/reviews/:productId", orderHistory.createReview);

module.exports = router;
