import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetLead } from "@/lib/googleSheets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ConsultantPerformanceChartProps {
  leads: SheetLead[];
}

const ConsultantPerformanceChart = ({ leads }: ConsultantPerformanceChartProps) => {
  // Group by consultant
  const consultantData = leads.reduce((acc, lead) => {
    const consultant = lead.consultant || 'Unassigned';
    if (!acc[consultant]) {
      acc[consultant] = { name: consultant, total: 0, booked: 0, working: 0 };
    }
    acc[consultant].total++;
    
    if (lead.status.toLowerCase().includes('booked with us')) {
      acc[consultant].booked++;
    } else if (
      lead.status.toLowerCase().includes('working') || 
      lead.status.toLowerCase().includes('proposal') ||
      lead.status.toLowerCase().includes('negotiations')
    ) {
      acc[consultant].working++;
    }
    
    return acc;
  }, {} as Record<string, { name: string; total: number; booked: number; working: number }>);

  const data = Object.values(consultantData)
    .sort((a, b) => b.total - a.total)
    .map(d => ({
      ...d,
      conversion: d.total > 0 ? ((d.booked / d.total) * 100).toFixed(1) : '0'
    }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Consultant Performance</CardTitle>
        <CardDescription>Lead distribution and conversion by consultant</CardDescription>
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
            <Legend />
            <Bar dataKey="total" fill="hsl(var(--chart-1))" name="Total Leads" radius={[8, 8, 0, 0]} />
            <Bar dataKey="working" fill="hsl(var(--chart-3))" name="Working On" radius={[8, 8, 0, 0]} />
            <Bar dataKey="booked" fill="hsl(var(--chart-5))" name="Booked" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ConsultantPerformanceChart;
