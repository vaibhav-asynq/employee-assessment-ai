import { format, addMinutes } from "date-fns";

/**
 * Converts a UTC timestamp to local time
 * @param timestamp - ISO string or Date object to convert
 * @param formatString - Optional format string for date-fns (default: "MMM d, yyyy h:mm a")
 * @returns The adjusted date object if no format is provided, or formatted string if format is provided
 */
export const getToLocalTime = (
  timestamp: string | Date,
  formatString?: string,
) => {
  // Parse the timestamp
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  // Get the local timezone offset in minutes
  const offsetInMinutes = new Date().getTimezoneOffset() * -1;

  // Add the timezone offset to convert to local time
  // For India (UTC+5:30), offsetInMinutes would be 330
  const adjustedDate = addMinutes(date, offsetInMinutes);

  // Return the adjusted date if no format string is provided
  // Otherwise, return the formatted string
  return formatString ? format(adjustedDate, formatString) : adjustedDate;
};
