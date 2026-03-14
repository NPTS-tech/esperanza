"use client";

import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
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

  const [current_view, set_current_view] = useState<View>(Views.MONTH);
  const [current_date, set_current_date] = useState(new Date());

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek,
        getDay,
        locales: {
          en: require("date-fns/locale/en-US"),
          es: require("date-fns/locale/es"),
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
      <div className="w-full flex items-center justify-center py-16">
        <p>No events to display in calendar</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Calendar
        localizer={localizer}
        events={mapped}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={current_view}
        date={current_date}
        onView={(new_view) => set_current_view(new_view)}
        onNavigate={(new_date) => set_current_date(new_date)}
        popup
        selectable
        onSelectEvent={(event) => {
          console.log("Selected event:", event);
        }}
      />
    </div>
  );
}