const Product = require("../../model/Product");
const { database } = require("../../config/database");

async function index(req, res, next) {
  try {
    const { products, pagination } = await Product.search(req.query);
    const allBrands = await database.collection("products").distinct("brand", {
      is_active: { $ne: false },
    });
    const selectedBrand = String(req.query.brand || "").toLocaleLowerCase("vi");
    const brands = allBrands
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi"))
      .map((name) => ({
      name,
      selected: String(name).toLocaleLowerCase("vi") === selectedBrand,
    }));
    const makeLink = (page) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== "page" && typeof value === "string" && value) {
          params.set(key, value);
        }
      }
      params.set("page", String(page));
      return `/?${params.toString()}`;
    };
    const filters = {
      q: req.query.q || "",
      minPrice: req.query.minPrice || "",
      maxPrice: req.query.maxPrice || "",
      ram_gb: req.query.ram_gb || "",
      storage_gb: req.query.storage_gb || "",
      brands,
      phone: req.query.category === "Điện thoại",
      accessory: req.query.category === "Phụ kiện",
      priceAsc: req.query.sort === "price",
      priceDesc: req.query.sort === "-price",
      newFirst: !req.query.sort || req.query.sort === "-created_at",
    };
    return res.render("home", {
      title: "Trang chủ",
      products,
      filters,
      pagination: {
        ...pagination,
        totalPages: Math.max(1, pagination.totalPages),
      },
      hasPrevious: pagination.page > 1,
      hasNext: pagination.page < pagination.totalPages,
      previousUrl: makeLink(pagination.page - 1),
      nextUrl: makeLink(pagination.page + 1),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { index };
