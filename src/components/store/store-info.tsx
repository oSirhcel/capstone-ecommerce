import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  ShieldCheck,
  RotateCcw,
  Truck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StoreInfoProps {
  store: {
    id: string;
    slug: string;
    name: string;
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

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Store Information</CardTitle>
      </CardHeader>
      <CardContent>
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
                {/* Email */}
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
                {/* Shipping Policy */}
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

                {/* Returns Policy */}
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

                {/* Privacy Policy */}
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

                {/* Terms of Service */}
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

                {/* Trust Badges */}
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
