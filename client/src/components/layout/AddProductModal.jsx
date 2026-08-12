import { useEffect, useState } from "react";
import { X, Upload, Check } from "lucide-react";
import { getCategories, createProduct } from "../../api/productsApi";

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    tags: "",
    stock: "50",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCats = async () => {
        try {
          const res = await getCategories();
          if (res && res.success) {
            setCategories(res.data);
            if (res.data.length > 0) {
              setFormData((prev) => ({ ...prev, category: res.data[0]._id }));
            }
          }
        } catch (err) {
          console.error("Failed to load categories:", err);
        }
      };
      fetchCats();
      // Reset state
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select a product image.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("tags", formData.tags);
      data.append("stock", formData.stock);
      data.append("image", imageFile);

      await createProduct(data);

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: categories[0]?._id || "",
        tags: "",
        stock: "50",
      });
      setImageFile(null);
      setImagePreview("");
      if (onProductAdded) onProductAdded();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-[var(--radius-card)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg sm:text-xl text-text">
            Add New Recipe
          </h2>
          <button
            onClick={onClose}
            className="text-text-light hover:text-text p-1 rounded-lg hover:bg-bg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4" /> Recipe created and uploaded
              successfully!
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none transition-colors"
              placeholder="e.g. Hazelnut Milk Truffles"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none transition-colors resize-none"
              placeholder="Describe the flavors, center fillings, and texture..."
            />
          </div>

          {/* Row: Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none transition-colors"
                placeholder="399"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
                Stock
              </label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none transition-colors"
                placeholder="50"
              />
            </div>
          </div>

          {/* Row: Category & Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
                Category
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none transition-colors"
                placeholder="e.g. Best Seller, New"
              />
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-light uppercase tracking-wider">
              Product Image
            </label>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-4 bg-bg hover:border-primary transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {imagePreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium bg-surface/20 backdrop-blur px-3 py-1 rounded-full border border-white/20">
                      Change Image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="text-xs text-text-light">
                    <span className="font-semibold text-primary">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </div>
                  <div className="text-[0.65rem] text-text-light">
                    PNG, JPG, WEBP up to 5MB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border rounded-lg text-sm text-text hover:bg-bg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  Uploading...
                </>
              ) : (
                "Create Recipe"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
