"use client";

import { useEffect, useMemo, useState } from "react";

const getDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthKey = (dateKey) => dateKey.slice(0, 7);

const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

export default function AvailabilityCalendar({
  today,
  availableDates,
  value,
  onChange,
}) {
  const [currentMonth, setCurrentMonth] = useState("");

  // Mostrar el mes de la fecha seleccionada (por ejemplo, al editar una
  // reserva de otro mes). Si no hay fecha elegida, se muestra el mes actual.
  useEffect(() => {
    if (value) {
      setCurrentMonth(getMonthKey(value));
    } else if (today) {
      setCurrentMonth(getMonthKey(today));
    }
  }, [today, value]);

  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];

    const [year, month] = currentMonth.split("-").map(Number);

    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0));

    const mondayOffset = (firstDay.getUTCDay() + 6) % 7;

    const days = [];

    for (let i = 0; i < mondayOffset; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getUTCDate(); day++) {
      const date = new Date(Date.UTC(year, month - 1, day));

      days.push({
        number: day,
        key: getDateKey(date),
      });
    }

    return days;
  }, [currentMonth]);

  const firstAvailableMonth = today ? getMonthKey(today) : "";
  // Último mes con fechas (o el mes de la fecha elegida, si es posterior).
  const lastAvailableMonth = [
    firstAvailableMonth,
    ...availableDates.map(getMonthKey),
    value ? getMonthKey(value) : "",
  ].reduce((latest, month) => (month > latest ? month : latest), "");

  const goToPreviousMonth = () => {
    if (!currentMonth || currentMonth <= firstAvailableMonth) return;

    const [year, month] = currentMonth.split("-").map(Number);
    const previous = new Date(Date.UTC(year, month - 2, 1));

    setCurrentMonth(getDateKey(previous).slice(0, 7));
  };

  const goToNextMonth = () => {
    if (!currentMonth || currentMonth >= lastAvailableMonth) return;

    const [year, month] = currentMonth.split("-").map(Number);
    const next = new Date(Date.UTC(year, month, 1));

    setCurrentMonth(getDateKey(next).slice(0, 7));
  };

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  if (!today || !currentMonth) {
    return <p className="text-sm text-gray-500">Cargando calendario...</p>;
  }

  return (
    <div
      className="rounded-xl border border-gray-200 p-4"
      role="group"
      aria-label="Calendario de fechas disponibles"
    >
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          disabled={currentMonth <= firstAvailableMonth}
          className="rounded-lg px-3 py-2 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Mes anterior"
        >
          ←
        </button>

        <h3 className="font-semibold capitalize text-[#263B1C]">
          {getMonthLabel(currentMonth)}
        </h3>

        <button
          type="button"
          onClick={goToNextMonth}
          disabled={currentMonth >= lastAvailableMonth}
          className="rounded-lg px-3 py-2 hover:bg-gray-100 disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
        {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const isAvailable = availableSet.has(day.key);
          const isSelected = value === day.key;
          const isPast = day.key < today;

          return (
            <button
              key={day.key}
              type="button"
              disabled={!isAvailable || isPast}
              onClick={() => onChange(day.key)}
              className={`aspect-square rounded-lg text-sm font-medium transition
                ${
                  isSelected
                    ? "bg-[#263B1C] text-white"
                    : isAvailable && !isPast
                      ? "bg-[#EAF0E5] text-[#263B1C] hover:bg-[#65913C] hover:text-white"
                      : "cursor-not-allowed text-gray-300"
                }`}
              aria-pressed={isSelected}
              aria-label={day.key}
            >
              {day.number}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#EAF0E5]" />
          Día habilitado
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-gray-200" />
          No disponible
        </span>
      </div>
    </div>
  );
}
