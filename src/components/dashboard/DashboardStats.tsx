import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetLead } from "@/lib/googleSheets";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";

interface DashboardStatsProps {
  leads: SheetLead[];
}

const DashboardStats = ({ leads }: DashboardStatsProps) => {
  const totalLeads = leads.length;
  const bookedLeads = leads.filter(lead => 
    lead.status.toLowerCase().includes('booked with us')
  ).length;
  const workingLeads = leads.filter(lead => 
    lead.status.toLowerCase().includes('working') || 
    lead.status.toLowerCase().includes('proposal') ||
    lead.status.toLowerCase().includes('negotiations')
  ).length;
  const newLeads = leads.filter(lead => 
    lead.status.toLowerCase().includes('unfollowed') ||
    lead.status.toLowerCase().includes('follow-up')
  ).length;

  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0';

  const stats = [
    {
      title: "Total Leads",
      value: totalLeads,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "New Leads",
      value: newLeads,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Working On",
      value: workingLeads,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      title: "Booked",
      value: bookedLeads,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.title === "Booked" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversionRate}% conversion rate
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardStats;
