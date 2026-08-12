import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, default: 1, min: 1 },
        lineTotal: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.pre("save", async function () {
  let subtotal = 0;
  let totalItems = 0;

  if (this.products && this.products.length > 0) {
    const unpopulatedIds = [];

    for (const item of this.products) {
      if (!item.product) continue;
      if (typeof item.product === "object" && item.product.price !== undefined) {
        const itemPrice = Number(item.product.price) || 0;
        item.lineTotal = itemPrice * item.quantity;
        subtotal += item.lineTotal;
        totalItems += item.quantity;
      } else {
        unpopulatedIds.push(item.product);
      }
    }

    if (unpopulatedIds.length > 0) {
      const Product = mongoose.model("Product");
      const fetchedProducts = await Product.find({ _id: { $in: unpopulatedIds } }).select("price");
      const priceMap = new Map(fetchedProducts.map((p) => [p._id.toString(), p.price]));

      for (const item of this.products) {
        if (item.product && (typeof item.product !== "object" || item.product.price === undefined)) {
          const prodIdStr = item.product.toString();
          const price = priceMap.get(prodIdStr) || 0;
          item.lineTotal = price * item.quantity;
          subtotal += item.lineTotal;
          totalItems += item.quantity;
        }
      }
    }
  }

  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const deliveryFee = subtotal > 0 ? (subtotal >= 1000 ? 0 : 49) : 0;
  const grandTotal = Math.round((subtotal + gst + deliveryFee) * 100) / 100;

  this.subtotal = subtotal;
  this.gst = gst;
  this.deliveryFee = deliveryFee;
  this.total = grandTotal;
  this.grandTotal = grandTotal;
  this.totalItems = totalItems;
});

cartSchema.index({ user: 1 }, { unique: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;