"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      <div
        className={`relative flex-1 transition-all duration-300 ${
          isFocused ? "scale-[1.02]" : ""
        }`}
      >
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ville, département, région..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="pl-12 pr-4 h-14 text-base rounded-xl border-0 bg-background/80 focus:bg-background shadow-inner focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-14 px-8 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <Search className="w-5 h-5 mr-2" />
        Rechercher
      </Button>
    </form>
  );
}
