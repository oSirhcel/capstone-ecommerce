import { cents, generateSKU, randomFloat, randomInt } from "./utils";
import { imageUrls } from "./image-urls";

export interface ProductSeed {
  name: string;
  sku: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPerItem: number;
  stock: number;
  trackQuantity: boolean;
  allowBackorders: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  status: "Active" | "Inactive" | "Draft" | "Archived";
  featured: boolean;
  categoryName: string;
  tags: string[];
  images: Array<{
    imageUrl: string;
    altText: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
}

// Adjectives to make products unique
const adjectives = [
  "Premium",
  "Deluxe",
  "Professional",
  "Compact",
  "Ultra",
  "Smart",
  "Wireless",
  "Advanced",
  "Essential",
  "Eco",
  "Eco-Friendly",
  "Lightweight",
  "Heavy-Duty",
  "Portable",
  "Elegant",
  "Modern",
  "Classic",
  "Vintage",
  "Professional",
  "Budget",
  "High-Performance",
  "Energy-Efficient",
  "Durable",
  "Flexible",
  "Waterproof",
  "Weatherproof",
  "Ergonomic",
  "Ergonomic",
  "Stylish",
  "Sleek",
];

// Electronics products
const electronicsTemplates = [
  {
    base: "Wireless Earbuds",
    variants: ["Pro", "Ultra", "Plus", "Max", "Elite", "Sport", "Studio"],
    descriptions: [
      "noise-cancelling Bluetooth earbuds with wireless charging",
      "premium audio earbuds with active noise cancellation",
      "high-fidelity wireless earbuds with long battery life",
    ],
    priceRange: [59.99, 149.99],
    tags: ["wireless", "bluetooth", "earbuds", "noise-cancelling", "premium"],
  },
  {
    base: "Smart Watch",
    variants: ["Sport", "Classic", "Pro", "Fitness", "Health", "Ultra", "Lite"],
    descriptions: [
      "fitness tracking smartwatch with heart rate monitor",
      "premium smartwatch with GPS and health monitoring",
      "stylish smartwatch with notifications and activity tracking",
    ],
    priceRange: [199.99, 499.99],
    tags: ["smartwatch", "fitness", "bluetooth", "waterproof", "health"],
  },
  {
    base: "USB-C",
    variants: [
      "Fast Charger",
      "Power Bank",
      "Hub",
      "Cable",
      "Adapter",
      "Dock",
      "Stand",
    ],
    descriptions: [
      "high-speed USB-C charging solution with power delivery",
      "versatile USB-C accessory with multiple ports",
      "reliable USB-C connectivity for all devices",
    ],
    priceRange: [19.99, 89.99],
    tags: ["usb-c", "charger", "fast-charging", "portable", "premium"],
  },
  {
    base: "Bluetooth Speaker",
    variants: [
      "Portable",
      "Mini",
      "Waterproof",
      "Studio",
      "Party",
      "Outdoor",
      "Travel",
    ],
    descriptions: [
      "powerful Bluetooth speaker with deep bass",
      "compact wireless speaker with impressive sound quality",
      "premium audio speaker with extended battery life",
    ],
    priceRange: [39.99, 199.99],
    tags: ["speaker", "bluetooth", "portable", "waterproof", "premium"],
  },
  {
    base: "Smart Home",
    variants: [
      "Hub",
      "Camera",
      "Light",
      "Plug",
      "Sensor",
      "Thermostat",
      "Display",
    ],
    descriptions: [
      "intelligent home automation device with voice control",
      "smart home accessory with app control",
      "connected home device with energy monitoring",
    ],
    priceRange: [29.99, 159.99],
    tags: ["smart-home", "automation", "wireless", "app-controlled"],
  },
];

// Clothing templates
const clothingTemplates = [
  {
    base: "Cotton T-Shirt",
    variants: [
      "Classic",
      "Organic",
      "Premium",
      "Vintage",
      "Fitted",
      "Oversized",
      "V-Neck",
    ],
    descriptions: [
      "soft cotton t-shirt made from sustainable materials",
      "comfortable everyday t-shirt with modern fit",
      "high-quality cotton tee perfect for any occasion",
    ],
    priceRange: [19.99, 49.99],
    tags: ["cotton", "t-shirt", "casual", "sustainable", "comfortable"],
  },
  {
    base: "Hoodie",
    variants: [
      "Classic",
      "Zip-Up",
      "Pullover",
      "Fleece",
      "Tech",
      "Oversized",
      "Lightweight",
    ],
    descriptions: [
      "cozy hoodie with soft fleece lining",
      "premium hoodie with modern design and comfort",
      "stylish hoodie perfect for casual wear",
    ],
    priceRange: [39.99, 99.99],
    tags: ["hoodie", "casual", "cotton", "comfortable", "winter"],
  },
  {
    base: "Jeans",
    variants: [
      "Slim Fit",
      "Regular",
      "Relaxed",
      "Skinny",
      "Straight",
      "Bootcut",
      "Tapered",
    ],
    descriptions: [
      "premium denim jeans with perfect fit",
      "comfortable jeans for everyday wear",
      "stylish jeans with modern cut",
    ],
    priceRange: [59.99, 149.99],
    tags: ["jeans", "denim", "casual", "comfortable", "fashion"],
  },
];

// Home & Living templates
const homeTemplates = [
  {
    base: "Ceramic Vase",
    variants: [
      "Minimalist",
      "Modern",
      "Rustic",
      "Decorative",
      "Artisan",
      "Contemporary",
      "Bohemian",
    ],
    descriptions: [
      "hand-crafted ceramic vase with elegant design",
      "beautiful ceramic vase perfect for any interior",
      "artisan ceramic vase with unique character",
    ],
    priceRange: [24.99, 89.99],
    tags: ["ceramic", "vase", "handmade", "decor", "minimalist"],
  },
  {
    base: "Storage Basket",
    variants: [
      "Woven",
      "Seagrass",
      "Wire",
      "Fabric",
      "Rattan",
      "Natural",
      "Eco",
    ],
    descriptions: [
      "eco-friendly storage basket handwoven from natural materials",
      "versatile storage basket for home organization",
      "stylish storage solution with practical design",
    ],
    priceRange: [19.99, 69.99],
    tags: ["basket", "storage", "handmade", "eco-friendly", "organization"],
  },
  {
    base: "Throw Pillow",
    variants: [
      "Velvet",
      "Linen",
      "Cotton",
      "Knitted",
      "Decorative",
      "Silk",
      "Textured",
    ],
    descriptions: [
      "soft decorative pillow with premium fabric",
      "comfortable throw pillow perfect for any room",
      "stylish cushion with modern design",
    ],
    priceRange: [24.99, 59.99],
    tags: ["pillow", "cushion", "decor", "home", "comfortable"],
  },
];

// Beauty templates
const beautyTemplates = [
  {
    base: "Face Serum",
    variants: [
      "Hydrating",
      "Anti-Aging",
      "Vitamin C",
      "Brightening",
      "Nourishing",
      "Revitalizing",
      "Purifying",
    ],
    descriptions: [
      "lightweight face serum with powerful ingredients",
      "premium skincare serum for glowing skin",
      "effective face serum with natural extracts",
    ],
    priceRange: [24.99, 79.99],
    tags: ["serum", "skincare", "natural", "anti-aging", "hydrating"],
  },
  {
    base: "Body Lotion",
    variants: [
      "Moisturizing",
      "Nourishing",
      "Scented",
      "Natural",
      "Luxury",
      "Intensive",
      "Daily",
    ],
    descriptions: [
      "rich body lotion with natural ingredients",
      "hydrating body moisturizer for smooth skin",
      "premium body lotion with lasting fragrance",
    ],
    priceRange: [14.99, 44.99],
    tags: ["lotion", "moisturizer", "natural", "skincare", "hydrating"],
  },
];

// Sports templates
const sportsTemplates = [
  {
    base: "Yoga Mat",
    variants: [
      "Premium",
      "Eco",
      "Travel",
      "Extra Thick",
      "Pro",
      "Beginner",
      "Portable",
    ],
    descriptions: [
      "non-slip yoga mat with excellent cushioning",
      "eco-friendly yoga mat made from sustainable materials",
      "professional yoga mat for all practice levels",
    ],
    priceRange: [29.99, 89.99],
    tags: ["yoga", "fitness", "eco-friendly", "non-slip", "exercise"],
  },
  {
    base: "Water Bottle",
    variants: [
      "Insulated",
      "Steel",
      "Sport",
      "Filtered",
      "Collapsible",
      "Thermal",
      "Smart",
    ],
    descriptions: [
      "durable water bottle with temperature control",
      "eco-friendly water bottle for active lifestyles",
      "high-performance hydration bottle",
    ],
    priceRange: [19.99, 59.99],
    tags: ["water-bottle", "sports", "eco-friendly", "durable", "hydration"],
  },
];

// Books templates
const booksTemplates = [
  {
    base: "Programming Guide",
    variants: [
      "Fundamentals",
      "Advanced",
      "Python",
      "JavaScript",
      "Web Development",
      "Mobile",
      "Database",
    ],
    descriptions: [
      "comprehensive programming guide for developers",
      "practical coding book with real-world examples",
      "essential programming reference for learners",
    ],
    priceRange: [29.99, 79.99],
    tags: ["book", "programming", "education", "technology", "learning"],
  },
  {
    base: "Cookbook",
    variants: [
      "Healthy",
      "Quick",
      "Vegetarian",
      "Gourmet",
      "Family",
      "Budget",
      "Fusion",
    ],
    descriptions: [
      "inspiring cookbook with delicious recipes",
      "practical cooking guide for home chefs",
      "comprehensive recipe collection",
    ],
    priceRange: [24.99, 59.99],
    tags: ["book", "cooking", "recipes", "food", "lifestyle"],
  },
];

function generateProduct(
  template: (typeof electronicsTemplates)[0],
  variantIndex: number,
  categoryName: string,
  storePrefix: string,
  productIndex: number,
  useRealImages = false,
): ProductSeed {
  const variant = template.variants[variantIndex % template.variants.length];
  const adjective = adjectives[productIndex % adjectives.length];

  // Create unique product name with adjective + base + variant
  const name = `${adjective} ${template.base} ${variant}`;
  const description =
    template.descriptions[variantIndex % template.descriptions.length];

  const basePrice =
    template.priceRange[0] +
    Math.random() * (template.priceRange[1] - template.priceRange[0]);
  const price = cents(basePrice);
  const compareAtPrice =
    Math.random() > 0.6 ? cents(basePrice * 1.25) : undefined;
  const costPerItem = cents(basePrice * (0.4 + Math.random() * 0.2));

  const stock = randomInt(0, 200);
  const featured = Math.random() > 0.85;
  const status: "Active" | "Draft" = Math.random() > 0.95 ? "Draft" : "Active";

  // Generate unique slug with product index to guarantee uniqueness
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Always append product index to ensure global uniqueness across all stores
  const slug = `${baseSlug}-${productIndex}`.substring(0, 255);

  // Generate SEO title (max 60 chars)
  let seoTitle = `${adjective} ${variant}`;
  if (seoTitle.length > 60) {
    seoTitle = seoTitle.substring(0, 57) + "...";
  }

  // Generate SEO description (max 200 chars)
  let seoDescription = description;
  if (seoDescription.length > 200) {
    seoDescription = seoDescription.substring(0, 197) + "...";
  }

  // Generate 1-3 images
  const imageCount = randomInt(1, 3);
  const images = [];

  if (useRealImages && categoryName === "Electronics") {
    for (let i = 0; i < imageCount; i++) {
      const imgUrl = imageUrls.electronics[i % imageUrls.electronics.length];
      images.push({
        imageUrl: imgUrl,
        altText: `${name} - View ${i + 1}`,
        isPrimary: i === 0,
        displayOrder: i,
      });
    }
  } else if (useRealImages && categoryName === "Handmade") {
    for (let i = 0; i < imageCount; i++) {
      const imgUrl = imageUrls.handmade[i % imageUrls.handmade.length];
      images.push({
        imageUrl: imgUrl,
        altText: `${name} - View ${i + 1}`,
        isPrimary: i === 0,
        displayOrder: i,
      });
    }
  } else {
    for (let i = 0; i < imageCount; i++) {
      images.push({
        imageUrl: imageUrls.placeholder,
        altText: `${name} - View ${i + 1}`,
        isPrimary: i === 0,
        displayOrder: i,
      });
    }
  }

  return {
    name,
    sku: generateSKU(storePrefix, categoryName, productIndex),
    description: `${name} - ${description}. Perfect for everyday use.`,
    price,
    compareAtPrice,
    costPerItem,
    stock,
    trackQuantity: true,
    allowBackorders: stock < 10 && Math.random() > 0.5,
    weight: randomFloat(0.05, 2.5).toFixed(3),
    length: randomFloat(5, 50).toFixed(2),
    width: randomFloat(5, 30).toFixed(2),
    height: randomFloat(2, 20).toFixed(2),
    seoTitle,
    seoDescription,
    slug,
    status,
    featured,
    categoryName,
    tags: template.tags,
    images,
  };
}

export function generateProducts(
  storePrefix: string,
  categoryFocus: string[],
  count: number,
  globalProductIndex: { current: number }, // Pass in a mutable counter
): ProductSeed[] {
  const products: ProductSeed[] = [];

  const distribution = Math.floor(count / categoryFocus.length);

  for (const category of categoryFocus) {
    let templates: (typeof electronicsTemplates)[0][] = [];

    switch (category) {
      case "Electronics":
        templates = electronicsTemplates;
        break;
      case "Clothing":
        templates = clothingTemplates;
        break;
      case "Home & Living":
        templates = homeTemplates;
        break;
      case "Beauty & Personal Care":
        templates = beautyTemplates;
        break;
      case "Sports & Outdoors":
        templates = sportsTemplates;
        break;
      case "Books":
        templates = booksTemplates;
        break;
      case "Handmade":
        templates = homeTemplates;
        break;
      case "Accessories":
        templates = [...electronicsTemplates.slice(2, 4), ...homeTemplates];
        break;
      default:
        templates = electronicsTemplates;
    }

    for (let i = 0; i < distribution; i++) {
      const template = templates[i % templates.length];
      const useRealImages = globalProductIndex.current <= 20;
      products.push(
        generateProduct(
          template,
          i,
          category,
          storePrefix,
          globalProductIndex.current++,
          useRealImages,
        ),
      );
    }
  }

  return products;
}
