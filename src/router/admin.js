const express = require("express");
const checkAdmin = require("../middleware/checkAdmin");
const productList = require("../controller/admin/ProductListController");
const productCreate = require("../controller/admin/ProductCreateController");
const productEdit = require("../controller/admin/ProductEditController");
const productDelete = require("../controller/admin/ProductDeleteController");

const order = require("../controller/admin/OrderController");
const router = express.Router();

router.use("/admin", checkAdmin);

router.get("/admin", productList.index);
router.get("/admin/products", productList.index);
router.get("/admin/products/create", productCreate.show);
router.post("/admin/products/create", productCreate.create);
router.get("/admin/products/:id/edit", productEdit.show);
router.post("/admin/products/:id/edit", productEdit.update);
router.post("/admin/products/:id/delete", productDelete.remove);

router.get("/admin/orders", order.index);
router.get("/admin/orders/:id", order.detail);
router.post("/admin/orders/:id/status", order.updateStatus);
router.get("/admin/stats", order.showStatistics);
module.exports = router;
