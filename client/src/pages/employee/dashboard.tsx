import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { Clock, Calendar, TrendingUp, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Attendance } from "@shared/schema";

export default function EmployeeDashboard() {
  const { toast } = useToast();
  const [currentMonth] = useState(new Date());
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);

  const { data: attendanceRecords = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/my-records"],
  });

  const { data: todayAttendance } = useQuery<Attendance | null>({
    queryKey: ["/api/attendance/today"],
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      setIsFaceVerifying(true);
      // Simulate face verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await apiRequest("POST", "/api/attendance/check-in", {});
    },
    onSuccess: () => {
      toast({
        title: "Check-in successful",
        description: "Your attendance has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsFaceVerifying(false);
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      setIsFaceVerifying(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await apiRequest("POST", "/api/attendance/check-out", {});
    },
    onSuccess: () => {
      toast({
        title: "Check-out successful",
        description: "Have a great day!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/my-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsFaceVerifying(false);
    },
  });

  const presentDays = attendanceRecords.filter(r => r.status === "present").length;
  const lateDays = attendanceRecords.filter(r => r.status === "late").length;
  const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  const hasCheckedIn = todayAttendance?.checkInTime;
  const hasCheckedOut = todayAttendance?.checkOutTime;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back!</h1>
        <p className="text-muted-foreground mt-1">Track your attendance and manage your profile</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {hasCheckedIn && !hasCheckedOut ? "You're checked in!" : "Ready to start your day?"}
              </h2>
              <p className="text-muted-foreground">
                {hasCheckedIn && !hasCheckedOut 
                  ? `Checked in at ${format(new Date(todayAttendance.checkInTime!), "h:mm a")}`
                  : hasCheckedOut
                  ? "You've completed your day. See you tomorrow!"
                  : "Click below to check in using facial recognition"
                }
              </p>
              {todayAttendance && (
                <Badge variant={todayAttendance.status === "present" ? "default" : "destructive"} className="capitalize">
                  {todayAttendance.status}
                </Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => checkInMutation.mutate()}
                disabled={hasCheckedIn || isFaceVerifying}
                data-testid="button-check-in"
              >
                <UserCheck className="mr-2 h-5 w-5" />
                {isFaceVerifying ? "Verifying..." : "Check In"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                disabled={!hasCheckedIn || hasCheckedOut || isFaceVerifying}
                data-testid="button-check-out"
              >
                <Clock className="mr-2 h-5 w-5" />
                {isFaceVerifying ? "Verifying..." : "Check Out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="This Month Present"
          value={presentDays}
          icon={Calendar}
          iconClassName="bg-chart-2/10 text-chart-2"
          testId="stat-present-days"
        />
        <StatCard
          title="Late Arrivals"
          value={lateDays}
          icon={Clock}
          iconClassName="bg-chart-4/10 text-chart-4"
          testId="stat-late-days"
        />
        <StatCard
          title="Total Hours"
          value={`${totalHours}h`}
          icon={TrendingUp}
          iconClassName="bg-primary/10 text-primary"
          testId="stat-total-hours"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Loading attendance calendar...</div>
          </CardContent>
        </Card>
      ) : (
        <AttendanceCalendar currentMonth={currentMonth} attendanceRecords={attendanceRecords} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your last 10 attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                data-testid={`attendance-record-${record.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{format(new Date(record.date), "MMMM d, yyyy")}</p>
                    <p className="text-muted-foreground text-xs">
                      {record.checkInTime ? format(new Date(record.checkInTime), "h:mm a") : "Not checked in"} - {record.checkOutTime ? format(new Date(record.checkOutTime), "h:mm a") : "Not checked out"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{record.hoursWorked || 0}h</span>
                  <Badge variant={record.status === "present" ? "default" : "destructive"} className="capitalize">
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
            {attendanceRecords.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
