const { scrypt, timingSafeEqual } = require("crypto");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const { database, nextId } = require("../config/database");
const { UserDoc } = require("./Schemas");

const deriveKey = promisify(scrypt);

class User {
  static async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !(await this.verifyPassword(password, user.password))) return null;
    if (user.password.startsWith("scrypt:")) {
      const updated = await bcrypt.hash(password, 12);
      await database.collection("users").updateOne(
        { _id: user._id, password: user.password },
        { $set: { password: updated, updated_at: new Date() } },
      );
    }
    return user;
  }

  static async findByEmail(email) {
    return database.collection("users").findOne(
      { email: String(email).trim().toLowerCase() },
      { collation: { locale: "en", strength: 2 } },
    );
  }

  static async findByUsername(username) {
    return database.collection("users").findOne(
      { username: String(username).trim() },
      { collation: { locale: "en", strength: 2 } },
    );
  }

  static async verifyPassword(password, encoded) {
    if (typeof encoded !== "string") {
      return false;
    }

    if (encoded.startsWith("$2a$") || encoded.startsWith("$2b$") || encoded.startsWith("$2y$")) {
      return bcrypt.compare(password, encoded);
    }

    const parts = encoded.split(":");
    if (
      parts.length !== 3 ||
      parts[0] !== "scrypt" ||
      !/^[a-f0-9]{32}$/i.test(parts[1]) ||
      !/^[a-f0-9]{128}$/i.test(parts[2])
    ) {
      return false;
    }

    try {
      const expected = Buffer.from(parts[2], "hex");
      const actual = await deriveKey(password, parts[1], expected.length);
      return timingSafeEqual(actual, expected);
    } catch (_) {
      return false;
    }
  }

  static async create(username, email, password) {
    const id = await nextId("users");
    const hash = await bcrypt.hash(password, 12);
    const now = new Date();

    await UserDoc.create({
      id,
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      password: hash,
      is_admin: false,
      full_name: String(username).trim(),
      phone: "",
      address: "",
      coin: 0,
      total_coin: 0,
      liked_product_ids: [],
      created_at: now,
      updated_at: now,
    });

    return id;
  }
}

module.exports = User;
