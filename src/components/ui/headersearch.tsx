"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "./input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeaderSearchBar() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };
  return (
    <form onSubmit={handleSearch} className="relative">
      <SearchIcon className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
      <Input
        type="text"
        placeholder="Search products, stores, categories..."
        className="bg-background w-full rounded-md border pl-8 md:w-[300px] lg:w-[400px]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </form>
  );
}
