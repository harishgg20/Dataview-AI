"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from "recharts";

export default function EDAPage() {
    // Mock Data for Histogram (Distribution)
    const histogramData = [
        { bin: "0-10", count: 20 },
        { bin: "10-20", count: 45 },
        { bin: "20-30", count: 80 },
        { bin: "30-40", count: 120 },
        { bin: "40-50", count: 90 },
        { bin: "50-60", count: 55 },
        { bin: "60-70", count: 30 },
        { bin: "70+", count: 15 },
    ];

    // Mock Data for Pie Chart (Categorical Distribution)
    const pieData = [
        { name: "Electronics", value: 400 },
        { name: "Clothing", value: 300 },
        { name: "Home", value: 300 },
        { name: "Books", value: 200 },
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Exploratory Data Analysis</h1>
                <div className="flex gap-2">
                    <Button variant="outline">Export Report</Button>
                    <Button>Run Analysis</Button>
                </div>
            </div>

            {/* Dataset Selection */}
            <Card>
                <CardContent className="py-4 flex gap-4 items-center">
                    <span className="font-medium text-sm">Active Dataset:</span>
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium">
                        clean_sales_data.csv
                    </div>
                    <span className="text-muted-foreground text-sm ml-auto">15,402 rows • 12 columns</span>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Row Count</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">15,402</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Missing Values</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-500">23</div></CardContent>
                </Card>
                {/* Statistics Enhancements: Duplicate Row Summary */}
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Duplicate Rows</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-orange-500">12</div></CardContent>
                </Card>
                {/* Statistics Enhancements: Skewness */}
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Skewness (Sales)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">1.24 <span className="text-xs text-muted-foreground font-normal">(Right Skewed)</span></div></CardContent>
                </Card>
            </div>

            {/* Charts Block */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Visualization: Histogram */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribution Analysis (Histogram)</CardTitle>
                        <CardDescription>Frequency distribution of Sales Amount</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={histogramData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="bin" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Visualization: Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Category Distribution (Pie Chart)</CardTitle>
                        <CardDescription>Sales count by Category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Features (User Request) */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Advanced: Data Profiling */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Data Profiling</CardTitle>
                        <CardDescription>Column-level health check</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm font-medium">Unique Values</span>
                            <span className="text-sm">450</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm font-medium">Distinct %</span>
                            <span className="text-sm">2.9%</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm font-medium">Zero Values</span>
                            <span className="text-sm">0</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced: Drill-down & Compare */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Advanced Exploration</CardTitle>
                        <CardDescription>Segment comparison and drill-downs</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Compare Segment A</label>
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Data</SelectItem>
                                    <SelectItem value="region_us">Region: US</SelectItem>
                                    <SelectItem value="cat_electronics">Category: Electronics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Compare Segment B</label>
                            <Select defaultValue="region_eu">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="region_eu">Region: EU</SelectItem>
                                    <SelectItem value="cat_clothing">Category: Clothing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2 mt-2 p-4 bg-slate-50 rounded-md border text-center text-muted-foreground text-sm">
                            Select segments to see side-by-side comparison stats (Skewness, Mean, Median)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
