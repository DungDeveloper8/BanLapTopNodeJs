const CartSession = require("./CartSession");
const Product = require("./Product");

class CartDetails {
  static async get(req) {
    const cart = CartSession.get(req);

    if (!cart.length) {
      return {
        items: [],
        total: 0,
      };
    }

    const productIds = cart.map((item) => item.product_id);
    const products = await Product.findByIds(productIds);
    const productMap = new Map(
      products.map((product) => {
        return [Number(product.id), product];
      }),
    );
    const items = [];

    for (const cartItem of cart) {
      const product = productMap.get(Number(cartItem.product_id));
      const quantity = Number(cartItem.quantity);

      if (!product) {
        continue;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        continue;
      }

      items.push({
        ...product,
        quantity,
        subtotal: Number(product.price) * quantity,
      });
    }

    req.session.cart = items.map((item) => {
      return {
        product_id: Number(item.id),
        quantity: item.quantity,
      };
    });

    const total = items.reduce((sum, item) => {
      return sum + item.subtotal;
    }, 0);

    return {
      items,
      total,
    };
  }
}

module.exports = CartDetails;
