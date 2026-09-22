const express = require("express");
const home = require("../controller/product/HomeController");
const productDetail = require("../controller/product/ProductDetailController");

const router = express.Router();

router.get("/", home.index);
router.get("/products/:id", productDetail.detail);

module.exports = router;
