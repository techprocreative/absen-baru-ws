import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import EmployeeDashboard from "@/pages/employee/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import EmployeesPage from "@/pages/admin/employees";
import HRDashboard from "@/pages/hr/dashboard";
import type { User } from "@shared/schema";

function AuthenticatedLayout({ children, user }: { children: React.ReactNode, user: User }) {
  const handleLogout = async () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      await fetch("/api/auth/logout", { 
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    localStorage.removeItem("auth_token");
    window.location.href = "/";
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType;
  allowedRoles: string[];
}) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect to={`/${user.role}`} />;
  }

  return (
    <AuthenticatedLayout user={user}>
      <Component />
    </AuthenticatedLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Employee Routes */}
      <Route path="/employee">
        {() => <ProtectedRoute component={EmployeeDashboard} allowedRoles={["employee"]} />}
      </Route>
      <Route path="/employee/attendance">
        {() => <ProtectedRoute component={EmployeeDashboard} allowedRoles={["employee"]} />}
      </Route>
      <Route path="/employee/profile">
        {() => <ProtectedRoute component={EmployeeDashboard} allowedRoles={["employee"]} />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/admin/employees">
        {() => <ProtectedRoute component={EmployeesPage} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/admin/attendance">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/admin/reports">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>
      <Route path="/admin/settings">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
      </Route>

      {/* HR Routes */}
      <Route path="/hr">
        {() => <ProtectedRoute component={HRDashboard} allowedRoles={["hr"]} />}
      </Route>
      <Route path="/hr/analytics">
        {() => <ProtectedRoute component={HRDashboard} allowedRoles={["hr"]} />}
      </Route>
      <Route path="/hr/reports">
        {() => <ProtectedRoute component={HRDashboard} allowedRoles={["hr"]} />}
      </Route>
      <Route path="/hr/employees">
        {() => <ProtectedRoute component={EmployeesPage} allowedRoles={["hr"]} />}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
