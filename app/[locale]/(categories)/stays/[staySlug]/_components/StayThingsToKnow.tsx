import { ImEnter, ImExit } from "react-icons/im";
import { MdPets } from "react-icons/md";
import { TbSmoking } from "react-icons/tb";
import { ShieldCheck, AlertTriangle, BadgeCheck } from "lucide-react";

type Props = {
  checkInTime: string;
  checkOutTime: string;
  isPetFriendly: boolean;
  isSmokeFree: boolean;
  cancelationPolicy: string;
  labels: {
    title: string;
    houseRules: string;
    safety: string;
    cancellation: string;
    checkIn: string;
    checkOut: string;
    after: string;
    before: string;
    pets: string;
    smoking: string;
    allowed: string;
    notAllowed: string;
    safetyItems: string[];
    cancelPolicies: Record<string, string>;
  };
};

export function StayThingsToKnow({
  checkInTime,
  checkOutTime,
  isPetFriendly,
  isSmokeFree,
  cancelationPolicy,
  labels,
}: Props) {
  const policyLabel =
    labels.cancelPolicies[cancelationPolicy.toLowerCase()] ?? cancelationPolicy;

  const isFlexible =
    cancelationPolicy.toLowerCase() === "flexible";
  const isModerate =
    cancelationPolicy.toLowerCase() === "moderate";

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-5">{labels.title}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* House rules */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-gray-800 text-sm">{labels.houseRules}</p>
          <div className="space-y-2.5 text-sm text-gray-600">
            <div className="flex items-center gap-2.5">
              <ImEnter className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{labels.checkIn}: {labels.after} {checkInTime}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ImExit className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{labels.checkOut}: {labels.before} {checkOutTime}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MdPets className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {labels.pets} — {isPetFriendly ? labels.allowed : labels.notAllowed}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <TbSmoking className="h-4 w-4 text-gray-400 shrink-0" />
              <span>
                {labels.smoking} — {isSmokeFree ? labels.notAllowed : labels.allowed}
              </span>
            </div>
          </div>
        </div>

        {/* Safety & accessibility */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-gray-800 text-sm">{labels.safety}</p>
          <div className="space-y-2.5 text-sm text-gray-600">
            {labels.safetyItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-gray-800 text-sm">{labels.cancellation}</p>
          <div className="flex items-start gap-2.5">
            {isFlexible || isModerate ? (
              <BadgeCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{policyLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
