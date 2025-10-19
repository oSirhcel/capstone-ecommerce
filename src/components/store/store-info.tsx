import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoreInfoProps {
  store: {
    id: string;
    settings?: {
      contactEmail?: string | null;
      shippingPolicy?: string | null;
      returnPolicy?: string | null;
    } | null;
  };
}

export function StoreInfo({ store }: StoreInfoProps) {
  const hasContactInfo = store.settings?.contactEmail;
  const hasPolicies =
    store.settings?.shippingPolicy ?? store.settings?.returnPolicy;

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
                    <div className="flex items-start gap-3">
                      <Truck className="text-muted-foreground mt-0.5 h-5 w-5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">Shipping</p>
                        <p className="text-muted-foreground text-sm">
                          {store.settings.shippingPolicy}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Returns Policy */}
                {store.settings?.returnPolicy && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <RotateCcw className="text-muted-foreground mt-0.5 h-5 w-5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">Returns</p>
                        <p className="text-muted-foreground text-sm">
                          {store.settings.returnPolicy}
                        </p>
                      </div>
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
