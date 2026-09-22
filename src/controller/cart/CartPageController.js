const CartDetails = require("../../model/CartDetails");

async function index(req, res, next) {
  try {
    const cart = await CartDetails.get(req);

    return res.render("cart/index", {
      title: "Giỏ hàng",
      ...cart,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  index,
};
