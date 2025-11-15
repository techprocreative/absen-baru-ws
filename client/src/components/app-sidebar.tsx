import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings,
  LogOut,
  ClipboardList,
  UserCheck
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    photoUrl?: string;
  };
  onLogout?: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const [location, setLocation] = useLocation();

  const employeeItems = [
    { title: "Dashboard", url: "/employee", icon: Home },
    { title: "My Attendance", url: "/employee/attendance", icon: Calendar },
    { title: "Profile", url: "/employee/profile", icon: UserCheck },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Employees", url: "/admin/employees", icon: Users },
    { title: "Attendance", url: "/admin/attendance", icon: ClipboardList },
    { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const hrItems = [
    { title: "Overview", url: "/hr", icon: Home },
    { title: "Analytics", url: "/hr/analytics", icon: BarChart3 },
    { title: "Reports", url: "/hr/reports", icon: ClipboardList },
    { title: "Employees", url: "/hr/employees", icon: Users },
  ];

  const items = 
    user?.role === "admin" ? adminItems :
    user?.role === "hr" ? hrItems :
    employeeItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-6 py-6">
            <h1 className="text-xl font-bold text-foreground">AttendanceHub</h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{user?.role || "Employee"} Portal</p>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoUrl} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
