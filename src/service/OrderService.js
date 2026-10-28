const { randomUUID } = require("node:crypto");
const { database, nextId, mongoose } = require("../config/database");

class BusinessError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function normalizeCartItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new BusinessError(400, "Giỏ hàng trống hoặc quá nhiều mặt hàng.", "INVALID_CART");
  }
  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new BusinessError(400, "Sản phẩm trong giỏ không hợp lệ.", "INVALID_CART");
    }
    const productId = Number(item.product_id ?? item.id);
    const quantity = Number(item.quantity);
    if (!isPositiveInteger(productId) || !isPositiveInteger(quantity) || quantity > 100) {
      throw new BusinessError(400, "Sản phẩm hoặc số lượng không hợp lệ.", "INVALID_CART");
    }
    const totalQuantity = (quantities.get(productId) || 0) + quantity;
    if (totalQuantity > 100) {
      throw new BusinessError(400, "Vượt giới hạn số lượng.", "INVALID_CART");
    }
    quantities.set(productId, totalQuantity);
  }
  return [...quantities].sort((a, b) => a[0] - b[0]);
}

function validateShippingAddress(customerName, phone, address) {
  if (!customerName ||
    customerName.length > 100 ||
    !/^[0-9+\s.\-]{8,20}$/.test(phone) ||
    !address ||
    address.length > 255) {
    throw new BusinessError(400, "Thông tin người nhận không hợp lệ.", "INVALID_ADDRESS");
  }
}

function assertSameCheckout(order, userId, customerName, phone, address, normalized) {
  if (order.user_id !== Number(userId)) {
    throw new BusinessError(409, "Mã đặt hàng đã được sử dụng.", "CHECKOUT_CONFLICT");
  }
  const sameAddress = (order.customer_name === customerName &&
    order.phone === phone &&
    order.address === address);
  const previousItems = (order.items || [])
    .map((item) => [Number(item.product_id), Number(item.quantity)])
    .sort((a, b) => a[0] - b[0]);
  const sameItems = (previousItems.length === normalized.length &&
    previousItems.every(([id, quantity], index) => (id === normalized[index][0] && quantity === normalized[index][1])));
  if (!sameAddress || !sameItems) {
    throw new BusinessError(409, "Mã đặt hàng không khớp giỏ hàng hoặc thông tin người nhận.", "CHECKOUT_CONFLICT");
  }
}

class OrderService {
  static async create({ userId, customerName, phone, address, items, checkoutKey }) {
    if (!isPositiveInteger(userId)) {
      throw new BusinessError(401, "Yêu cầu đăng nhập.", "UNAUTHENTICATED");
    }
    const name = String(customerName ?? "").trim();
    const mobile = String(phone ?? "").trim();
    const destination = String(address ?? "").trim();
    validateShippingAddress(name, mobile, destination);
    if (typeof checkoutKey !== "string" || !/^[\w-]{12,100}$/.test(checkoutKey)) {
      throw new BusinessError(400, "Phiên đặt hàng không hợp lệ.", "INVALID_CHECKOUT_KEY");
    }
    const normalized = Array.isArray(items) && items.length
      ? normalizeCartItems(items)
      : null;
    const orders = database.collection("orders");
    const existing = await orders.findOne({ checkout_key: checkoutKey });
    if (existing) {
      if (normalized) {
        assertSameCheckout(existing, userId, name, mobile, destination, normalized);
      }
      else if (existing.user_id !== Number(userId) ||
        existing.customer_name !== name ||
        existing.phone !== mobile ||
        existing.address !== destination) {
        throw new BusinessError(409, "Mã đặt hàng không khớp thông tin người nhận.", "CHECKOUT_CONFLICT");
      }
      return { id: existing.id, reused: true };
    }
    if (!normalized) {
      normalizeCartItems(items);
    }
    const session = await mongoose.startSession();
    let created;
    try {
      await session.withTransaction(async () => {
        const duplicate = await orders.findOne({ checkout_key: checkoutKey }, { session });
        if (duplicate) {
          assertSameCheckout(duplicate, userId, name, mobile, destination, normalized);
          created = { id: duplicate.id, reused: true };
          return;
        }
        const snapshots = [];
        let total = 0;
        for (const [productId, quantity] of normalized) {
          const product = await database.collection("products").findOneAndUpdate(
            { id: productId, is_active: true, stock: { $gte: quantity } },
            {
            $inc: { stock: -quantity },
            $set: { updated_at: new Date() },
          }, { session, returnDocument: "before" });
          if (!product) {
            throw new BusinessError(409, `Sản phẩm #${productId} đã hết hoặc không đủ hàng.`, "INSUFFICIENT_STOCK");
          }
          const unitPrice = Number(product.price);
          const subtotal = unitPrice * quantity;
          if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) {
            throw new BusinessError(409, "Giá sản phẩm không hợp lệ.", "INVALID_PRICE");
          }
          if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(total + subtotal)) {
            throw new BusinessError(409, "Tổng tiền vượt giới hạn cho phép.", "INVALID_TOTAL");
          }
          total += subtotal;
          snapshots.push({
            product_id: productId,
            product_name: String(product.name),
            product_price: unitPrice,
            product_image: String(product.image || ""),
            quantity,
            subtotal,
          });
        }
        const orderId = await nextId("orders", session);
        const now = new Date();
        await orders.insertOne({
          id: orderId,
          user_id: Number(userId),
          customer_name: name,
          phone: mobile,
          address: destination,
          items: snapshots,
          total_price: total,
          payment_method: "COD",
          order_status: "NEW",
          payment_status: "UNPAID",
          checkout_key: checkoutKey,
          created_at: now,
          updated_at: now,
        }, { session });
        created = { id: orderId, total, reused: false };
      }, {
        readPreference: "primary",
        writeConcern: { w: "majority" },
      });
    } catch (error) {
      if (error?.code === 11000) {
        const duplicate = await orders.findOne({
          checkout_key: checkoutKey,
          user_id: Number(userId),
        });
        if (duplicate) {
          assertSameCheckout(duplicate, userId, name, mobile, destination, normalized);
          return { id: duplicate.id, reused: true };
        }
      }
      throw error;
    }
    finally {
      await session.endSession();
    }
    return created;
  }

  static async updateStatus(orderId, nextStatus, actorId, isAdmin) {
    if (!isPositiveInteger(orderId) || !isPositiveInteger(actorId)) {
      throw new BusinessError(400, "Mã đơn không hợp lệ.", "INVALID_ORDER");
    }
    if (!isAdmin && nextStatus !== "CANCELLED") {
      throw new BusinessError(403, "Không có quyền cập nhật đơn.", "FORBIDDEN");
    }
    const transitions = {
      NEW: ["SHIPPING", "CANCELLED"],
      CONFIRMED: ["SHIPPING", "CANCELLED"],
      SHIPPING: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
      LEGACY: [],
    };
    const session = await mongoose.startSession();
    let updated;
    try {
      await session.withTransaction(async () => {
        const orders = database.collection("orders");
        const order = await orders.findOne({ id: Number(orderId) }, { session });
        if (!order) {
          throw new BusinessError(404, "Không tìm thấy đơn hàng.", "ORDER_NOT_FOUND");
        }
        if (!isAdmin && order.user_id !== Number(actorId)) {
          throw new BusinessError(403, "Không phải đơn hàng của bạn.", "FORBIDDEN");
        }
        if (!(transitions[order.order_status] || []).includes(nextStatus)) {
          throw new BusinessError(409, "Chuyển trạng thái không hợp lệ.", "INVALID_STATUS");
        }
        const patch = {
          order_status: nextStatus,
          updated_at: new Date(),
        };
        if (nextStatus === "COMPLETED" && order.payment_method === "COD") {
          patch.payment_status = "PAID";
        }
        if (nextStatus === "CANCELLED") {
          for (const item of order.items) {
            const restored = await database.collection("products").updateOne({ id: item.product_id }, {
              $inc: { stock: item.quantity },
              $set: { updated_at: new Date() },
            }, { session });
            if (restored.matchedCount !== 1) {
              throw new BusinessError(409, "Không thể hoàn tồn kho.", "STOCK_RESTORE_FAILED");
            }
          }
        }
        const result = await orders.updateOne(
          { id: order.id, order_status: order.order_status },
          { $set: patch },
          { session },
        );
        if (result.modifiedCount !== 1) {
          throw new BusinessError(409, "Đơn hàng đã thay đổi.", "ORDER_CONFLICT");
        }
        updated = { ...order, ...patch };
      });
    }
    finally {
      await session.endSession();
    }
    return updated;
  }

  static createCheckoutKey() {
    return randomUUID();
  }
}

module.exports = { OrderService, BusinessError };
