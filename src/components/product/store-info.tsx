import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface StoreInfoProps {
  store: {
    id: string
    name: string
    logo: string
    rating: number
    productCount: number
    joinedDate: string
  }
}

export function StoreInfo({ store }: StoreInfoProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Image
            src={store.logo || "/placeholder.svg"}
            alt={store.name}
            width={80}
            height={80}
            className="h-16 w-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium">{store.name}</h3>
            <div className="mt-1 flex items-center">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="ml-1 text-sm font-medium">{store.rating}</span>
              </div>
              <span className="mx-2 text-xs text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{store.productCount} products</span>
              <span className="mx-2 text-xs text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                Joined {new Date(store.joinedDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/store/${store.id}`}>Visit Store</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
