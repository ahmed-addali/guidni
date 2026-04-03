import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  images: { id: string; url: string }[];
  title: string;
};

export function ActivityImageGallery({ images, title }: Props) {
  if (images.length === 0) return null;

  const count = Math.min(images.length, 5);

  if (count === 1) {
    return (
      <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden">
        <Image src={images[0].url} alt={title} fill className="object-cover" priority />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 h-72 sm:h-96 rounded-xl overflow-hidden">
        {images.slice(0, 2).map((img, i) => (
          <div key={img.id} className="relative">
            <Image src={img.url} alt={`${title} ${i + 1}`} fill className="object-cover" priority={i === 0} />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-2 h-72 sm:h-96 rounded-xl overflow-hidden">
        <div className="relative row-span-2">
          <Image src={images[0].url} alt={title} fill className="object-cover" priority />
        </div>
        {images.slice(1, 3).map((img, i) => (
          <div key={img.id} className="relative">
            <Image src={img.url} alt={`${title} ${i + 2}`} fill className="object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // 4 or 5 images: Airbnb-style — 1 large left + grid right
  return (
    <div className="grid grid-cols-2 gap-2 h-72 sm:h-96 rounded-xl overflow-hidden">
      {/* Main image */}
      <div className="relative row-span-2">
        <Image src={images[0].url} alt={title} fill className="object-cover" priority />
      </div>
      {/* Right grid: up to 4 thumbnails in 2×2 */}
      <div className={cn("grid gap-2", count >= 4 ? "grid-rows-2" : "grid-rows-1")}>
        {images.slice(1, count).map((img, i) => (
          <div
            key={img.id}
            className={cn(
              "relative",
              count === 4 ? "col-span-1" : "col-span-1"
            )}
          >
            <Image
              src={img.url}
              alt={`${title} ${i + 2}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
