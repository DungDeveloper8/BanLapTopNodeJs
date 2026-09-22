function success(req, res) {
  if (!req.session.lastOrderId) {
    return res.redirect("/");
  }

  const orderId = req.session.lastOrderId;

  delete req.session.lastOrderId;

  return res.render("orders/success", {
    title: "Đặt hàng thành công",
    orderId,
  });
}

module.exports = {
  success,
};
