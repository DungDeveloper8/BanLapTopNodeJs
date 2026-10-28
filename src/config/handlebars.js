const path = require("path");
const { engine } = require("express-handlebars");
const formatCurrency = require("../helper/formatCurrency");
const currentYear = require("../helper/currentYear");

function orderStatus(status) {
  const labels = {
    NEW: "Đang xét duyệt",
    CONFIRMED: "Đang xét duyệt",
    SHIPPING: "Đang giao",
    COMPLETED: "Thành công",
    CANCELLED: "Đã hủy",
    LEGACY: "Đơn hàng cũ",
  };

  return labels[status] || "Không xác định";
}

function orderStatusClass(status) {
  const classes = {
    NEW: "status-pending",
    CONFIRMED: "status-pending",
    SHIPPING: "status-shipping",
    COMPLETED: "status-completed",
    CANCELLED: "status-cancelled",
    LEGACY: "status-pending",
  };

  return classes[status] || "status-pending";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function configureHandlebars(app) {
  const viewsPath = path.join(__dirname, "../view");

  app.engine(
    "hbs",
    engine({
      extname: ".hbs",
      defaultLayout: "main",
      layoutsDir: path.join(viewsPath, "layouts"),
      partialsDir: path.join(viewsPath, "partials"),
      helpers: {
        formatCurrency,
        currentYear,
        orderStatus,
        orderStatusClass,
        formatDate,
      },
    }),
  );

  app.set("view engine", "hbs");
  app.set("views", viewsPath);
}

module.exports = configureHandlebars;
