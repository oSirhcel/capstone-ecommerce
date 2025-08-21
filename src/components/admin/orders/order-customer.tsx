import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, User } from "lucide-react"
import Link from "next/link"

interface OrderCustomerProps {
  customer: {
    id: string
    name: string
    email: string
    phone: string
    avatar: string
  }
}

export function OrderCustomer({ customer }: OrderCustomerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={customer.avatar || "/placeholder.svg"} />
            <AvatarFallback>
              {customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{customer.phone}</span>
          </div>
        </div>

        <Link href={`/admin/users/${customer.id}`}>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <User className="h-4 w-4 mr-2" />
            View Customer Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
