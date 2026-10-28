const express = require("express");
const { ReviewDoc } = require("../model/Schemas");
const ProductReview = require("../model/ProductReview");
const { asyncHandler, sendSuccess, throwApiError, isValidId, protect } = require("./common");
const router = express.Router();
router.get("/products/:id/reviews", asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID sản phẩm không hợp lệ.");
  }
  return sendSuccess(res, await ProductReview.findByProductId(req.params.id));
}));
router.post("/products/:id/reviews", protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID sản phẩm không hợp lệ.");
  }
  const review = await ProductReview.create({
    userId: req.apiUser.id,
    productId: req.params.id,
    orderId: req.body.order_id,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  return sendSuccess(res, review, 201);
}));
router.patch("/reviews/:id", protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID đánh giá không hợp lệ.");
  }
  const patch = {};
  if (req.body.rating !== undefined) {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throwApiError(400, "Số sao không hợp lệ.");
    }
    patch.rating = rating;
  }
  if (req.body.comment !== undefined) {
    const comment = String(req.body.comment).trim();
    if (!comment || comment.length > 1000) {
      throwApiError(400, "Nhận xét phải có từ 1 đến 1000 ký tự.");
    }
    patch.comment = comment;
  }
  if (!Object.keys(patch).length) {
    throwApiError(400, "Không có nội dung cần sửa.");
  }
  patch.updated_at = new Date();
  const review = await ReviewDoc.findOneAndUpdate(
    { id: Number(req.params.id), user_id: req.apiUser.id },
    { $set: patch },
    { new: true, runValidators: true, lean: true },
  );
  if (!review) {
    throwApiError(404, "Không tìm thấy đánh giá của bạn.", "NOT_FOUND");
  }
  return sendSuccess(res, {
    id: review.id,
    product_id: review.product_id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
  });
}));
router.delete("/reviews/:id", protect, asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) {
    throwApiError(400, "ID đánh giá không hợp lệ.");
  }
  const deleted = await ReviewDoc.deleteOne({
    id: Number(req.params.id),
    user_id: req.apiUser.id,
  });
  if (!deleted.deletedCount) {
    throwApiError(404, "Không tìm thấy đánh giá của bạn.", "NOT_FOUND");
  }
  return res.status(204).end();
}));

module.exports = router;
