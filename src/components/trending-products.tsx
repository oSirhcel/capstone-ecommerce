import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product-card";

export function TrendingProducts() {
  const trendingProducts = {
    all: [
      {
        name: "Smart Home Assistant",
        price: 129.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Tech Innovations",
        category: "Electronics",
      },
      {
        name: "Sustainable Bamboo Cutlery Set",
        price: 24.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.9,
        store: "Eco Essentials",
        category: "Home & Living",
      },
      {
        name: "Productivity Planner",
        price: 19.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.7,
        store: "Organized Life",
        category: "Stationery",
      },
      {
        name: "Handcrafted Ceramic Planter",
        price: 34.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Artisan Crafts",
        category: "Home & Living",
      },
      {
        name: "Fitness Tracking Watch",
        price: 89.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.6,
        store: "Active Lifestyle",
        category: "Electronics",
      },
      {
        name: "Vegan Leather Backpack",
        price: 59.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.7,
        store: "Ethical Fashion",
        category: "Accessories",
      },
    ],
    digital: [
      {
        name: "Social Media Marketing Guide",
        price: 49.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Digital Academy",
        category: "Digital Products",
      },
      {
        name: "Productivity App Lifetime Access",
        price: 79.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.9,
        store: "Tech Solutions",
        category: "Digital Products",
      },
      {
        name: "Photography Presets Bundle",
        price: 29.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.7,
        store: "Creative Studio",
        category: "Digital Products",
      },
      {
        name: "Financial Planning Spreadsheet",
        price: 19.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.6,
        store: "Money Matters",
        category: "Digital Products",
      },
    ],
    handmade: [
      {
        name: "Hand-Knitted Wool Scarf",
        price: 45.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.9,
        store: "Cozy Crafts",
        category: "Handmade",
      },
      {
        name: "Artisanal Soap Collection",
        price: 32.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Natural Beauty",
        category: "Handmade",
      },
      {
        name: "Handcrafted Wooden Cutting Board",
        price: 54.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.7,
        store: "Woodworks",
        category: "Handmade",
      },
      {
        name: "Custom Embroidered Pillow",
        price: 39.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Stitch & Style",
        category: "Handmade",
      },
    ],
    home: [
      {
        name: "Minimalist Desk Lamp",
        price: 49.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.7,
        store: "Modern Decor",
        category: "Home & Living",
      },
      {
        name: "Organic Cotton Bedding Set",
        price: 89.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.9,
        store: "Eco Home",
        category: "Home & Living",
      },
      {
        name: "Handcrafted Ceramic Dinnerware",
        price: 129.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.8,
        store: "Artisan Crafts",
        category: "Home & Living",
      },
      {
        name: "Sustainable Bamboo Organizer",
        price: 34.99,
        image: "/placeholder.svg?height=300&width=300",
        rating: 4.6,
        store: "Eco Essentials",
        category: "Home & Living",
      },
    ],
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex justify-center">
        <TabsList className="mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="digital">Digital</TabsTrigger>
          <TabsTrigger value="handmade">Handmade</TabsTrigger>
          <TabsTrigger value="home">Home & Living</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {trendingProducts.all.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="digital" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.digital.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="handmade" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.handmade.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="home" className="mt-0">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.home.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
