import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import {
  carts,
  cartItems,
  products,
  stores,
  productImages,
} from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Extend the session user type to include our custom fields
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  userType?: string;
}

// GET /api/cart - Get user's cart with items
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user's cart
    let [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!userCart) {
      // Create new cart for user
      const [newCart] = await db
        .insert(carts)
        .values({
          userId: userId,
        })
        .returning();
      userCart = newCart;
    }

    // Get cart items with product and store information
    const cartItemsData = await db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        productId: products.id,
        productName: products.name,
        productPrice: products.price,
        productStock: products.stock,
        storeId: products.storeId,
        storeName: stores.name,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(stores, eq(products.storeId, stores.id))
      .where(eq(cartItems.cartId, userCart.id))
      .orderBy(desc(cartItems.id));

    // Get product images for each item
    const itemsWithImages = await Promise.all(
      cartItemsData.map(async (item) => {
        const images = await db
          .select({
            imageUrl: productImages.imageUrl,
            altText: productImages.altText,
            isPrimary: productImages.isPrimary,
          })
          .from(productImages)
          .where(eq(productImages.productId, item.productId))
          .orderBy(productImages.displayOrder);

        return {
          id: item.productId.toString(),
          name: item.productName,
          price: item.productPrice! / 100, // Convert from cents
          image: images[0]?.imageUrl ?? "/placeholder.svg",
          quantity: item.quantity,
          storeId: item.storeId,
          storeName: item.storeName,
          stock: item.productStock,
        };
      }),
    );

    return NextResponse.json({
      cartId: userCart.id,
      items: itemsWithImages,
      itemCount: itemsWithImages.reduce(
        (count, item) => count + item.quantity,
        0,
      ),
      subtotal: itemsWithImages.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 },
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
    };
    const { productId, quantity = 1 } = body;

    if (!productId || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID or quantity" },
        { status: 400 },
      );
    }

    // Get or create user's cart
    let [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!userCart) {
      const [newCart] = await db
        .insert(carts)
        .values({
          userId: userId,
        })
        .returning();
      userCart = newCart;
    }

    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productId, parseInt(productId)),
        ),
      )
      .limit(1);

    if (existingItem) {
      // Update quantity
      await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(cartItems).values({
        cartId: userCart.id,
        productId: parseInt(productId, 10),
        quantity,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 },
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
    };
    const { productId, quantity } = body;

    if (!productId || quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: "Invalid product ID or quantity" },
        { status: 400 },
      );
    }

    // Get user's cart
    const [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!userCart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // Find the cart item
    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productId, parseInt(productId)),
        ),
      )
      .limit(1);

    if (!cartItem) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 },
      );
    }

    if (quantity === 0) {
      // Remove item from cart
      await db.delete(cartItems).where(eq(cartItems.id, cartItem.id));
    } else {
      // Update quantity
      await db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, cartItem.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 },
    );
  }
}

// DELETE /api/cart - Remove item from cart or clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!(session?.user as SessionUser)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session?.user as SessionUser)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    // Get user's cart
    const [userCart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!userCart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (productId) {
      // Remove specific item
      const [cartItem] = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productId, parseInt(productId, 10)),
          ),
        )
        .limit(1);

      if (cartItem) {
        await db.delete(cartItems).where(eq(cartItems.id, cartItem.id));
      }
    } else {
      // Clear entire cart
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 },
    );
  }
}
