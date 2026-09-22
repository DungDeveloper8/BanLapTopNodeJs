const session = require("express-session");

const sessionMiddleware = session({
  name: "laptop.sid",
  secret: "laptop-store",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});

module.exports = sessionMiddleware;
