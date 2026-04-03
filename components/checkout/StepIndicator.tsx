import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                step.id < currentStep
                  ? "bg-primary border-primary text-white"
                  : step.id === currentStep
                  ? "border-primary text-primary bg-white"
                  : "border-gray-200 text-gray-400 bg-white"
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                step.id <= currentStep ? "text-gray-900" : "text-gray-400"
              )}
            >
              {step.title}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-16 h-0.5 mx-2 mb-4 transition-colors",
                step.id < currentStep ? "bg-primary" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
