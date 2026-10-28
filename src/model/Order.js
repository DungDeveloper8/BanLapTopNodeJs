const { database } = require("../config/database");
const { OrderService } = require("../service/OrderService");

class Order {
  static async create(userId, customerName, phone, address, items, checkoutKey) {
    return OrderService.create({
      userId,
      customerName,
      phone,
      address,
      items,
      checkoutKey,
    });
  }

  static async findByUserId(userId) {
    return database.collection("orders")
      .find({ user_id: Number(userId) })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
  }

  static async findById(id, userId, isAdmin = false) {
    const filter = { id: Number(id) };

    if (!isAdmin) {
      filter.user_id = Number(userId);
    }

    return database.collection("orders").findOne(filter);
  }

  static async findAll() {
    return database.collection("orders")
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
  }
}

module.exports = Order;
