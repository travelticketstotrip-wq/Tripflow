import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetLead } from "@/lib/googleSheetsBackend";
import { TrendingUp, Target, AlertCircle, Trophy } from "lucide-react";

interface KeyMetricsCardsProps {
  leads: SheetLead[];
}

const KeyMetricsCards = ({ leads }: KeyMetricsCardsProps) => {
  const totalLeads = leads.length;
  const bookedLeads = leads.filter(l => l.status.toLowerCase().includes('booked with us')).length;
  const newLeads = leads.filter(l => l.status.toLowerCase().includes('unfollowed') || l.status.toLowerCase().includes('follow-up')).length;
  const hotLeads = leads.filter(l => l.status.toLowerCase().includes('hot') || l.status.toLowerCase().includes('negotiations')).length;
  
  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0';
  const activeRate = totalLeads > 0 ? (((totalLeads - newLeads) / totalLeads) * 100).toFixed(1) : '0';

  const metrics = [
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      description: `${bookedLeads} of ${totalLeads} leads converted`,
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      trend: parseFloat(conversionRate) >= 10 ? "Good" : "Needs Focus"
    },
    {
      title: "Active Engagement",
      value: `${activeRate}%`,
      description: `${totalLeads - newLeads} leads being worked on`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      trend: parseFloat(activeRate) >= 70 ? "Good" : "Needs Focus"
    },
    {
      title: "Hot Leads",
      value: hotLeads,
      description: "High priority leads requiring attention",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      trend: "Focus Here"
    },
    {
      title: "New/Unfollowed",
      value: newLeads,
      description: "Leads awaiting initial contact",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      trend: newLeads > 50 ? "Action Needed" : "Under Control"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className={`${metric.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
              <CardDescription className="mt-1">
                {metric.description}
              </CardDescription>
              <div className="mt-2 text-xs font-medium">
                <span className={
                  metric.trend === "Good" ? "text-green-600" : 
                  metric.trend === "Focus Here" ? "text-orange-600" : 
                  "text-red-600"
                }>
                  {metric.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KeyMetricsCards;
