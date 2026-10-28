const { database, nextId } = require("../config/database");
const { ReviewDoc } = require("./Schemas");
const { BusinessError } = require("../service/OrderService");

class ProductReview {
  static validate(rating, comment) {
    const stars = Number(rating);
    const message = typeof comment === "string" ? comment.trim() : "";
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new BusinessError(400, "Vui lòng chọn từ 1 đến 5 sao.", "INVALID_RATING");
    }
    if (!message || message.length > 1000) {
      throw new BusinessError(400, "Nhận xét phải có từ 1 đến 1000 ký tự.", "INVALID_COMMENT");
    }
    return { rating: stars, comment: message };
  }

  static async findByUserAndProductIds(userId, productIds) {
    if (!productIds.length) {
      return new Map();
    }
    const reviews = await ReviewDoc.find({
      user_id: Number(userId),
      product_id: { $in: productIds.map(Number) },
    }).lean();
    return new Map(reviews.map((review) => [review.product_id, review]));
  }

  static async findByProductId(productId) {
    const reviews = await ReviewDoc.find({
      product_id: Number(productId),
      status: "APPROVED",
    })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    const userIds = [...new Set(reviews.map((review) => review.user_id))];
    const users = userIds.length
      ? await database.collection("users")
        .find({ id: { $in: userIds } }, { projection: { id: 1, username: 1 } })
        .toArray()
      : [];
    const usernames = new Map(users.map((user) => [user.id, user.username]));
    return reviews.map((review) => ({
      id: review.id,
      product_id: review.product_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      author: usernames.get(review.user_id) || "Khách hàng",
      stars: "★".repeat(review.rating),
      emptyStars: "☆".repeat(5 - review.rating),
    }));
  }

  static async create({ userId, productId, orderId, rating, comment }) {
    const user = Number(userId);
    const product = Number(productId);
    if (!Number.isSafeInteger(user) || user <= 0 ||
      !Number.isSafeInteger(product) || product <= 0) {
      throw new BusinessError(400, "Tài khoản hoặc sản phẩm không hợp lệ.", "INVALID_REVIEW");
    }
    const content = this.validate(rating, comment);
    const productDoc = await database.collection("products").findOne({ id: product });
    if (!productDoc) {
      throw new BusinessError(404, "Không tìm thấy sản phẩm.", "PRODUCT_NOT_FOUND");
    }
    const query = {
      user_id: user,
      order_status: "COMPLETED",
      "items.product_id": product,
    };
    if (orderId !== undefined && orderId !== null) {
      const orderNumber = Number(orderId);
      if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0) {
        throw new BusinessError(400, "Mã đơn hàng không hợp lệ.", "INVALID_ORDER");
      }
      query.id = orderNumber;
    }
    const order = await database.collection("orders")
      .find(query)
      .sort({ created_at: -1 })
      .limit(1)
      .next();
    if (!order) {
      throw new BusinessError(403, "Chỉ được đánh giá sản phẩm thuộc đơn hàng đã giao thành công.", "PURCHASE_REQUIRED");
    }
    const existing = await ReviewDoc.exists({ user_id: user, product_id: product });
    if (existing) {
      throw new BusinessError(409, "Bạn đã đánh giá sản phẩm này.", "REVIEW_EXISTS");
    }
    const now = new Date();
    const review = {
      id: await nextId("product_reviews"),
      user_id: user,
      product_id: product,
      order_id: order.id,
      rating: content.rating,
      comment: content.comment,
      status: "APPROVED",
      created_at: now,
      updated_at: now,
    };
    try {
      await ReviewDoc.create(review);
    } catch (error) {
      if (error.code === 11000) {
        throw new BusinessError(409, "Bạn đã đánh giá sản phẩm này.", "REVIEW_EXISTS");
      }
      throw error;
    }
    return {
      id: review.id,
      product_id: review.product_id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      created_at: review.created_at,
    };
  }
}

module.exports = ProductReview;
