import { useEffect, useState } from "react";
import ProductCard from "../../components/layout/ProductCard";
import { getProducts } from "../../api/productsApi";

function TopRecipesSection() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await getProducts();

        if (response && response.success && Array.isArray(response.data)) {
          // Map backend schema keys to frontend expected keys
          const mapped = response.data.map((p) => ({
            id: p._id,
            title: p.title,
            description: p.description,
            price: p.price,
            image: p.imageUrl,
            tag: p.tags && p.tags[0] ? p.tags[0] : null,
            rating: p.rating || 4.8,
          }));
          setRecipes(mapped);
        } else {
          throw new Error("Failed to load products");
        }
      } catch (err) {
        console.error("Error fetching recipes from backend:", err);
        setError("Failed to fetch recipes from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <section className="bg-bg text-text px-4 py-10 sm:px-6 md:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-text">
              Top Recipes of the Month
            </h2>
            <p className="font-sans text-xs sm:text-sm text-text-light max-w-md">
              Curated by our bakers based on love, orders, and pure chocolate
              cravings.
            </p>
          </div>
          <span className="text-[0.7rem] sm:text-xs font-medium text-text-light bg-surface border border-border px-3 py-1 rounded-full self-start">
            Updated weekly · Chef&apos;s picks
          </span>
        </div>

        {/* ⭐Horizontal Scroll Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20 w-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-text-light py-10 border border-dashed border-border rounded-[var(--radius-card)] bg-surface text-sm">
            {error}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center text-text-light py-10 border border-dashed border-border rounded-[var(--radius-card)] bg-surface text-sm">
            No recipes available.
          </div>
        ) : (
          <div
            className="flex w-full overflow-x-auto gap-4 pb-3
                snap-x snap-mandatory scrollbar-none"
          >
            {recipes.map((item) => (
              <div
                key={item.id}
                className="snap-center flex-shrink-0 w-[260px] sm:w-[280px]"
              >
                <ProductCard {...item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TopRecipesSection;
