const { database, nextId } = require("../config/database");
const { ProductDoc } = require("./Schemas");

class Product {
  static async findAll({ includeInactive = false } = {}) {
    const filter = includeInactive ? {} : { is_active: { $ne: false } };
    return database.collection("products").find(filter).sort({ id: -1 }).toArray();
  }

  static async findById(id, { includeInactive = false } = {}) {
    const productId = Number(id);
    if (!Number.isSafeInteger(productId) || productId < 1) {
      return null;
    }
    const filter = { id: productId };
    if (!includeInactive) {
      filter.is_active = { $ne: false };
    }
    return database.collection("products").findOne(filter);
  }

  static async findByIds(ids) {
    const productIds = ids.map(Number).filter((id) => {
      return Number.isSafeInteger(id) && id > 0;
    });
    if (!productIds.length) {
      return [];
    }
    return database.collection("products").find({
      id: { $in: productIds },
      is_active: { $ne: false },
    }).toArray();
  }

  static parseForm(body) {
    const text = (value) => String(value ?? "").trim();
    const positiveInteger = (value) => {
      const input = text(value);
      if (!input)
        return null;
      const number = Number(input);
      return Number.isSafeInteger(number) && number > 0 ? number : NaN;
    };
    const enteredCategory = text(body.category);
    const accessoryCategories = ["Tai nghe", "Sạc", "Ốp lưng", "Pin dự phòng"];
    const category = accessoryCategories.includes(enteredCategory)
      ? "Phụ kiện"
      : enteredCategory;
    const isPhone = category === "Điện thoại";
    const isAccessory = category === "Phụ kiện";
    const product = {
      name: text(body.name),
      brand: text(body.brand),
      category,
      price: text(body.price) ? Number(body.price) : NaN,
      stock: text(body.stock) ? Number(body.stock) : NaN,
      ram_gb: isAccessory ? null : positiveInteger(body.ram_gb),
      storage_gb: isAccessory ? null : positiveInteger(body.storage_gb),
      image: text(body.image),
      description: text(body.description),
      isPhone,
      isAccessory,
    };
    let error = null;
    if (!product.name || !product.brand || (!isPhone && !isAccessory)) {
      error = "Vui lòng nhập tên, hãng và chọn loại sản phẩm hợp lệ.";
    }
    else if (product.name.length > 255 ||
      product.brand.length > 100 ||
      product.image.length > 2048) {
      error = "Thông tin sản phẩm vượt quá độ dài cho phép.";
    }
    else if (!Number.isSafeInteger(product.price) || product.price < 0) {
      error = "Giá sản phẩm phải là số nguyên không âm.";
    }
    else if (!Number.isSafeInteger(product.stock) || product.stock < 0) {
      error = "Tồn kho phải là số nguyên không âm.";
    }
    else if (Number.isNaN(product.ram_gb) || Number.isNaN(product.storage_gb)) {
      error = "RAM và bộ nhớ phải là số nguyên dương.";
    }
    else if (isPhone && (product.ram_gb === null || product.storage_gb === null)) {
      error = "Điện thoại cần nhập RAM và dung lượng lưu trữ.";
    }
    return { product, error };
  }

  static async create(product) {
    const id = await nextId("products");
    const now = new Date();
    await ProductDoc.create({
      id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      ram_gb: product.ram_gb,
      storage_gb: product.storage_gb,
      image: product.image,
      description: product.description,
      like_count: 0,
      stock: product.stock,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    return id;
  }

  static async update(id, product) {
    return ProductDoc.updateOne({ id: Number(id) }, {
      $set: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        ram_gb: product.ram_gb,
        storage_gb: product.storage_gb,
        stock: product.stock,
        image: product.image,
        description: product.description,
        updated_at: new Date(),
      },
    }, { runValidators: true });
  }

  static async remove(id) {
    const result = await database.collection("products").updateOne(
      { id: Number(id), is_active: { $ne: false } },
      { $set: { is_active: false, updated_at: new Date() } },
    );
    return { deletedCount: result.modifiedCount };
  }

  static async search(input = {}) {
    const q = String(input.q || "").trim().slice(0, 100);
    const brand = String(input.brand || "").trim().slice(0, 100);
    const category = String(input.category || "").trim();
    const page = input.page === undefined ? 1 : Number(input.page);
    const limit = input.limit === undefined ? 12 : Number(input.limit);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      throw Object.assign(new Error("Phân trang không hợp lệ."), { status: 400 });
    }
    const filter = { is_active: { $ne: false } };
    if (q)
      filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (brand) {
      const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.brand = { $regex: `^${escaped}$`, $options: "i" };
    }
    if (category) {
      if (!["Điện thoại", "Phụ kiện"].includes(category))
        throw Object.assign(new Error("Loại sản phẩm không hợp lệ."), { status: 400 });
      filter.category = category === "Phụ kiện"
        ? { $in: ["Phụ kiện", "Tai nghe", "Sạc", "Ốp lưng", "Pin dự phòng"] }
        : category;
    }
    for (const [key, field] of [["ram_gb", "ram_gb"], ["storage_gb", "storage_gb"]]) {
      if (input[key] !== undefined && input[key] !== "") {
        const value = Number(input[key]);
        if (!Number.isSafeInteger(value) || value < 1)
          throw Object.assign(new Error("Bộ lọc cấu hình không hợp lệ."), { status: 400 });
        filter[field] = value;
      }
    }
    const price = {};
    for (const [key, operator] of [["minPrice", "$gte"], ["maxPrice", "$lte"]]) {
      if (input[key] !== undefined && input[key] !== "") {
        const value = Number(input[key]);
        if (!Number.isSafeInteger(value) || value < 0)
          throw Object.assign(new Error("Bộ lọc giá không hợp lệ."), { status: 400 });
        price[operator] = value;
      }
    }
    if (price.$gte !== undefined && price.$lte !== undefined && price.$gte > price.$lte) {
      throw Object.assign(new Error("Khoảng giá không hợp lệ."), { status: 400 });
    }
    if (Object.keys(price).length)
      filter.price = price;
    const sortMap = {
      price: { price: 1, id: 1 },
      "-price": { price: -1, id: -1 },
      name: { name: 1, id: 1 },
      "-name": { name: -1, id: -1 },
      "-created_at": { created_at: -1, id: -1 },
    };
    const sort = input.sort === undefined || input.sort === "" ? "-created_at" : String(input.sort);
    if (!sortMap[sort])
      throw Object.assign(new Error("Sắp xếp không hợp lệ."), { status: 400 });
    const collection = database.collection("products");
    const [total, products] = await Promise.all([
      collection.countDocuments(filter),
      collection.find(filter).sort(sortMap[sort]).skip((page - 1) * limit).limit(limit).toArray(),
    ]);
    return { products, pagination: { page, limit, totalItems: total, totalPages: Math.ceil(total / limit) } };
  }
}

module.exports = Product;
