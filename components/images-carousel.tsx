"use client";

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export function ImagesCarousel({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imgs = images && images.length > 0 ? images : ["/placeholder.svg"];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    if (thumbApi) {
      thumbApi.scrollTo(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi, thumbApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollPrev, scrollNext]);

  return (
    <>
      <div className="space-y-3">
        {/* Main Carousel */}
        <div className="relative group rounded-2xl overflow-hidden bg-muted">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {imgs.map((src, i) => (
                <div
                  key={i}
                  className="relative basis-full shrink-0 aspect-[16/10] cursor-pointer"
                  onClick={() => setIsFullscreen(true)}
                >
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Image ${i + 1}`}
                    fill
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {imgs.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Expand className="w-4 h-4" />
          </Button>

          {/* Counter */}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
            {selectedIndex + 1} / {imgs.length}
          </div>
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="overflow-hidden" ref={thumbRef}>
            <div className="flex gap-2">
              {imgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                    selectedIndex === i
                      ? "ring-2 ring-primary ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              scrollPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              scrollNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          <div
            className="relative w-full h-full max-w-6xl max-h-[85vh] m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imgs[selectedIndex] || "/placeholder.svg"}
              alt={`Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollTo(i);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedIndex === i ? "bg-white w-6" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
