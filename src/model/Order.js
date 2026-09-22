const { database } = require("../config/database");

class Order {
  static async create(userId, customerName, phone, address, items) {
    const lastOrder = await database
      .collection("orders")
      .find()
      .sort({ id: -1 })
      .limit(1)
      .next();

    let id = 1;

    if (lastOrder) {
      id = Number(lastOrder.id) + 1;
    }

    const orderItems = items.map((item) => {
      return {
        product_id: Number(item.id),
        product_name: item.name,
        product_price: Number(item.price),
        product_image: item.image || null,
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
      };
    });

    const totalPrice = orderItems.reduce((total, item) => {
      return total + item.subtotal;
    }, 0);

    await database.collection("orders").insertOne({
      id,
      user_id: Number(userId),
      customer_name: customerName,
      phone,
      address,
      items: orderItems,
      total_price: totalPrice,
    });

    return id;
  }
}

module.exports = Order;
