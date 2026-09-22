const { database } = require("../config/database");

class Product {
  static async findAll() {
    return database
      .collection("products")
      .find()
      .sort({ id: -1 })
      .toArray();
  }

  static async findById(id) {
    return database.collection("products").findOne({
      id: Number(id),
    });
  }

  static async findByIds(ids) {
    const productIds = ids.map(Number).filter((id) => {
      return Number.isInteger(id) && id > 0;
    });

    if (!productIds.length) {
      return [];
    }

    return database
      .collection("products")
      .find({
        id: {
          $in: productIds,
        },
      })
      .toArray();
  }

  static async create(product) {
    const lastProduct = await database
      .collection("products")
      .find()
      .sort({ id: -1 })
      .limit(1)
      .next();

    let id = 1;

    if (lastProduct) {
      id = Number(lastProduct.id) + 1;
    }

    await database.collection("products").insertOne({
      id,
      name: product.name,
      brand: product.brand,
      price: Number(product.price),
      image: product.image || null,
      description: product.description || null,
    });

    return id;
  }

  static async update(id, product) {
    return database.collection("products").updateOne(
      {
        id: Number(id),
      },
      {
        $set: {
          name: product.name,
          brand: product.brand,
          price: Number(product.price),
          image: product.image || null,
          description: product.description || null,
        },
      },
    );
  }

  static async delete(id) {
    return database.collection("products").deleteOne({
      id: Number(id),
    });
  }
}

module.exports = Product;
