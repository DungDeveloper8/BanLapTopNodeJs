const express = require("express");
const Product = require("../model/Product");
const { ProductDoc } = require("../model/Schemas");
const { database } = require("../config/database");
const {
  asyncHandler,
  sendSuccess,
  throwApiError,
  isValidId,
  protect,
  authorize,
} = require("./common");

const router = express.Router();

router.get("/brands", asyncHandler(async (req, res) => {
  const brands = await database.collection("products").distinct("brand", {
    is_active: { $ne: false },
  });

  return sendSuccess(res, brands.filter(Boolean).sort());
}));

router.get("/categories", (req, res) => {
  return sendSuccess(res, ["Phụ kiện", "Điện thoại"]);
});

router.get("/products", asyncHandler(async (req, res) => {
  const result = await Product.search(req.query);

  return res.json({
    success: true,
    message: "Thành công",
    data: result.products,
    pagination: result.pagination,
  });
}));

router.get("/products/:id", asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID không hợp lệ.");
  }

  const product = await ProductDoc.findOne({
    id: Number(req.params.id),
    is_active: { $ne: false },
  }).lean();

  if (!product) {
    throwApiError(404, "Không tìm thấy sản phẩm.", "NOT_FOUND");
  }

  return sendSuccess(res, product);
}));

router.post("/products", protect, authorize("admin"), asyncHandler(async (req, res) => {
  const { product, error } = Product.parseForm(req.body);

  if (error) {
    throwApiError(400, error);
  }

  const id = await Product.create(product);
  return sendSuccess(res, await Product.findById(id), 201);
}));

router.patch("/products/:id", protect, authorize("admin"), asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID không hợp lệ.");
  }

  const existingProduct = await Product.findById(req.params.id, {
    includeInactive: true,
  });

  if (!existingProduct) {
    throwApiError(404, "Không tìm thấy sản phẩm.", "NOT_FOUND");
  }

  const { product, error } = Product.parseForm({
    ...existingProduct,
    ...req.body,
  });

  if (error) {
    throwApiError(400, error);
  }

  await Product.update(req.params.id, product);
  const updatedProduct = await Product.findById(req.params.id, {
    includeInactive: true,
  });

  return sendSuccess(res, updatedProduct);
}));

router.delete("/products/:id", protect, authorize("admin"), asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID không hợp lệ.");
  }

  const result = await Product.remove(req.params.id);

  if (!result.deletedCount) {
    throwApiError(404, "Không tìm thấy sản phẩm đang bán.", "NOT_FOUND");
  }

  return res.status(204).end();
}));

module.exports = router;
