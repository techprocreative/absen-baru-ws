import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, Attendance } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: todayAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/today-all"],
  });

  const { data: weeklyStats = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/weekly"],
  });

  const totalEmployees = users.filter(u => u.role === "employee").length;
  const presentToday = todayAttendance.filter(a => a.status === "present" || a.status === "late").length;
  const absentToday = totalEmployees - presentToday;
  const lateToday = todayAttendance.filter(a => a.status === "late").length;

  const chartData = weeklyStats.length > 0 ? weeklyStats : [
    { day: "Mon", present: 45, late: 5, absent: 10 },
    { day: "Tue", present: 48, late: 3, absent: 9 },
    { day: "Wed", present: 47, late: 4, absent: 9 },
    { day: "Thu", present: 46, late: 6, absent: 8 },
    { day: "Fri", present: 44, late: 7, absent: 9 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage employees and monitor attendance</p>
        </div>
        <Button data-testid="button-add-employee">
          <Users className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          iconClassName="bg-primary/10 text-primary"
          testId="stat-total-employees"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          icon={UserCheck}
          iconClassName="bg-chart-2/10 text-chart-2"
          testId="stat-present-today"
        />
        <StatCard
          title="Absent Today"
          value={absentToday}
          icon={UserX}
          iconClassName="bg-destructive/10 text-destructive"
          testId="stat-absent-today"
        />
        <StatCard
          title="Late Arrivals"
          value={lateToday}
          icon={Clock}
          iconClassName="bg-chart-4/10 text-chart-4"
          testId="stat-late-today"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Attendance Trends</CardTitle>
          <CardDescription>Attendance statistics for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-sm" />
              <YAxis className="text-sm" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.375rem"
                }}
              />
              <Bar dataKey="present" fill="hsl(var(--chart-2))" name="Present" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" fill="hsl(var(--chart-4))" name="Late" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" fill="hsl(var(--destructive))" name="Absent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Employees</CardTitle>
          <CardDescription>Newly added team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usersLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading employees...</p>
            ) : users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                data-testid={`employee-${user.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.photoUrl || undefined} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{user.employeeId}</Badge>
                  <Badge variant={user.status === "active" ? "default" : "secondary"} className="capitalize">
                    {user.status}
                  </Badge>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No employees yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
