import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, Lock } from "lucide-react";
import { Calendar, DateRange, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  fixedStartDate?: boolean;
  singleDate?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  fixedStartDate = false,
  singleDate = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    key: string;
  }>({
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    key: "selection",
  });

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({
        startDate,
        endDate,
        key: "selection",
      });
    } else if (startDate && singleDate) {
      // In single date mode, if only startDate is provided (or both equal)
      setDateRange({
        startDate,
        endDate: startDate,
        key: "selection",
      });
    }
  }, [startDate, endDate, singleDate]);

  const handleRangeSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (selection.startDate && selection.endDate) {
      setDateRange({
        startDate: selection.startDate,
        endDate: selection.endDate,
        key: "selection",
      });
    }
  };

  const handleFixedStartSelect = (date: Date) => {
    // Only update end date, keep start date from props
    if (startDate) {
      setDateRange({
        startDate: startDate,
        endDate: date,
        key: "selection",
      });
    }
  };

  const handleSingleDateSelect = (date: Date) => {
    setDateRange({
      startDate: date,
      endDate: date,
      key: "selection",
    });
  };

  const handleApply = () => {
    onChange(dateRange.startDate, dateRange.endDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    const today = new Date();
    if (fixedStartDate) {
      onChange(startDate, today);
    } else if (singleDate) {
      onChange(today, today);
    } else {
      onChange(null, null);
    }
    setDateRange({
      startDate: startDate || today,
      endDate: today,
      key: "selection",
    });
    setIsOpen(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-primary outline-none"
      >
        <CalendarIcon className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-700">
          {singleDate
            ? startDate
              ? formatDate(startDate)
              : "Select date"
            : startDate && endDate
              ? `${formatDate(startDate)} - ${formatDate(endDate)}`
              : "Select date range"}
        </span>
        {fixedStartDate && startDate && !singleDate && (
          <Lock
            className="w-3 h-3 text-slate-400"
            aria-label="Start date is fixed"
          />
        )}
        {(startDate || endDate) && !fixedStartDate && (
          <X
            className="w-4 h-4 text-slate-400 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border z-50 p-4">
          {singleDate ? (
            <Calendar
              date={dateRange.startDate}
              onChange={handleSingleDateSelect}
              color="#3b82f6"
            />
          ) : fixedStartDate ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-slate-500 mb-2">
                Start Date (Fixed):{" "}
                <span className="font-medium text-slate-700">
                  {formatDate(startDate)}
                </span>
                <div className="mt-1">Select End Date:</div>
              </div>
              <Calendar
                date={dateRange.endDate}
                onChange={handleFixedStartSelect}
                color="#3b82f6"
                minDate={startDate || undefined}
              />
            </div>
          ) : (
            <DateRange
              ranges={[dateRange]}
              onChange={handleRangeSelect}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
              rangeColors={["#3b82f6"]}
            />
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
