import { ImEnter, ImExit } from "react-icons/im";
import { MdPets, MdBlock } from "react-icons/md";
import { TbSmoking, TbHomeCancel } from "react-icons/tb";

interface HouseRulesProps {
  checkInTime: string;
  checkOutTime: string;
  isPetFriendly: boolean;
  isSmokeFree: boolean;
  cancelationPolicy: string;
  labels: {
    checkIn: string;
    checkOut: string;
    after: string;
    before: string;
    pets: string;
    smoking: string;
    allowed: string;
    notAllowed: string;
    cancellation: string;
    cancelPolicies: Record<string, string>;
  };
}

export function HouseRules({
  checkInTime,
  checkOutTime,
  isPetFriendly,
  isSmokeFree,
  cancelationPolicy,
  labels,
}: HouseRulesProps) {
  const policyLabel =
    labels.cancelPolicies[cancelationPolicy.toLowerCase()] ?? cancelationPolicy;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Check-in */}
        <div className="flex items-center gap-3">
          <ImEnter className="h-7 w-7 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{labels.checkIn}</p>
            <p className="text-sm text-gray-500">
              {labels.after} {checkInTime}
            </p>
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-3">
          <ImExit className="h-7 w-7 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium text-gray-800">{labels.checkOut}</p>
            <p className="text-sm text-gray-500">
              {labels.before} {checkOutTime}
            </p>
          </div>
        </div>

        {/* Pets */}
        <div className="flex items-center gap-3">
          {isPetFriendly ? (
            <MdPets className="h-7 w-7 text-blue-600 shrink-0" />
          ) : (
            <div className="relative shrink-0">
              <MdPets className="h-6 w-6 text-gray-400" />
              <MdBlock className="absolute -top-1 -left-1 h-8 w-8 text-red-500 opacity-70" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-800">{labels.pets}</p>
            <p className="text-sm text-gray-500">
              {isPetFriendly ? labels.allowed : labels.notAllowed}
            </p>
          </div>
        </div>

        {/* Smoking */}
        <div className="flex items-center gap-3">
          {isSmokeFree ? (
            <div className="relative shrink-0">
              <TbSmoking className="h-6 w-6 text-gray-400" />
              <MdBlock className="absolute -top-1 -left-1 h-8 w-8 text-red-500 opacity-70" />
            </div>
          ) : (
            <TbSmoking className="h-7 w-7 text-blue-600 shrink-0" />
          )}
          <div>
            <p className="font-medium text-gray-800">{labels.smoking}</p>
            <p className="text-sm text-gray-500">
              {isSmokeFree ? labels.notAllowed : labels.allowed}
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="flex items-center gap-3 pt-2">
        <TbHomeCancel className="h-7 w-7 text-blue-600 shrink-0" />
        <div>
          <p className="font-medium text-gray-800">{labels.cancellation}</p>
          <p className="text-sm text-gray-500">{policyLabel}</p>
        </div>
      </div>
    </div>
  );
}
