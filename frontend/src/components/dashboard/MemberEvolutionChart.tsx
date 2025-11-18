import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface MemberEvolutionChartProps {
    data?: Array<{
        month: string;
        new_members: number;
        total_members: number;
    }>;
    isLoading: boolean;
}

export function MemberEvolutionChart({ data, isLoading }: MemberEvolutionChartProps) {
    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-base font-semibold text-gray-900">Evolução de Membros</CardTitle>
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
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900">Evolução de Membros</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                                dy={8}
                            />
                            <YAxis 
                                yAxisId="left" 
                                orientation="left" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6b7280', fontSize: 11 }}
                            />
                            <YAxis 
                                yAxisId="right" 
                                orientation="right" 
                                axisLine={false} 
                                tickLine={false} 
                                hide
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
                                yAxisId="left" 
                                dataKey="new_members" 
                                name="Novos Membros" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]} 
                                barSize={20} 
                            />
                            <Line 
                                yAxisId="right" 
                                type="monotone" 
                                dataKey="total_members" 
                                name="Total de Membros" 
                                stroke="#8b5cf6" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }} 
                                activeDot={{ r: 6 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
