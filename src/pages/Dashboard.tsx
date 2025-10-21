import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import ConsultantDashboard from "@/components/dashboard/ConsultantDashboard";
import { authLib } from "@/lib/auth";

const Dashboard = () => {
  const [session, setSession] = useState(authLib.getSession());
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLib.isAuthenticated()) {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await authLib.logout();
    navigate('/auth');
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Tickets To Trip CRM
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {session.user.name} ({session.user.role})
              </p>
            </div>
            <div className="flex gap-2">
              {session.user.role === 'admin' && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {session.user.role === 'admin' ? <AdminDashboard /> : <ConsultantDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
