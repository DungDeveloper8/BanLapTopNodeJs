const path = require("path");
const express = require("express");
const { connectDatabase } = require("./config/database");
const configureHandlebars = require("./config/handlebars");
const sessionMiddleware = require("./config/session");
const shareViewData = require("./middleware/shareViewData");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const route = require("./router");

const app = express();
const port = 3000;

configureHandlebars(app);

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);
app.use(shareViewData);

route(app);

app.use(notFound);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server đang chạy: http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Không thể khởi động ứng dụng:", error.message);
    process.exitCode = 1;
  });
