"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Activity, Database, Server, Clock, FileText, Upload, RefreshCw, AlertCircle, CheckCircle,
    Zap, ShieldCheck, PieChart, Info, AlertTriangle, Layers, Table, CheckSquare
} from "lucide-react";
import { monitoringService, SystemStats } from "@/services/monitoring";
import { dataSourceService } from "@/services/dataSource";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MonitoringPage() {
    const { toast } = useToast();
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Dataset Filtering
    const [dataSources, setDataSources] = useState<any[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<string>("all");

    // Load Data Sources
    useEffect(() => {
        const loadSources = async () => {
            try {
                const sources = await dataSourceService.getAll();
                setDataSources(sources);
            } catch (err) {
                console.error("Failed to load data sources", err);
            }
        };
        loadSources();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const datasetId = selectedDataset !== "all" ? selectedDataset : undefined;
            const data = await monitoringService.getStats(datasetId);
            setStats(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to fetch monitoring stats", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Clear interval on unmount or simple refresh logic
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [selectedDataset]); // Re-fetch when filter changes

    const statusTitle = selectedDataset !== "all"
        ? `Monitoring: ${dataSources.find(d => d.id.toString() === selectedDataset)?.connection_config?.original_name || "Dataset"}`
        : "System Monitoring";

    const getStatusColor = (status: string) => {
        if (status === "Operational" || status === "Connected" || status === "On time") return "text-green-600";
        if (status === "Disconnected" || status === "Delayed") return "text-red-500";
        return "text-orange-500";
    };

    const getAlertColor = (severity: string) => {
        switch (severity) {
            case "high": return "bg-red-50 border-red-100 text-red-900";
            case "medium": return "bg-amber-50 border-amber-100 text-amber-900";
            default: return "bg-blue-50 border-blue-100 text-blue-900";
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto" suppressHydrationWarning={true}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{statusTitle}</h1>
                    <p className="text-gray-500">Real-time performance, quality, and usage metrics.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-[200px]">
                        <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Datasets" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Datasets</SelectItem>
                                {dataSources.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id.toString()}>
                                        {ds.connection_config?.original_name || ds.filename || `Dataset ${ds.id}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <Clock className="h-4 w-4" />
                        <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "..."}</span>
                        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="ml-2">
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* 1. Essential Health & Freshness & Coverage */}
            <div className="grid gap-6 md:grid-cols-4" suppressHydrationWarning>
                <Card suppressHydrationWarning>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getStatusColor(stats?.freshness?.status || "")}`}>
                            {stats?.freshness?.status || "Loading..."}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Last ingestion: {stats?.freshness?.last_ingestion ? new Date(stats.freshness.last_ingestion).toLocaleString() : "Never"}
                        </p>
                        <p className="text-xs text-muted-foreground">Expected: {stats?.freshness?.expected_refresh}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
                        <PieChart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{stats?.data_coverage?.pct}%</div>
                            <span className="text-xs text-muted-foreground">complete</span>
                        </div>
                        <div className="mt-2 space-y-1">
                            <div className="text-xs text-red-500 font-medium">Missing: {stats?.data_coverage?.missing_dates} days</div>
                            <div className="text-xs text-muted-foreground">Impact: {stats?.data_coverage?.affected_kpis.join(", ")}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Query Performance (24h)</CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <div className="text-2xl font-bold">{stats?.performance?.avg_query_time_ms || "-"} ms</div>
                                <p className="text-xs text-muted-foreground">Avg query time</p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">{stats?.performance?.cached_queries_pct}%</div>
                                <p className="text-xs text-muted-foreground">Cache hit rate</p>
                            </div>
                        </div>
                        <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Slowest: {stats?.performance?.slowest_query_s}s
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Insight Quality</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">High Confidence (&gt;90%)</span>
                                <span className="font-bold text-green-600">{stats?.insight_quality?.high || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Medium</span>
                                <span className="font-bold text-amber-600">{stats?.insight_quality?.medium || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Low</span>
                                <span className="font-bold text-red-500">{stats?.insight_quality?.low || 0}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Dataset Health Table (New) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-gray-500" />
                        Dataset Health Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto" suppressHydrationWarning>
                        <table className="w-full text-sm text-left" suppressHydrationWarning>
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Dataset Name</th>
                                    <th className="px-4 py-3">Freshness</th>
                                    <th className="px-4 py-3">Quality Check</th>
                                    <th className="px-4 py-3">Last Query</th>
                                </tr>
                            </thead>
                            <tbody suppressHydrationWarning>
                                {stats?.dataset_health && stats.dataset_health.length > 0 ? (
                                    stats.dataset_health.map((ds, i) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{ds.name}</td>
                                            <td className="px-4 py-3">
                                                {ds.freshness === "healthy" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Healthy
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Warning
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {ds.quality === "healthy" ? (
                                                    <span className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Passed</span>
                                                ) : (
                                                    <span className="flex items-center text-red-600"><AlertCircle className="w-4 h-4 mr-1" /> Critical</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{ds.last_query}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr suppressHydrationWarning><td colSpan={4} className="px-4 py-3 text-center text-gray-500" suppressHydrationWarning>No datasets found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Alerts & Schema Changes Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Data Quality & Schema Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Quality & Schema Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {/* Schema Changes */}
                            {stats?.schema_changes?.map((change, i) => (
                                <div key={`schema-${i}`} className="flex gap-3 items-start p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <Table className="h-4 w-4 text-purple-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-purple-900">Schema Change Detected</p>
                                        <p className="text-xs text-purple-700">{change.detail}: <span className="font-mono">{change.column}</span></p>
                                    </div>
                                </div>
                            ))}

                            {/* Quality Alerts */}
                            {stats?.data_quality_alerts?.map((alert, i) => (
                                <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                                    <Info className="h-4 w-4 mt-0.5" />
                                    <p className="text-sm font-medium">{alert.message}</p>
                                </div>
                            ))}

                            {(!stats?.data_quality_alerts?.length && !stats?.schema_changes?.length) && (
                                <p className="text-sm text-gray-500">No active alerts.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed with Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Insight Actions</CardTitle>
                        <CardDescription>Recent generated insights and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {stats?.activity && stats.activity.length > 0 ? (
                                stats.activity.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center border ${item.type === 'insight' ? 'bg-purple-100 border-purple-200 text-purple-600' : 'bg-blue-100 border-blue-200 text-blue-600'}`}>
                                                {item.type === 'insight' ? <Activity className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none">{item.message}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(item.time).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Action Status Badge */}
                                        {item.status && (
                                            <div className={`text-xs px-2 py-1 rounded-full border capitalize
                                                ${item.status === 'actioned' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                ${item.status === 'in_review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                                ${item.status === 'acknowledged' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                ${item.status === 'ignored' ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}
                                            `}>
                                                {item.status.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-500">No recent activity found.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
