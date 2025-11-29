import * as productService from "../services/products.service.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await productService.getProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

export const getSingleProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const product = await productService.getSingleProduct(productId);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};




// INJECTIONS //

const injections = [
    {
    id: 1,
    title: "Hazelnut Crunch Chocolates",
    description: "Rich cocoa shells with roasted hazelnut center.",
    price: 399,
    tag: "Top Recipe",
    image: "https://images.pexels.com/photos/4109992/pexels-photo-4109992.jpeg",
  },
  {
    id: 2,
    title: "Classic Fudge Brownies",
    description: "Gooey center, crispy top – baked fresh daily.",
    price: 349,
    tag: "Best Seller",
    image: "https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg",
  },
  {
    id: 3,
    title: "Almond Rocher Bites",
    description: "Roasted almonds wrapped in silky chocolate.",
    price: 429,
    tag: "New",
    image: "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
  },
  {
    id: 4,
    title: "Strawberry Truffle Box",
    description: "Soft strawberry ganache in dark chocolate shell.",
    price: 459,
    image: "https://images.pexels.com/photos/918328/pexels-photo-918328.jpeg",
  },
  {
    id: 5,
    title: "Caramel Filled Bites",
    description: "Slow-cooked caramel in milk chocolate.",
    price: 379,
    image: "https://images.pexels.com/photos/6062042/pexels-photo-6062042.jpeg",
  },
  {
    id: 6,
    title: "Mumma’s Signature Box",
    description: "Assorted favourites curated by mumma.",
    price: 699,
    tag: "Limited",
    image: "https://images.pexels.com/photos/4110000/pexels-photo-4110000.jpeg",
  },
  {
    id: 7,
    title: "Roasted Coffee Truffles",
    description: "For coffee lovers – deep and intense.",
    price: 449,
    image: "https://images.pexels.com/photos/461430/pexels-photo-461430.jpeg",
  },
  {
    id: 8,
    title: "Pistachio Delight Squares",
    description: "Pistachio, white chocolate & love.",
    price: 429,
    image: "https://images.pexels.com/photos/4109994/pexels-photo-4109994.jpeg",
  },
  {
    id: 9,
    title: "Almond Florentine Crisps",
    description: "Thin crispy almond caramel cookies.",
    price: 389,
    image: "https://images.pexels.com/photos/8275138/pexels-photo-8275138.jpeg",
  },
  {
    id: 10,
    title: "Midnight Dark Collection",
    description: "70% dark, intense, no compromise on flavour.",
    price: 499,
    image: "https://images.pexels.com/photos/461431/pexels-photo-461431.jpeg",
  },
]