import React from "react";
import { Clock } from "lucide-react";
import {
  BusinessHours,
  DayHours,
} from "../../services/ShopSettings/fetchShopSettings";

interface BusinessHoursCardProps {
  businessHours?: BusinessHours | null;
}

const DAY_LABELS: Record<keyof BusinessHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const formatTime = (time?: string) => {
  if (!time || !time.includes(":")) return "—";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return time;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes || "00"} ${ampm}`;
};

const DayRow: React.FC<{ day: string; hours?: DayHours | null }> = ({
  day,
  hours,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm font-medium text-slate-700 w-28">{day}</span>
    {!hours || hours.closed ? (
      <span className="text-sm text-red-600 font-medium">Closed</span>
    ) : hours.open && hours.close ? (
      <span className="text-sm text-slate-600">
        {formatTime(hours.open)} – {formatTime(hours.close)}
      </span>
    ) : (
      <span className="text-sm text-slate-400">Not set</span>
    )}
  </div>
);

const DEFAULT_DAYS: (keyof BusinessHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const BusinessHoursCard: React.FC<BusinessHoursCardProps> = ({
  businessHours,
}) => {
  const days = DEFAULT_DAYS.map((key) => [
    key,
    businessHours?.[key] ?? null,
  ] as const);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden h-full">
      <div className="p-4 sm:p-6 border-b">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Business Hours
        </h3>
      </div>
      <div className="p-4 sm:p-6">
        {!businessHours ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No business hours configured
          </p>
        ) : (
          days.map(([key, hours]) => (
            <DayRow key={key} day={DAY_LABELS[key]} hours={hours} />
          ))
        )}
      </div>
    </div>
  );
};
