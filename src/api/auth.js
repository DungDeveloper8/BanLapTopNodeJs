const express = require("express");
const User = require("../model/User");
const { database } = require("../config/database");
const {
  asyncHandler,
  sendSuccess,
  throwApiError,
  protect,
  createToken,
} = require("./common");

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    is_admin: Boolean(user.is_admin),
    full_name: user.full_name,
    phone: user.phone,
    address: user.address,
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    const invalidUsername = username.length < 3 || username.length > 50;
    const invalidEmail =
      email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const invalidPassword = password.length < 8 || password.length > 128;

    if (invalidUsername || invalidEmail || invalidPassword) {
      throwApiError(400, "Thông tin đăng ký không hợp lệ.", "INVALID_REGISTER");
    }

    const emailExists = await User.findByEmail(email);
    const usernameExists = await User.findByUsername(username);

    if (emailExists || usernameExists) {
      throwApiError(409, "Tài khoản đã tồn tại.", "DUPLICATE_USER");
    }

    const userId = await User.create(username, email, password);
    const user = await database.collection("users").findOne({ id: userId });

    return sendSuccess(
      res,
      {
        user: toPublicUser(user),
        token: createToken(user),
      },
      201,
    );
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      throwApiError(400, "Vui lòng nhập email và mật khẩu.", "INVALID_LOGIN");
    }

    const user = await User.authenticate(email, password);

    if (!user) {
      throwApiError(
        401,
        "Email hoặc mật khẩu không đúng.",
        "INVALID_CREDENTIALS",
      );
    }

    return sendSuccess(res, {
      user: toPublicUser(user),
      token: createToken(user),
    });
  }),
);

router.get(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const user = await database.collection("users").findOne({
      id: req.apiUser.id,
    });

    return sendSuccess(res, toPublicUser(user));
  }),
);

router.patch(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const editableFields = ["full_name", "phone", "address"];
    const updates = {};

    for (const field of editableFields) {
      if (req.body[field] === undefined) {
        continue;
      }

      if (typeof req.body[field] !== "string" || req.body[field].length > 255) {
        throwApiError(400, "Thông tin cá nhân không hợp lệ.");
      }

      updates[field] = req.body[field].trim();
    }

    if (!Object.keys(updates).length) {
      throwApiError(400, "Không có thông tin cần sửa.");
    }

    updates.updated_at = new Date();

    await database
      .collection("users")
      .updateOne({ id: req.apiUser.id }, { $set: updates });

    const user = await database.collection("users").findOne({
      id: req.apiUser.id,
    });

    return sendSuccess(res, toPublicUser(user));
  }),
);

router.delete(
  "/me",
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.apiUser.id;

    if (req.apiUser.is_admin) {
      throwApiError(403, "Không thể xóa tài khoản quản trị.");
    }

    const [orderCount, reviewCount, historyCount, paymentCount] =
      await Promise.all([
        database.collection("orders").countDocuments({ user_id: userId }),
        database
          .collection("product_reviews")
          .countDocuments({ user_id: userId }),
        database
          .collection("payment_history")
          .countDocuments({ user_id: userId }),
        database.collection("payments").countDocuments({ user_id: userId }),
      ]);

    if (orderCount || reviewCount || historyCount || paymentCount) {
      throwApiError(
        409,
        "Tài khoản có lịch sử giao dịch, không thể xóa.",
        "USER_HAS_HISTORY",
      );
    }

    await database.collection("users").deleteOne({ id: userId });
    return res.status(204).end();
  }),
);

module.exports = router;
