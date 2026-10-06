"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { useLocale } from "next-intl";
import { useMemo } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";

import "react-big-calendar/lib/css/react-big-calendar.css";

interface EventItem {
  id: string;
  title_en: string;
  title_es: string;
  start_time: string;
  end_time: string;
}
interface CalendarViewProps {
  events: EventItem[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const locale = useLocale();
  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek,
        getDay,
        // date-fns v4 exports locales as named members, not the module default.
        locales: {
          en: require("date-fns/locale/en-US").enUS,
          es: require("date-fns/locale/es").es,
        },
      }),
    [],
  );

  const mapped = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: locale === "es" ? e.title_es : e.title_en,
        start: new Date(e.start_time),
        end: new Date(e.end_time),
      })),
    [events, locale],
  );

  if (mapped.length === 0) {
    return (
      <div className="h-[700px] w-full flex items-center justify-center">
        <p>No events to display in calendar</p>
      </div>
    );
  }

  return (
    <div className="h-[700px] w-full">
      <Calendar
        localizer={localizer}
        events={mapped}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%", width: "100%" }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        defaultView={Views.MONTH}
        popup
        selectable
      />
    </div>
  );
}
