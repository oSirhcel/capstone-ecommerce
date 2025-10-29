import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductSeoProps {
  seo: {
    title?: string;
    description?: string;
    slug?: string;
  };
}

export function ProductSeo({ seo }: ProductSeoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Settings</CardTitle>
        <CardDescription>
          Search engine optimization information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">
            SEO Title
          </h3>
          <p className="text-sm">{seo.title ?? "Not set"}</p>
          {seo.title && (
            <p className="text-muted-foreground mt-1 text-xs">
              {seo.title.length}/60 characters
            </p>
          )}
        </div>

        <div>
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">
            SEO Description
          </h3>
          <p className="text-sm">{seo.description ?? "Not set"}</p>
          {seo.description && (
            <p className="text-muted-foreground mt-1 text-xs">
              {seo.description.length}/200 characters
            </p>
          )}
        </div>

        <div>
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">
            URL Slug
          </h3>
          <p className="bg-muted rounded px-2 py-1 font-mono text-sm">
            /product/{seo.slug ?? "auto-generated"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
