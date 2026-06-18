export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  SICK: "SICK",
  EXCUSED: "EXCUSED",
  ABSENT: "ABSENT",
} as const;

export const SESSION_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
export type SessionStatus =
  (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Hadir",
  SICK: "Sakit",
  EXCUSED: "Izin",
  ABSENT: "Alpa",
};
