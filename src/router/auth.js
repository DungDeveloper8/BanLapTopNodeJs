const express = require("express");
const login = require("../controller/auth/LoginController");
const register = require("../controller/auth/RegisterController");
const logout = require("../controller/auth/LogoutController");

const router = express.Router();

router.get("/login", login.show);
router.post("/login", login.login);
router.get("/register", register.show);
router.post("/register", register.register);
router.post("/logout", logout.logout);

module.exports = router;
