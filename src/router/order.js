const express = require("express");
const checkLogin = require("../middleware/checkLogin");
const checkout = require("../controller/order/CheckoutController");
const orderSuccess = require("../controller/order/OrderSuccessController");

const router = express.Router();

router.use("/orders", checkLogin);

router.get("/orders/create", checkout.show);
router.post("/orders/create", checkout.create);
router.get("/orders/success", orderSuccess.success);

module.exports = router;
