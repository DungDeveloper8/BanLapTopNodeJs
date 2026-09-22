const { database } = require("../config/database");

class User {
  static async findByEmail(email) {
    return database.collection("users").findOne({
      email: String(email).trim().toLowerCase(),
    });
  }

  static async findByUsername(username) {
    return database.collection("users").findOne({
      username: String(username).trim(),
    });
  }

  static async create(username, email, password) {
    const lastUser = await database
      .collection("users")
      .find()
      .sort({ id: -1 })
      .limit(1)
      .next();

    let id = 1;

    if (lastUser) {
      id = Number(lastUser.id) + 1;
    }

    await database.collection("users").insertOne({
      id,
      username,
      email: String(email).trim().toLowerCase(),
      password,
      is_admin: false,
    });

    return id;
  }
}

module.exports = User;
