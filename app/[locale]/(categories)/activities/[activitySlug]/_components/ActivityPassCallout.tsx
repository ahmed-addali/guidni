import Link from "next/link";
import { FaTicket } from "react-icons/fa6";
import { ArrowRight } from "lucide-react";

type Props = {
  locale: string;
  labels: {
    title: string;
    subtitle: string;
    cta: string;
  };
};

export function ActivityPassCallout({ locale, labels }: Props) {
  return (
    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <FaTicket className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{labels.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{labels.subtitle}</p>
      </div>
      <Link
        href={`/${locale}/passes`}
        className="shrink-0 flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {labels.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
