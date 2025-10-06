import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

const customers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Customer",
    status: "Active",
    joinDate: "2024-01-15",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Seller",
    status: "Active",
    joinDate: "2024-01-10",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "3",
    name: "Mike Chen",
    email: "mike@example.com",
    role: "Customer",
    status: "Inactive",
    joinDate: "2024-01-08",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    role: "Seller",
    status: "Active",
    joinDate: "2024-01-05",
    avatar: "/placeholder.svg?height=32&width=32",
  },
];

const columns = [
  {
    header: "Customer",
    accessorKey: "name",
    cell: ({ row }: any) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={row.original.avatar || "/placeholder.svg"}
            alt={row.original.name}
          />
          <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-muted-foreground text-sm">
            {row.original.email}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: "Role",
    accessorKey: "role",
    cell: ({ row }: any) => (
      <Badge variant={row.original.role === "Seller" ? "default" : "secondary"}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }: any) => (
      <Badge
        variant={row.original.status === "Active" ? "default" : "secondary"}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    header: "Join Date",
    accessorKey: "joinDate",
  },
  {
    header: "Actions",
    cell: ({ row }: any) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/customers/${row.original.id}`}>View</Link>
        </Button>
      </div>
    ),
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">
          View and manage registered customers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            A list of all customers in your marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input placeholder="Search customers..." className="pl-8" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <DataTable columns={columns} data={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
