const path = require("path");
const { engine } = require("express-handlebars");
const formatCurrency = require("../helper/formatCurrency");
const currentYear = require("../helper/currentYear");

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
      },
    }),
  );

  app.set("view engine", "hbs");
  app.set("views", viewsPath);
}

module.exports = configureHandlebars;
