"use client";

import { Check } from "lucide-react";

export default function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-1.5 px-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < current ? "bg-gray-900 text-white"
              : i === current ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2"
              : "bg-gray-100 text-gray-400"}`}>
              {i < current ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-px mx-1 ${i < current ? "bg-gray-900" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
