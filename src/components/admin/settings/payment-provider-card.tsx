"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useConnectStripeMutation,
  useDisconnectPaymentProviderMutation,
  usePaymentProvidersQuery,
} from "@/hooks/admin/settings/use-payment-providers";

export function PaymentProviderCard() {
  const { data: providers = [], isLoading } = usePaymentProvidersQuery();
  const connectStripe = useConnectStripeMutation();
  const disconnect = useDisconnectPaymentProviderMutation();

  const stripe = providers.find((p) => p.provider === "stripe");
  const connected = !!stripe?.stripeAccountId && stripe?.isActive;

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Stripe</CardTitle>
          <CardDescription>Accept card payments securely</CardDescription>
        </div>
        {connected ? (
          <Badge>Connected</Badge>
        ) : (
          <Badge variant="secondary">Not Connected</Badge>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {connected ? (
            <div>Account: {stripe?.stripeAccountId}</div>
          ) : (
            <div>Connect your Stripe account to start accepting payments.</div>
          )}
        </div>
        <div className="flex gap-2">
          {connected ? (
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => disconnect.mutate("stripe")}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={() => connectStripe.mutate()}
              disabled={connectStripe.isPending}
            >
              Connect Stripe
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
