import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetLead } from "@/lib/googleSheets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ConversionFunnelChartProps {
  leads: SheetLead[];
}

const ConversionFunnelChart = ({ leads }: ConversionFunnelChartProps) => {
  const stages = [
    { name: "New/Unfollowed", filter: (l: SheetLead) => l.status.toLowerCase().includes('unfollowed') || l.status.toLowerCase().includes('follow-up'), color: "hsl(var(--chart-1))" },
    { name: "WhatsApp/Contact", filter: (l: SheetLead) => l.status.toLowerCase().includes('whatsapp'), color: "hsl(var(--chart-2))" },
    { name: "Proposal Sent", filter: (l: SheetLead) => l.status.toLowerCase().includes('proposal'), color: "hsl(var(--chart-3))" },
    { name: "Negotiations", filter: (l: SheetLead) => l.status.toLowerCase().includes('negotiations') || l.status.toLowerCase().includes('hot'), color: "hsl(var(--chart-4))" },
    { name: "Booked", filter: (l: SheetLead) => l.status.toLowerCase().includes('booked with us'), color: "hsl(var(--chart-5))" },
  ];

  const data = stages.map(stage => ({
    name: stage.name,
    count: leads.filter(stage.filter).length,
    color: stage.color
  }));

  const totalLeads = leads.length;
  const bookedLeads = data[4].count;
  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : '0';

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Lead progression through stages • {conversionRate}% conversion rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--foreground))' }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnelChart;
