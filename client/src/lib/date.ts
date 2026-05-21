import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"

dayjs.extend(relativeTime)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

// "2026-05-23" → "Saturday, 23 May 2026"
export const formatDate = (date: string) =>
  dayjs(date).format("dddd, D MMM YYYY")

// "2026-05-23" → "23 May"
export const formatShortDate = (date: string) =>
  dayjs(date).format("D MMM")

// "09:00:00" → "9:00 AM"
export const formatTime = (time: string) =>
  dayjs(`2000-01-01 ${time}`).format("h:mm A")

// "2026-05-23T10:30:00" → "2 hours ago"
export const timeAgo = (datetime: string) =>
  dayjs(datetime).fromNow()

// Today as "YYYY-MM-DD"
export const today = () => dayjs().format("YYYY-MM-DD")

// Get start of current week (Monday)
export const startOfWeek = () =>
  dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD")

// Get array of 7 dates for current week Mon–Sun
export const currentWeekDates = (): string[] => {
  const monday = dayjs().startOf("week").add(1, "day")
  return Array.from({ length: 7 }, (_, i) =>
    monday.add(i, "day").format("YYYY-MM-DD")
  )
}

// "YYYY-MM-DD" → "Mon 23"
export const formatDayShort = (date: string) =>
  dayjs(date).format("ddd D")

// Check if date is today
export const isToday = (date: string) =>
  dayjs(date).isSame(dayjs(), "day")

export default dayjs
