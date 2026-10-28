const express = require("express");
const CartSession = require("../model/CartSession");
const CartDetails = require("../model/CartDetails");
const Product = require("../model/Product");
const {
  asyncHandler,
  sendSuccess,
  throwApiError,
  isValidId,
  protect,
  checkCartOwner,
} = require("./common");

const router = express.Router();

router.use("/cart", protect, checkCartOwner);

router.get("/cart", asyncHandler(async (req, res) => {
  return sendSuccess(res, await CartDetails.get(req));
}));

router.post("/cart/items", asyncHandler(async (req, res) => {
  const productId = Number(req.body.product_id);
  const quantity = Number(req.body.quantity ?? 1);

  if (!isValidId(productId) || !isValidId(quantity) || quantity > 100) {
    throwApiError(400, "Số lượng hoặc sản phẩm không hợp lệ.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throwApiError(404, "Sản phẩm không tồn tại.");
  }

  const currentItem = CartSession.get(req).find((item) => {
    return item.product_id === productId;
  });
  const nextQuantity = (currentItem?.quantity || 0) + quantity;

  if (nextQuantity > Number(product.stock)) {
    throwApiError(409, "Không đủ tồn kho.", "INSUFFICIENT_STOCK");
  }

  if (currentItem) {
    CartSession.update(req, productId, nextQuantity);
  } else {
    CartSession.add(req, productId);
    CartSession.update(req, productId, quantity);
  }

  return sendSuccess(res, await CartDetails.get(req), 201);
}));

router.patch("/cart/items/:id", asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  const quantity = Number(req.body.quantity);

  if (!isValidId(productId) || !isValidId(quantity) || quantity > 100) {
    throwApiError(400, "Số lượng không hợp lệ.");
  }

  const cartItem = CartSession.get(req).find((item) => {
    return item.product_id === productId;
  });

  if (!cartItem) {
    throwApiError(404, "Sản phẩm chưa có trong giỏ.");
  }

  const product = await Product.findById(productId);

  if (!product || product.stock < quantity) {
    throwApiError(409, "Không đủ tồn kho.", "INSUFFICIENT_STOCK");
  }

  CartSession.update(req, productId, quantity);
  return sendSuccess(res, await CartDetails.get(req));
}));

router.delete("/cart/items/:id", asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);

  if (!isValidId(productId)) {
    throwApiError(400, "ID không hợp lệ.");
  }

  CartSession.remove(req, productId);
  return sendSuccess(res, await CartDetails.get(req));
}));

router.delete("/cart", (req, res) => {
  CartSession.clear(req);
  return sendSuccess(res, { items: [], total: 0 });
});

module.exports = router;
