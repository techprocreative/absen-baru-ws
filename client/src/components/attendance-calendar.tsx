import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { Attendance } from "@shared/schema";

interface AttendanceCalendarProps {
  currentMonth: Date;
  attendanceRecords: Attendance[];
}

export function AttendanceCalendar({ currentMonth, attendanceRecords }: AttendanceCalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const getAttendanceForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return attendanceRecords.find(record => record.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-chart-2/20 text-chart-2 border-chart-2/40";
      case "late":
        return "bg-chart-4/20 text-chart-4 border-chart-4/40";
      case "absent":
        return "bg-destructive/20 text-destructive border-destructive/40";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="p-2" />
          ))}
          
          {daysInMonth.map((day) => {
            const attendance = getAttendanceForDay(day);
            const status = attendance?.status || (getDay(day) === 0 || getDay(day) === 6 ? "weekend" : "");
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  "p-2 text-center rounded-md border transition-all hover-elevate",
                  isToday(day) && "ring-2 ring-primary",
                  isSameMonth(day, currentMonth) ? "text-foreground" : "text-muted-foreground",
                  getStatusColor(status)
                )}
                data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
              >
                <div className="text-sm font-medium">{format(day, "d")}</div>
                {attendance && (
                  <div className="text-xs mt-1 capitalize">{attendance.status}</div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-chart-2/20 border border-chart-2/40" />
            <span className="text-xs text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-chart-4/20 border border-chart-4/40" />
            <span className="text-xs text-muted-foreground">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/40" />
            <span className="text-xs text-muted-foreground">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted border" />
            <span className="text-xs text-muted-foreground">Weekend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
