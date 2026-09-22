const CartSession = require("../model/CartSession");

function shareViewData(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.cartCount = CartSession.count(req);
  res.locals.flash = req.session.flash || null;

  delete req.session.flash;

  next();
}

module.exports = shareViewData;
