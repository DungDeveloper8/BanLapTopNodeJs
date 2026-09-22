const CartSession = require("../../model/CartSession");

function remove(req, res) {
  const id = Number(req.params.id);

  if (Number.isInteger(id) && id > 0) {
    CartSession.remove(req, id);
  }

  return res.redirect("/cart");
}

module.exports = {
  remove,
};
