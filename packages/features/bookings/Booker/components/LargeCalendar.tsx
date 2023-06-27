import { useRouter } from "next/router";
import { useMemo } from "react";

import dayjs from "@calcom/dayjs";
import { Calendar } from "@calcom/features/calendars/weeklyview";
import type { CalendarAvailableTimeslots } from "@calcom/features/calendars/weeklyview/types/state";
import useRouterQuery from "@calcom/web/lib/hooks/useRouterQuery";

import { useTimePreferences } from "../../lib/timePreferences";
import { useBookerStore } from "../store";
import { useEvent, useScheduleForEvent } from "../utils/event";

export const LargeCalendar = ({ extraDays }: { extraDays: number }) => {
  const router = useRouter();
  const { date: selectedDate = dayjs().format("YYYY-MM-DD") } = useRouterQuery("date");
  // const date = selectedDate;
  const selectedEventDuration = useBookerStore((state) => state.selectedDuration);
  const schedule = useScheduleForEvent({
    prefetchNextMonth:
      !!extraDays && dayjs(selectedDate).month() !== dayjs(selectedDate).add(extraDays, "day").month(),
  });
  const { timezone } = useTimePreferences();

  const event = useEvent();
  const eventDuration = selectedEventDuration || event?.data?.length || 30;

  const availableSlots = useMemo(() => {
    const availableTimeslots: CalendarAvailableTimeslots = {};
    if (!schedule.data) return availableTimeslots;
    if (!schedule.data.slots) return availableTimeslots;

    for (const day in schedule.data.slots) {
      availableTimeslots[day] = schedule.data.slots[day].map((slot) => ({
        // First formatting to LLL and then passing it to date prevents toDate()
        // from changing the timezone to users local machine (instead of itmezone selected in UI dropdown)
        start: new Date(dayjs(slot.time).utc().tz(timezone).format("LLL")),
        end: new Date(dayjs(slot.time).utc().tz(timezone).add(eventDuration, "minutes").format("LLL")),
      }));
    }

    return availableTimeslots;
  }, [schedule, timezone, eventDuration]);

  return (
    <div className="h-full [--calendar-dates-sticky-offset:66px]">
      <Calendar
        isLoading={schedule.isLoading}
        availableTimeslots={availableSlots}
        startHour={0}
        endHour={23}
        events={[]}
        startDate={selectedDate ? new Date(selectedDate) : new Date()}
        endDate={dayjs(selectedDate).add(extraDays, "day").toDate()}
        onEmptyCellClick={(date) => {
          if (typeof window === undefined) return;
          const url = new URL(window.location.href);
          url.searchParams.set("month", dayjs(date).format("YYYY-MM"));
          url.searchParams.set("date", dayjs(selectedDate).format("YYYY-MM-DD"));
          url.searchParams.set("slot", dayjs(date).format());
          router.push(url, url, { shallow: true });
        }}
        gridCellsPerHour={60 / eventDuration}
        hoverEventDuration={eventDuration}
        hideHeader
      />
    </div>
  );
};
