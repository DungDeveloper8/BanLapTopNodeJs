const authRouter = require("./auth");
const productRouter = require("./product");
const cartRouter = require("./cart");
const orderRouter = require("./order");
const adminRouter = require("./admin");

function route(app) {
  app.use("/api/v1", require("../api"));
  app.use(authRouter);
  app.use(productRouter);
  app.use(cartRouter);
  app.use(orderRouter);
  app.use(adminRouter);
}

module.exports = route;
