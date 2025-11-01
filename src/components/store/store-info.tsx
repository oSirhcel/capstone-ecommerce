import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  ShieldCheck,
  RotateCcw,
  Truck,
  ExternalLink,
  Star,
  Package,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StoreInfoProps {
  store: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string;
    createdAt: Date;
    stats?: {
      totalProducts: number;
      averageRating: number;
      totalReviews: number;
    };
    settings?: {
      contactEmail?: string | null;
      shippingPolicy?: string | null;
      returnPolicy?: string | null;
      privacyPolicy?: string | null;
      termsOfService?: string | null;
    } | null;
  };
}

export function StoreInfo({ store }: StoreInfoProps) {
  const hasContactInfo = store.settings?.contactEmail;
  const hasPolicies =
    store.settings?.shippingPolicy ??
    store.settings?.returnPolicy ??
    store.settings?.privacyPolicy ??
    store.settings?.termsOfService;
  const joinedYear = new Date(store.createdAt).getFullYear();

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Store Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={store.imageUrl || "/placeholder.svg"}
            alt={store.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Description */}
        {store.description && (
          <div className="space-y-2">
            <h3 className="font-semibold">About</h3>
            <p className="text-muted-foreground text-sm">{store.description}</p>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-3 border-t pt-4">
          {/* Reviews */}
          {store.stats?.averageRating && (
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <div className="flex-1">
                <p className="font-medium">
                  {store.stats.averageRating.toFixed(1)} out of 5
                </p>
                <p className="text-muted-foreground text-sm">
                  {store.stats.totalReviews.toLocaleString()} reviews
                </p>
              </div>
            </div>
          )}

          {/* Products */}
          {store.stats?.totalProducts && (
            <div className="flex items-center gap-3">
              <Package className="text-muted-foreground h-5 w-5" />
              <div className="flex-1">
                <p className="font-medium">
                  {store.stats.totalProducts} products
                </p>
              </div>
            </div>
          )}

          {/* Join Date */}
          <div className="flex items-center gap-3">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <div className="flex-1">
              <p className="font-medium">Joined {joinedYear}</p>
            </div>
          </div>
        </div>

        {/* Contact & Policies */}
        <Tabs
          defaultValue={hasContactInfo ? "contact" : "policies"}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="mt-4 space-y-4">
            {hasContactInfo ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">Email Support</p>
                      <a
                        href={`mailto:${store.settings?.contactEmail}`}
                        className="text-primary text-sm hover:underline"
                      >
                        {store.settings?.contactEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <Button className="mt-4 w-full">Contact Store</Button>
              </>
            ) : (
              <div className="py-8 text-center">
                <Mail className="text-muted-foreground mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-2 text-sm">
                  Contact information not available
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="policies" className="mt-4 space-y-4">
            {hasPolicies ? (
              <>
                {store.settings?.shippingPolicy && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <Truck className="text-muted-foreground mt-0.5 h-5 w-5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">Shipping Policy</p>
                          <p className="text-muted-foreground text-sm">
                            View our shipping terms and delivery information
                          </p>
                        </div>
                      </div>
                      <Link href={`/stores/${store.slug}/shipping`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {store.settings?.returnPolicy && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <RotateCcw className="text-muted-foreground mt-0.5 h-5 w-5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">Return Policy</p>
                          <p className="text-muted-foreground text-sm">
                            Learn about our return and refund process
                          </p>
                        </div>
                      </div>
                      <Link href={`/stores/${store.slug}/return`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {store.settings?.privacyPolicy && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="text-muted-foreground mt-0.5 h-5 w-5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">Privacy Policy</p>
                          <p className="text-muted-foreground text-sm">
                            How we collect and protect your data
                          </p>
                        </div>
                      </div>
                      <Link href={`/stores/${store.slug}/privacy`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {store.settings?.termsOfService && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="text-muted-foreground mt-0.5 h-5 w-5" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">Terms of Service</p>
                          <p className="text-muted-foreground text-sm">
                            Terms and conditions for using our store
                          </p>
                        </div>
                      </div>
                      <Link href={`/stores/${store.slug}/terms`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t pt-4">
                  <p className="font-medium">Trust & Safety</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Secure Checkout
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Easy Returns
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Truck className="h-3 w-3" />
                      Quality Guarantee
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <ShieldCheck className="text-muted-foreground mx-auto h-12 w-12" />
                <p className="text-muted-foreground mt-2 text-sm">
                  Store policies not available
                </p>
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="font-medium">Trust & Safety</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Secure Checkout
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Easy Returns
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Truck className="h-3 w-3" />
                      Quality Guarantee
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
