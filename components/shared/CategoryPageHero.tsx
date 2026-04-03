import { ReactNode } from "react";

type Props = {
  /** e.g. "Things to Do in" or "Where to Stay in" */
  title: string;
  /** City name rendered in blue accent — omit for pages without a city context */
  accent?: string | null;
  /** Energetic subtitle with emoji */
  subtitle: string;
  /** Optional search/filter slot rendered below the subtitle */
  children?: ReactNode;
};

/**
 * Shared hero used at the top of every category listing page.
 * Keeps the heading style consistent across activities, stays,
 * restaurants, rentals, passes, etc.
 */
export function CategoryPageHero({ title, accent, subtitle, children }: Props) {
  return (
    <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 text-center max-w-2xl mx-auto px-4">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        {title}{" "}
        {accent && <span className="text-blue-600">{accent}</span>}
      </h1>
      <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
        {subtitle}
      </p>
      {children && (
        <div className="mt-6 flex justify-center">
          {children}
        </div>
      )}
    </section>
  );
}
