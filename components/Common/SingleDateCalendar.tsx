import React from "react";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface SingleDateCalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export const SingleDateCalendar: React.FC<SingleDateCalendarProps> = ({
  value,
  onChange,
  minDate,
}) => {
  return (
    <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-2 overflow-visible">
      <Calendar
        date={value ?? new Date()}
        onChange={onChange}
        color="#3b82f6"
        minDate={minDate}
      />
    </div>
  );
};
