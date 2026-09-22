const express = require("express");
const checkAdmin = require("../middleware/checkAdmin");
const productList = require("../controller/admin/ProductListController");
const productCreate = require("../controller/admin/ProductCreateController");
const productEdit = require("../controller/admin/ProductEditController");
const productDelete = require("../controller/admin/ProductDeleteController");

const router = express.Router();

router.use("/admin", checkAdmin);

router.get("/admin", productList.index);
router.get("/admin/products", productList.index);
router.get("/admin/products/create", productCreate.show);
router.post("/admin/products/create", productCreate.create);
router.get("/admin/products/:id/edit", productEdit.show);
router.post("/admin/products/:id/edit", productEdit.update);
router.post("/admin/products/:id/delete", productDelete.remove);

module.exports = router;
