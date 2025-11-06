"use client";

import { useState } from "react";
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
import { RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export function PaymentProviderCard() {
  const { data: providers = [], isLoading, refetch } = usePaymentProvidersQuery();
  const connectStripe = useConnectStripeMutation();
  const disconnect = useDisconnectPaymentProviderMutation();
  const [isVerifying, setIsVerifying] = useState(false);

  const stripe = providers.find((p) => p.provider === "stripe");
  const connected = !!stripe?.stripeAccountId && stripe?.isActive;
  const accountStatus = stripe?.stripeAccountStatus;

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // Refetch providers to get latest status
      await refetch();
      toast.success("Payment provider status refreshed");
    } catch {
      toast.error("Failed to verify connection");
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = () => {
    if (!connected) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }

    switch (accountStatus) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "restricted":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Restricted
          </Badge>
        );
      default:
        return <Badge>Connected</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (!connected) {
      return "Connect your Stripe account to start accepting payments.";
    }

    switch (accountStatus) {
      case "active":
        return "Your Stripe account is active and ready to accept payments.";
      case "pending":
        return "Your Stripe account is pending verification. Complete your account setup in Stripe.";
      case "restricted":
        return "Your Stripe account has restrictions. Please check your Stripe dashboard.";
      default:
        return `Account: ${stripe?.stripeAccountId}`;
    }
  };

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Stripe</CardTitle>
          <CardDescription>Accept card payments securely</CardDescription>
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-muted-foreground text-sm">
          {connected && stripe?.stripeAccountId && (
            <div className="mb-2">
              <div className="font-medium">Account ID:</div>
              <div className="font-mono text-xs">{stripe.stripeAccountId}</div>
            </div>
          )}
          <div>{getStatusMessage()}</div>
          {connected && stripe?.connectedAt && (
            <div className="mt-2 text-xs">
              Connected: {new Date(stripe.connectedAt).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={isVerifying || isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isVerifying ? "animate-spin" : ""}`}
              />
              Refresh Status
            </Button>
          )}
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
