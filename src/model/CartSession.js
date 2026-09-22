class CartSession {
  static get(req) {
    if (!Array.isArray(req.session.cart)) {
      req.session.cart = [];
    }

    return req.session.cart;
  }

  static add(req, productId) {
    const cart = this.get(req);
    const item = cart.find((row) => row.product_id === productId);

    if (item) {
      item.quantity += 1;
    } else {
      cart.push({
        product_id: productId,
        quantity: 1,
      });
    }
  }

  static update(req, productId, quantity) {
    const cart = this.get(req);
    const item = cart.find((row) => row.product_id === productId);

    if (item) {
      item.quantity = quantity;
    }
  }

  static remove(req, productId) {
    const cart = this.get(req);

    req.session.cart = cart.filter((item) => {
      return item.product_id !== productId;
    });
  }

  static clear(req) {
    req.session.cart = [];
  }

  static count(req) {
    if (!Array.isArray(req.session.cart)) {
      return 0;
    }

    return req.session.cart.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }
}

module.exports = CartSession;
