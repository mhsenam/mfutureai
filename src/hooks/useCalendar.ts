import { useState, useCallback } from "react";

interface CalendarDay {
  day: number | null;
  dateString: string;
  isToday: boolean;
  isSelected: boolean;
}

export function useCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  }, []);

  const formatMonthYear = useCallback((date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const getDateString = useCallback(
    (day: number) => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
    },
    [currentMonth]
  );

  const generateCalendarDays = useCallback((): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const today = new Date().toISOString().split("T")[0];

    const days: CalendarDay[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({
        day: null,
        dateString: "",
        isToday: false,
        isSelected: false,
      });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = getDateString(i);
      days.push({
        day: i,
        dateString,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
      });
    }

    return days;
  }, [
    currentMonth,
    selectedDate,
    getDaysInMonth,
    getFirstDayOfMonth,
    getDateString,
  ]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().split("T")[0]);
  }, []);

  return {
    currentMonth,
    selectedDate,
    setSelectedDate,
    formatMonthYear,
    generateCalendarDays,
    prevMonth,
    nextMonth,
    goToToday,
    getDateString,
  };
}
