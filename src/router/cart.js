const express = require("express");
const cartPage = require("../controller/cart/CartPageController");
const cartAdd = require("../controller/cart/CartAddController");
const cartUpdate = require("../controller/cart/CartUpdateController");
const cartRemove = require("../controller/cart/CartRemoveController");

const router = express.Router();

router.get("/cart", cartPage.index);
router.post("/cart/add/:id", cartAdd.add);
router.post("/cart/update/:id", cartUpdate.update);
router.post("/cart/remove/:id", cartRemove.remove);

module.exports = router;
