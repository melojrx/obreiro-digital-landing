import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface VisitorStatsChartProps {
    data?: Array<{
        month: string;
        visitors: number;
        converted: number;
    }>;
    isLoading: boolean;
}

export function VisitorStatsChart({ data, isLoading }: VisitorStatsChartProps) {
    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <CardTitle className="text-base font-semibold text-gray-900">Evolução de Visitantes</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[280px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm transition-all hover:shadow-md">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">Evolução de Visitantes</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                dy={8}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e5e7eb', 
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
                                }}
                                itemStyle={{ fontSize: '12px', color: '#374151' }}
                            />
                            <Legend 
                                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} 
                                iconType="circle"
                                iconSize={8}
                            />
                            <Bar 
                                dataKey="visitors" 
                                name="Visitantes" 
                                fill="#10b981" 
                                radius={[4, 4, 0, 0]} 
                                barSize={16}
                            />
                            <Bar 
                                dataKey="converted" 
                                name="Convertidos" 
                                fill="#34d399" 
                                radius={[4, 4, 0, 0]} 
                                barSize={16}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
