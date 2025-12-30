"use client";

import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartRendererProps {
    config: {
        type: 'bar' | 'line' | 'scatter' | 'area' | 'histogram' | 'pie' | 'radar' | 'radialBar' | 'boxplot' | 'correlation';
        xAxis: string;
        yAxis: string;
        isPivot?: boolean;
        agg?: string;
    };
    data: any[];
    loading?: boolean;
    error?: string | null;
    onPointClick?: (data: any) => void;
    height?: number | string;
}

export function ChartRenderer({ config, data = [], loading = false, error = null, onPointClick, height = 300 }: ChartRendererProps) {

    // transform data for pie/radial if needed
    const chartData = useMemo(() => {
        return data;
    }, [data]);

    if (loading) {
        return <Skeleton className="w-full rounded-lg" style={{ height }} />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-red-500 bg-red-50 border border-red-100 rounded-lg p-4" style={{ height }}>
                <AlertCircle className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center text-muted-foreground bg-slate-50 border border-slate-100 rounded-lg" style={{ height }}>
                <p className="text-sm">No data available</p>
            </div>
        );
    }

    const commonProps = {
        data: chartData,
        onClick: (state: any) => {
            if (onPointClick && state && state.activePayload && state.activePayload.length > 0) {
                // Recharts click payload structure varies, simpler to pass the raw data point
                onPointClick(state.activePayload[0].payload);
            }
        }
    };

    const renderChart = () => {
        switch (config.type) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={config.xAxis} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey={config.yAxis} fill="#3b82f6" radius={[4, 4, 0, 0]} onClick={(data: any) => onPointClick && onPointClick(data)} />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={config.xAxis} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey={config.yAxis} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={config.xAxis} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey={config.yAxis} stroke="#3b82f6" fill="#eff6ff" />
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey={config.yAxis}
                            nameKey={config.xAxis}
                            onClick={(data: any) => onPointClick && onPointClick(data)}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                );
            case 'scatter':
                return (
                    <ScatterChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey={config.xAxis} name={config.xAxis} fontSize={12} />
                        <YAxis type="number" dataKey={config.yAxis} name={config.yAxis} fontSize={12} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px' }} />
                        <Scatter name="Data" data={chartData} fill="#3b82f6" cursor="pointer" onClick={(data: any) => onPointClick && onPointClick(data.payload)} />
                    </ScatterChart>
                );
            // Default fallback
            default:
                return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Unsupported chart type: {config.type}
                    </div>
                );
        }
    };

    return (
        <ResponsiveContainer width="100%" height={height as any}>
            {renderChart()}
        </ResponsiveContainer>
    );
}
