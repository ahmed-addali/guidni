"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { recTracker } from "@/lib/recommendation/tracker";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Heart, Star, Sparkles } from "lucide-react";
import { getRecommendationDetails } from "@/lib/actions/recommendations";

export function RecommendationsSection({ locale }: { locale: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useTranslations("HomePage"); // Using standard namespace

  useEffect(() => {
    // Initialize context
    recTracker.setContext({ destinationId: "djerba" });
    recTracker.start();
    
    recTracker.getRecommendations("djerba", 4)
      .then(async (data) => {
        if (data && data.items && data.items.length > 0) {
          // Map backend items (camelCase) to what getRecommendationDetails expects
          const mappedItems = data.items.map((i: any) => ({
            listing_id: i.listingId,
            listing_type: i.listingType,
            tags: [],
            rank: 0,
            is_new_listing: false,
            theta: i.theta,
            alpha: i.alpha,
            beta: i.beta,
            impressions: i.impressions,
            conversions: i.conversions
          }));

          // Fetch full details from database using the Server Action
          try {
            const detailedItems = await getRecommendationDetails(mappedItems);
            setRecommendations(detailedItems);
          } catch (e) {
            console.error("Failed to fetch details", e);
            setRecommendations(mappedItems); // fallback to ID-only
          }
        } else {
          // Empty state
          setRecommendations([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load recommendations:", err);
        setError(true);
        setLoading(false);
      });

    return () => recTracker.stop();
  }, []);

  if (error || (!loading && recommendations.length === 0)) {
    return null; // Hide section if failed or empty
  }

  return (
    <section className="py-8 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Recommended For You
          </h2>
          <p className="text-sm text-gray-500">
            Personalized picks based on your style and budget
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommendations.map((item, idx) => (
            <RecommendationCard key={`${item.listing_type}-${item.listing_id}-${idx}`} item={item} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({ item, locale }: { item: any; locale: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const details = item.details;
  
  // Format the listing type for URLs
  const getHref = () => {
    const slug = details?.slug || item.listing_id;
    switch(item.listing_type) {
      case "ACTIVITY": return `/${locale}/activities/${slug}`;
      case "STAY": return `/${locale}/stays/${slug}`;
      case "RESTAURANT": return `/${locale}/restaurants/${slug}`;
      case "TRANSFER": return `/${locale}/transport/transfers/${slug}`;
      default: return `/${locale}/destinations/djerba`;
    }
  };

  useEffect(() => {
    if (cardRef.current) {
      recTracker.observeCard(cardRef.current, item.listing_id, item.listing_type);
    }
    return () => {
      recTracker.unobserveCard(item.listing_id, item.listing_type);
    };
  }, [item]);

  const imageUrl = details?.images?.[0]?.url || null;
  const title = details?.title || details?.name || item.listing_id;
  const city = details?.destination?.city || "Djerba";
  const rating = details?.note ? Number(details.note).toFixed(1) : "New";
  const reviews = details?.nbReviews || 0;
  const price = details?.price || 0;

  return (
    <Link 
      href={getHref()}
      className="group relative flex flex-col gap-2 h-full border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden"
      onClick={() => recTracker.trackClick(item.listing_id, item.listing_type, price)}
    >
      <div ref={cardRef} className="flex flex-col h-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 mb-3">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover transition-transform group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <span className="text-xs uppercase font-medium">{item.listing_type}</span>
            </div>
          )}
          
          <button 
            className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-colors z-10 shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              recTracker.trackWishlist(item.listing_id, item.listing_type);
            }}
          >
            <Heart className="w-4 h-4" />
          </button>
          
          {item.is_new_listing && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">
              New
            </div>
          )}
        </div>
        
        <div className="px-3 pb-3 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1" title={title}>
              {title}
            </h3>
            <div className="flex items-center gap-1 text-sm font-medium shrink-0">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {city}
            <span className="text-xs ml-1">({item.listing_type})</span>
          </p>
          
          <div className="mt-2 text-sm font-medium text-gray-900">
            {price > 0 ? `From ${price} TND` : "Price varies"}
          </div>

          <div className="flex flex-wrap gap-1 mt-auto pt-3">
            {item.tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide">
                {tag.replace('_', ' ')}
              </span>
            ))}
            {item.tags?.length > 2 && (
              <span className="text-[10px] text-gray-400 font-medium">+{item.tags.length - 2}</span>
            )}
            
            {/* Display Thompson Sampling metrics for testing */}
            <div className="w-full flex justify-between items-center mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
              <span title="Expected Reward (Theta)" className="font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                θ: {item.theta?.toFixed(3)}
              </span>
              <span title="Alpha (Successes) / Beta (Failures)" className="font-mono">
                α:{item.alpha?.toFixed(1)} / β:{item.beta?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
