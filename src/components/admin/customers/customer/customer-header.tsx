"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit,
  MoreHorizontal,
  Ban,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface CustomerHeaderProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    status: string;
    customerSince: string;
    location: string;
    tags: string[];
    notes: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
}

export function CustomerHeader({ customer }: CustomerHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Link
          href="/admin/customers"
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            {/* Customer Info */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={customer.avatar || "/placeholder.svg"}
                  alt={customer.name}
                />
                <AvatarFallback className="text-lg">
                  {customer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{customer.name}</h1>
                  <Badge
                    variant={
                      customer.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {customer.status}
                  </Badge>
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="text-muted-foreground flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                    {customer.emailVerified && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <Separator
                    orientation="vertical"
                    className="hidden h-4 sm:block"
                  />
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                    {!customer.phoneVerified && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <Separator
                    orientation="vertical"
                    className="hidden h-4 sm:block"
                  />
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{customer.location}</span>
                  </div>
                </div>

                <div className="text-muted-foreground text-sm">
                  Customer since{" "}
                  {new Date(customer.customerSince).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-muted/50 mt-4 rounded-md p-3">
              <p className="text-muted-foreground text-sm">
                <strong>Notes:</strong> {customer.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
