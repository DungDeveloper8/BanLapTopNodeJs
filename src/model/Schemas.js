const { mongoose } = require("../config/database");
const { Schema } = mongoose;
const options = { collection: undefined, strict: false, versionKey: false, autoIndex: false };

const userSchema = new Schema({
  id: { type: Number, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, select: false },
  is_admin: { type: Boolean, required: true, default: false },
  full_name: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  coin: { type: Number, default: 0 },
  total_coin: { type: Number, default: 0 },
  liked_product_ids: { type: [Number], default: [] },
  created_at: Date,
  updated_at: Date,
}, { ...options, collection: "users" });

const productSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, enum: ["Phụ kiện", "Điện thoại", "Tai nghe", "Sạc", "Ốp lưng", "Pin dự phòng"], required: true },
  price: { type: Number, min: 0, required: true },
  ram_gb: { type: Number, default: null },
  storage_gb: { type: Number, default: null },
  stock: { type: Number, min: 0, required: true },
  is_active: { type: Boolean, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  like_count: { type: Number, default: 0 },
  created_at: Date,
  updated_at: Date,
}, { ...options, collection: "products" });

const orderSchema = new Schema({
  id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: [Schema.Types.Mixed], required: true },
  total_price: { type: Number, min: 0, required: true },
  order_status: { type: String, enum: ["LEGACY", "NEW", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"], required: true },
  payment_method: { type: String, enum: ["COD", "COIN", "UNKNOWN"], required: true },
  payment_status: { type: String, enum: ["UNKNOWN", "UNPAID", "PAID", "REFUNDED"], required: true },
  checkout_key: String,
  created_at: Date,
  updated_at: Date,
}, { ...options, collection: "orders" });

const reviewSchema = new Schema({
  id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  order_id: { type: Number, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 5000 },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], required: true },
  created_at: Date,
  updated_at: Date,
}, { ...options, collection: "product_reviews" });

module.exports = {
  UserDoc: mongoose.models.BKUser || mongoose.model("BKUser", userSchema),
  ProductDoc: mongoose.models.BKProduct || mongoose.model("BKProduct", productSchema),
  OrderDoc: mongoose.models.BKOrder || mongoose.model("BKOrder", orderSchema),
  ReviewDoc: mongoose.models.BKReview || mongoose.model("BKReview", reviewSchema),
};
