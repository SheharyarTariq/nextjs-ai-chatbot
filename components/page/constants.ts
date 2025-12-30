export const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

export const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const currentYear = new Date().getFullYear() - 1;
export const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - i);

import type { EventType, EventIntensity } from "@/lib/db/schema";

export const typeColors: Record<EventType, string> = {
  Run: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Yoga: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Strength: "bg-red-500/10 text-red-500 border-red-500/20",
  Mobility: "bg-green-500/10 text-green-500 border-green-500/20",
  HIIT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Recovery: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Others: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export const intensityColors: Record<EventIntensity, string> = {
  High: "bg-red-500/10 text-red-500 border-red-500/20",
  Medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  Low: "bg-green-500/10 text-green-500 border-green-500/20",
};

export const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: "Run", label: "Run" },
  { value: "Yoga", label: "Yoga" },
  { value: "Strength", label: "Strength" },
  { value: "Mobility", label: "Mobility" },
  { value: "HIIT", label: "HIIT" },
  { value: "Recovery", label: "Recovery" },
  { value: "Others", label: "Others" },
];

export const INTENSITY_LEVELS: Array<{ value: EventIntensity; label: string }> = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export const EVENT_TYPE_NAMES = EVENT_TYPES.map(t => t.value);
