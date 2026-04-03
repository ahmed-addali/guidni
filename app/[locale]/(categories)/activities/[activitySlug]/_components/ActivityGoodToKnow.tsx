import { CheckCircle, CreditCard, Users } from "lucide-react";

type Props = {
  cancelation?: boolean | null;
  paynow?: boolean | null;
  capacity: number;
  labels: {
    title: string;
    cancellationTitle: string;
    cancellationFree: string;
    cancellationStrict: string;
    paymentTitle: string;
    paymentLater: string;
    paymentNow: string;
    groupTitle: string;
    maxGroup: string;
  };
};

export function ActivityGoodToKnow({ cancelation, paynow, capacity, labels }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{labels.title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Cancellation */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">{labels.cancellationTitle}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {cancelation ? labels.cancellationFree : labels.cancellationStrict}
          </p>
        </div>

        {/* Payment */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">{labels.paymentTitle}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {paynow === false ? labels.paymentLater : labels.paymentNow}
          </p>
        </div>

        {/* Group */}
        <div className="border border-gray-100 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-semibold text-gray-900 text-sm">{labels.groupTitle}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {labels.maxGroup.replace("{n}", capacity.toString())}
          </p>
        </div>

      </div>
    </div>
  );
}
