import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconClassName?: string;
  testId?: string;
}

export function StatCard({ title, value, icon: Icon, trend, iconClassName, testId }: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn("p-2 rounded-md", iconClassName || "bg-primary/10")}>
          <Icon className={cn("h-4 w-4", iconClassName ? "text-current" : "text-primary")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground" data-testid={`${testId}-value`}>{value}</div>
        {trend && (
          <p className={cn("text-xs mt-1", trend.isPositive ? "text-chart-2" : "text-destructive")}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
