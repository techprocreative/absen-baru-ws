import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Users, TrendingUp, Clock, Calendar, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function HRDashboard() {
  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: departmentStats = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/departments"],
  });

  const totalEmployees = analytics?.totalEmployees || 150;
  const avgAttendance = analytics?.avgAttendanceRate || 92.5;
  const avgHoursPerDay = analytics?.avgHoursPerDay || 8.2;
  const monthlyAbsences = analytics?.monthlyAbsences || 45;

  const departmentData = departmentStats.length > 0 ? departmentStats : [
    { name: "Engineering", value: 45, color: "hsl(var(--chart-1))" },
    { name: "Sales", value: 30, color: "hsl(var(--chart-2))" },
    { name: "Marketing", value: 25, color: "hsl(var(--chart-3))" },
    { name: "Operations", value: 20, color: "hsl(var(--chart-4))" },
    { name: "HR", value: 15, color: "hsl(var(--chart-5))" },
  ];

  const recentReports = [
    { id: 1, name: "Monthly Attendance Report - November", date: "2024-11-01", status: "ready" },
    { id: 2, name: "Department Performance - Q4", date: "2024-10-15", status: "ready" },
    { id: 3, name: "Late Arrival Analysis", date: "2024-10-10", status: "ready" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HR Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights and reports</p>
        </div>
        <Button data-testid="button-export-report">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          iconClassName="bg-primary/10 text-primary"
          trend={{ value: "+12% from last month", isPositive: true }}
          testId="stat-total-employees"
        />
        <StatCard
          title="Avg Attendance Rate"
          value={`${avgAttendance}%`}
          icon={TrendingUp}
          iconClassName="bg-chart-2/10 text-chart-2"
          trend={{ value: "+2.3% from last month", isPositive: true }}
          testId="stat-avg-attendance"
        />
        <StatCard
          title="Avg Hours/Day"
          value={avgHoursPerDay}
          icon={Clock}
          iconClassName="bg-chart-3/10 text-chart-3"
          trend={{ value: "+0.5h from last month", isPositive: true }}
          testId="stat-avg-hours"
        />
        <StatCard
          title="Monthly Absences"
          value={monthlyAbsences}
          icon={Calendar}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: "-8% from last month", isPositive: true }}
          testId="stat-monthly-absences"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.375rem"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Customize your analytics view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select defaultValue="month">
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select defaultValue="all">
                <SelectTrigger data-testid="select-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select defaultValue="all">
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" data-testid="button-apply-filters">
              Apply Filters
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Download previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                data-testid={`report-${report.id}`}
              >
                <div>
                  <p className="font-medium text-foreground">{report.name}</p>
                  <p className="text-sm text-muted-foreground">Generated on {report.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Ready</Badge>
                  <Button size="sm" variant="outline" data-testid={`button-download-${report.id}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
