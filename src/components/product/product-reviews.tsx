"use client"

import { useState } from "react"
import { Star, ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock reviews data
const mockReviews = [
  {
    id: "1",
    author: "Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2023-10-15",
    title: "Absolutely love this mug!",
    content:
      "This mug is exactly what I was looking for. The quality is excellent, and it keeps my coffee hot for a long time. The design is beautiful, and it feels great in my hand. Highly recommend!",
    helpful: 12,
    notHelpful: 2,
  },
  {
    id: "2",
    author: "Michael Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4,
    date: "2023-09-28",
    title: "Great quality, but smaller than expected",
    content:
      "The mug is beautifully crafted and feels very sturdy. My only complaint is that it's a bit smaller than I expected. Still, it's perfect for my morning espresso. The glaze is gorgeous and has held up well in the dishwasher.",
    helpful: 8,
    notHelpful: 1,
  },
  {
    id: "3",
    author: "Emily Rodriguez",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    date: "2023-11-02",
    title: "Perfect gift!",
    content:
      "I bought this as a gift for my sister, and she absolutely loves it! The craftsmanship is exceptional, and the color is exactly as shown in the photos. Will definitely purchase more for other family members.",
    helpful: 5,
    notHelpful: 0,
  },
]

export function ProductReviews() {
  const [sortBy, setSortBy] = useState("newest")
  const [reviewsData, setReviewsData] = useState(mockReviews)

  // Calculate average rating
  const averageRating = reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length

  // Rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]
  reviewsData.forEach((review) => {
    ratingCounts[review.rating - 1]++
  })

  const handleHelpful = (reviewId: string, isHelpful: boolean) => {
    setReviewsData(
      reviewsData.map((review) => {
        if (review.id === reviewId) {
          if (isHelpful) {
            return { ...review, helpful: review.helpful + 1 }
          } else {
            return { ...review, notHelpful: review.notHelpful + 1 }
          }
        }
        return review
      }),
    )
  }

  const sortReviews = (reviews: typeof mockReviews) => {
    switch (sortBy) {
      case "newest":
        return [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case "oldest":
        return [...reviews].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      case "highest":
        return [...reviews].sort((a, b) => b.rating - a.rating)
      case "lowest":
        return [...reviews].sort((a, b) => a.rating - b.rating)
      case "mostHelpful":
        return [...reviews].sort((a, b) => b.helpful - a.helpful)
      default:
        return reviews
    }
  }

  const sortedReviews = sortReviews(reviewsData)

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating) ? "fill-primary text-primary" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Based on {reviewsData.length} reviews</div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex w-20 items-center">
                  <span className="mr-1">{rating}</span>
                  <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${reviewsData.length > 0 ? (ratingCounts[rating - 1] / reviewsData.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <div className="w-10 text-right text-sm text-muted-foreground">{ratingCounts[rating - 1]}</div>
              </div>
            ))}
          </div>

          <Button className="w-full">Write a Review</Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Customer Reviews</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
                <SelectItem value="mostHelpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <div key={review.id} className="space-y-2 border-b pb-6 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.author} />
                      <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{review.author}</div>
                      <div className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">{review.title}</h4>
                  <p className="mt-1 text-muted-foreground">{review.content}</p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="text-sm text-muted-foreground">Was this review helpful?</div>
                  <button className="flex items-center gap-1 text-sm" onClick={() => handleHelpful(review.id, true)}>
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpful}</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm" onClick={() => handleHelpful(review.id, false)}>
                    <ThumbsDown className="h-4 w-4" />
                    <span>{review.notHelpful}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
