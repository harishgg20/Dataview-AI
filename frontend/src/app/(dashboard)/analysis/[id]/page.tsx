"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { projectService, Project } from "@/services/project";
import { dataSourceService } from "@/services/dataSource";
import { analysisService, SavedChart } from "@/services/analysis";
import { aiService } from "@/services/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, Search, Sparkles, Trash2, BarChart2, Filter, Save, Grid, Plus, BarChart3, Info, Pencil, X, MessageSquare, Send, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar,
    ComposedChart, ErrorBar, ReferenceLine, Rectangle
} from 'recharts';
import { DataCleaningPanel } from "@/components/analysis/DataCleaningPanel";
import { PinChartModal } from "@/components/dashboard/PinChartModal";
import { Pin } from "lucide-react";
import { VirtualDataGrid } from "@/components/analysis/VirtualDataGrid";
import { useToast, Toaster } from "@/components/ui/use-toast";
import { DashboardGrid } from "@/components/analysis/DashboardGrid";
import { GlobalSlicer } from "@/components/analysis/GlobalSlicer";
import { useDashboardStore } from "@/store/dashboardStore";
import { ChartBuilder } from "@/components/analysis/ChartBuilder";
import { FilterBuilder } from "@/components/analysis/FilterBuilder";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { MessageCircle } from "lucide-react";


interface FilterRule {
    id: string;
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains';
    value: string;
}

export default function ProjectDetailPage() {
    const { toast } = useToast();
    const { isEditMode, toggleEditMode, addGlobalFilter } = useDashboardStore();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Debug logging for params
    useEffect(() => {
        console.log("ProjectDetailPage Params:", params);
    }, [params]);

    const rawId = params?.id;
    const id = Number(rawId);

    // Filter Logic on Mount
    useEffect(() => {
        const filterCol = searchParams.get('filter_col');
        const filterVal = searchParams.get('filter_val');

        if (filterCol && filterVal) {
            // Check if we already have this filter to avoid duplicates
            addGlobalFilter({
                id: `auto-${Date.now()}`,
                column: filterCol,
                operator: 'contains', // safe default
                value: filterVal
            });
            // Clean up URL to avoid re-applying on refresh
            router.replace(`/analysis/${id}?tab=overview`);
            toast({ title: "Filter Applied", description: `Filtered dashboard by ${filterCol}: ${filterVal}`, variant: "default" });
        }
    }, [searchParams, id, addGlobalFilter, router, toast]);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    // Cleaning State
    const [cleaningOperations, setCleaningOperations] = useState<any[]>([]);
    const [newOperation, setNewOperation] = useState<{ type: string, params: any }>({ type: 'drop_duplicates', params: {} });

    // Preview Interaction State
    const [sortConfig, setSortConfig] = useState<{ col: string; direction: 'asc' | 'desc' } | null>(null);
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    // New Filter Draft
    const [newFilter, setNewFilter] = useState<FilterRule>({ id: '', column: '', operator: 'contains', value: '' });

    // Correlation State
    const [correlationData, setCorrelationData] = useState<{ matrix: { x: string, y: string, value: number }[], columns: string[] } | null>(null);
    const [dataSources, setDataSources] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [previewData, setPreviewData] = useState<{
        filename: string;
        columns: string[];
        dtypes: Record<string, string>;
        total_rows: number;
        total_columns: number;
        data: any[];
    } | null>(null);

    // Database Connection State
    const [dbConfig, setDbConfig] = useState({ host: "", port: "5432", user: "", password: "", database: "", query: "SELECT * FROM public.users LIMIT 1000", type: "postgres", name: "My Database" });
    const [dbLoading, setDbLoading] = useState(false);

    const handleDbConnect = async () => {
        setDbLoading(true);
        try {
            // Construct Connection String
            const connStr = `${dbConfig.type}ql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

            await dataSourceService.connect({
                project_id: id,
                name: dbConfig.name,
                type: dbConfig.type as any,
                connection_string: connStr, // simplistic construction
                query: dbConfig.query
            });

            toast({ title: "Connected", description: "Database connected successfully.", variant: "success" });

            // Refresh list
            const sources = await dataSourceService.getAll();
            setDataSources(sources.filter((s: any) => s.project_id === id));

            // Reset form?
            // setDbConfig({...dbConfig, password: ""});
        } catch (err: any) {
            console.error(err);
            toast({ title: "Connection Failed", description: err.response?.data?.detail || "Could not connect to database.", variant: "destructive" });
        } finally {
            setDbLoading(false);
        }
    };

    // PDF Export
    const dashboardRef = useRef<HTMLDivElement>(null);
    const handleExportPDF = async () => {
        const element = dashboardRef.current;
        if (!element) return;
        try {
            toast({ title: "Generating PDF...", description: "Please wait while we capture the dashboard." });
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`dashboard-report-${id}.pdf`);
            toast({ title: "Success", description: "Report downloaded successfully.", variant: "success" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
        }
    };

    // EDA State
    const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
    const [edaView, setEdaView] = useState<'preview' | 'stats' | 'chart' | 'correlation' | 'compare'>('preview');
    const [statsData, setStatsData] = useState<any>(null);
    const [chartConfig, setChartConfig] = useState<{
        type: 'bar' | 'line' | 'scatter' | 'area' | 'histogram' | 'pie' | 'radar' | 'radialBar' | 'boxplot' | 'correlation';
        xAxis: string;
        yAxis: string;
        isPivot?: boolean;
        agg?: 'sum' | 'avg' | 'count' | 'min' | 'max';
        showAverage?: boolean;
        showMedian?: boolean;
        showOutliers?: boolean;
    }>({ type: 'bar', xAxis: '', yAxis: '', isPivot: false, agg: 'sum', showAverage: false, showMedian: false, showOutliers: false });

    // Chart Options
    const [limitConfig, setLimitConfig] = useState<{ enabled: boolean; type: 'top' | 'bottom' | 'gt' | 'lt'; value: number }>({ enabled: true, type: 'top', value: 10 });
    const [showChart, setShowChart] = useState(false);

    // Backend Aggregated Chart Data
    const [chartData, setChartData] = useState<any[]>([]);
    const [chartLoading, setChartLoading] = useState(false);

    // Saved Charts State
    const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
    const [savedChartsLoading, setSavedChartsLoading] = useState(false);

    // Pin Modal
    // Pin Modal
    const [pinModalOpen, setPinModalOpen] = useState(false);

    // AI Chat State
    const [aiChatOpen, setAiChatOpen] = useState(false);

    // Ask Data State
    const [askQuestion, setAskQuestion] = useState("");
    const [askLoading, setAskLoading] = useState(false);
    const [askResult, setAskResult] = useState<{ answer: string; chart?: any } | null>(null);

    // Comparison State
    const [segment1Filters, setSegment1Filters] = useState<FilterRule[]>([]);
    const [segment2Filters, setSegment2Filters] = useState<FilterRule[]>([]);
    const [comparisonResult, setComparisonResult] = useState<any>(null);
    const [comparing, setComparing] = useState(false);

    // --- Actions ---

    const fetchSavedCharts = () => {
        if (!params.id) return;
        setSavedChartsLoading(true);
        analysisService.getProjectCharts(params.id as string)
            .then(setSavedCharts)
            .catch(err => console.error("Failed to load saved charts", err))
            .finally(() => setSavedChartsLoading(false));
    };

    const handleSaveChart = async () => {
        const name = prompt("Enter a name for this chart:");
        if (!name) return;

        try {
            await analysisService.saveChart(params.id as string, {
                name,
                data_source_id: activeSourceId ?? undefined,
                config: {
                    chartConfig,
                    filterRules,
                    limitConfig
                }
            });
            alert("Chart saved!");
            fetchSavedCharts();
        } catch (error) {
            console.error(error);
            alert("Failed to save chart");
        }
    };

    const handleLoadChart = (chart: SavedChart) => {
        if (!confirm(`Load chart "${chart.name}"? This will overwrite current settings.`)) return;

        const cfg = chart.config;
        if (cfg.chartConfig) setChartConfig(cfg.chartConfig);
        if (cfg.filterRules) setFilterRules(cfg.filterRules);
        if (cfg.limitConfig) setLimitConfig(cfg.limitConfig);

        if (chart.data_source_id && chart.data_source_id !== activeSourceId) {
            setActiveSourceId(chart.data_source_id);
        }

        setShowChart(true);
    };

    const handleDeleteChart = async (id: number) => {
        if (!confirm("Are you sure you want to delete this saved chart?")) return;
        try {
            await analysisService.deleteChart(id);
            setSavedCharts(savedCharts.filter(c => c.id !== id));
        } catch (error) {
            alert("Failed to delete chart");
        }
    };

    // --- In-Dashboard Creation ---
    const [showChartBuilder, setShowChartBuilder] = useState(false);

    const handleSaveNewVisual = async (config: any, name: string) => {
        try {
            await analysisService.saveChart(params.id as string, {
                name,
                data_source_id: activeSourceId ?? undefined,
                config: {
                    chartConfig: config,
                    filterRules: [], // clean start
                    limitConfig: { enabled: true, type: 'top', value: 10 }
                }
            });
            setShowChartBuilder(false);
            toast({ title: "Visual Added", description: "Chart added to dashboard successfully.", variant: "success" });
            fetchSavedCharts();
        } catch (error) {
            console.error("Failed to save visual", error);
            toast({ title: "Error", description: "Failed to save chart.", variant: "destructive" });
        }
    };

    const handleNewChart = () => {
        setChartConfig({ type: 'bar', xAxis: '', yAxis: '', isPivot: false, agg: 'sum', showAverage: false, showMedian: false });
        setFilterRules([]);
        setLimitConfig({ enabled: true, type: 'top', value: 10 });
        setShowChart(false);
    };

    // --- Dashboard Store Management ---
    const { clearGlobalFilters, clearAllSelections } = useDashboardStore();
    useEffect(() => {
        // Cleanup when leaving the project page
        return () => {
            clearGlobalFilters();
            clearAllSelections();
        };
    }, []);

    // --- Effects ---

    // 1. Initial Load (Project, Data Sources, Saved Charts)
    useEffect(() => {
        if (!id || isNaN(id)) {
            console.log("Invalid or missing project ID:", params.id);
            return;
        }

        const loadAll = async () => {
            try {
                // Load Project
                const p = await projectService.getOne(id);
                setProject(p);

                // Load Data Sources
                const sources = await dataSourceService.getAll();
                const projSources = sources.filter((s: any) => s.project_id === id);
                setDataSources(projSources);

                // Set Active Source if needed
                if (projSources.length > 0 && !activeSourceId) {
                    setActiveSourceId(projSources[0].id);
                }

                // Load Saved Charts
                fetchSavedCharts();

            } catch (err) {
                console.error("Load error:", err);
                // setError("Failed to load project data"); // Defined? Not in view.
            } finally {
                setLoading(false);
            }
        };

        loadAll();
    }, [id]);

    // 2. Automatically load columns/preview when active source changes
    useEffect(() => {
        if (!activeSourceId) return;

        const fetchColumns = async () => {
            try {
                // Fetch a small preview to get columns/dtypes
                const data = await dataSourceService.getPreview(parseInt(activeSourceId.toString()));
                setPreviewData(data);
            } catch (err) {
                console.error("Failed to load dataset columns", err);
            }
        };

        fetchColumns();
    }, [activeSourceId]);


    // 2. Fetch Aggregated Chart Data
    useEffect(() => {
        if (!activeSourceId || !showChart || !chartConfig.xAxis || !chartConfig.yAxis) return;

        const fetchData = async () => {
            setChartLoading(true);
            try {
                // Map Frontend Filters to Backend Schema
                const backendFilters = filterRules.map(f => ({
                    column: f.column,
                    operator: f.operator,
                    value: f.value
                }));

                // Determine Sort Order for Top/Bottom N
                let sortBy: string | undefined = undefined;
                let sortDir: string | undefined = undefined;

                if (limitConfig.enabled && (limitConfig.type === 'top' || limitConfig.type === 'bottom')) {
                    if (chartConfig.isPivot || (chartConfig.xAxis && chartConfig.agg)) {
                        // Sort by the aggregated value (Y Axis)
                        sortBy = chartConfig.yAxis;
                        sortDir = limitConfig.type === 'top' ? 'desc' : 'asc';
                    }
                }

                const query: any = {
                    filters: backendFilters,
                    group_by: chartConfig.isPivot ? chartConfig.xAxis : undefined,
                    agg_column: (chartConfig.isPivot || chartConfig.agg) ? chartConfig.yAxis : undefined,
                    agg_method: chartConfig.agg,
                    limit: limitConfig.enabled ? limitConfig.value : 5000,
                    sort_by: sortBy,
                    sort_direction: sortDir
                };

                if (!chartConfig.isPivot) {
                    delete query.group_by;
                    delete query.agg_method;
                    delete query.agg_column;
                }

                console.log("Fetching chart data:", query);
                const result = await dataSourceService.queryData(activeSourceId, query);
                setChartData(result.data);
            } catch (err) {
                console.error("Chart data fetch error:", err);
            } finally {
                setChartLoading(false);
            }
        };

        // Debounce
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);

    }, [activeSourceId, showChart, chartConfig, filterRules, limitConfig]);

    const filteredData = (() => {
        if (!previewData) return [];
        let data = [...previewData.data];

        // Filter
        // Filter
        filterRules.forEach(rule => {
            if (!rule.column) return;

            data = data.filter(row => {
                const val = row[rule.column];
                const filterVal = rule.value;

                // Numeric conversion for numeric ops
                const isNumericOp = ['gt', 'lt', 'gte', 'lte'].includes(rule.operator);
                const nVal = Number(val);
                const nFilter = Number(filterVal);

                if (isNumericOp && (isNaN(nVal) || isNaN(nFilter))) return false; // Skip invalid numeric comparisons

                switch (rule.operator) {
                    case 'eq': return String(val).toLowerCase() == String(filterVal).toLowerCase();
                    case 'neq': return String(val).toLowerCase() != String(filterVal).toLowerCase();
                    // Numeric Only
                    case 'gt': return nVal > nFilter;
                    case 'lt': return nVal < nFilter;
                    case 'gte': return nVal >= nFilter;
                    case 'lte': return nVal <= nFilter;
                    // String
                    case 'contains': return String(val ?? '').toLowerCase().includes(String(filterVal).toLowerCase());
                    case 'not_contains': return !String(val ?? '').toLowerCase().includes(String(filterVal).toLowerCase());
                    default: return true;
                }
            });
        });

        // Sort
        if (sortConfig) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.col];
                const bVal = b[sortConfig.col];

                if (aVal === bVal) return 0;

                // Handle nulls
                if (aVal === null) return 1;
                if (bVal === null) return -1;

                const comparison = aVal < bVal ? -1 : 1;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return data;
    })();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        try {
            const newSource = await dataSourceService.uploadFile(id, file); // Expecting to return the source object

            // Refresh list
            const sources = await dataSourceService.getAll();
            setDataSources(sources.filter((s: any) => s.project_id === id));

            // Auto-select the new file
            setActiveSourceId(newSource.id.toString());
            handlePreview(newSource.id); // Trigger preview (sets state and active source)

        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        }
    };

    const handleDelete = async (sourceId: number) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await dataSourceService.delete(sourceId);
            // Refresh list
            const sources = await dataSourceService.getAll();
            setDataSources(sources.filter((s: any) => s.project_id === id));
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete file");
        }
    };

    const handlePreview = async (sourceId: number) => {
        try {
            setActiveSourceId(sourceId);
            const data = await dataSourceService.getPreview(sourceId);
            setPreviewData(data);
            setActiveTab("eda");
            setEdaView('preview'); // Reset view on new file load
            setStatsData(null); // Clear old stats
            setChartConfig({ type: 'bar', xAxis: '', yAxis: '', isPivot: false, agg: 'sum', showAverage: false, showMedian: false }); // Clear chart config
            // setShowChart(false); // This variable is not defined in the provided code, commenting out.
        } catch (error) {
            console.error("Failed to preview", error);
            alert("Failed to load preview");
        }
    };

    const handleLoadStats = async (sourceId: number) => {
        setEdaView('stats');
        if (statsData) return; // Don't reload if already loaded
        try {
            const data = await dataSourceService.getStatistics(sourceId);
            setStatsData(data); // Store the full response (summary + column_stats)
        } catch (error) {
            console.error("Failed to load stats", error);
            alert("Failed to load statistics");
        }
    };

    const handleLoadCorrelation = async (sourceId: number) => {
        setEdaView('correlation');
        if (correlationData) return;
        try {
            const data = await dataSourceService.getCorrelation(sourceId);
            setCorrelationData(data);
        } catch (error) {
            console.error("Failed to load correlation", error);
            alert("Failed to load correlation matrix");
        }
    };

    const handleCompareSegments = async () => {
        if (!activeSourceId) return;
        setComparing(true);
        try {
            const data = await dataSourceService.compareSegments(
                parseInt(activeSourceId.toString()),
                { name: "Segment A", filters: segment1Filters },
                { name: "Segment B", filters: segment2Filters }
            );
            setComparisonResult(data);
        } catch (error) {
            console.error("Comparison failed", error);
            alert("Failed to compare segments");
        } finally {
            setComparing(false);
        }
    };

    const handleAskData = async () => {
        if (!activeSourceId || !askQuestion.trim()) return;
        setAskLoading(true);
        setAskResult(null);
        try {
            const result = await aiService.askData(parseInt(activeSourceId.toString()), askQuestion);
            setAskResult(result);

            // If chart returned, set it up
            if (result.chart) {
                setChartConfig({
                    ...chartConfig, // keep defaults
                    type: result.chart.type,
                    xAxis: result.chart.xAxis,
                    yAxis: result.chart.yAxis,
                    agg: result.chart.agg || 'sum',
                    isPivot: false
                });
                // Trigger chart load? Use effect dependency.
                // We might need to manually set showChart to true if we render it immediately.
                setShowChart(true);
            }
        } catch (error) {
            console.error("Ask Data failed", error);
            alert("Failed to get answer from AI");
        } finally {
            setAskLoading(false);
        }
    };

    const handleApplyCleaning = async () => {
        if (cleaningOperations.length === 0) return;
        if (!confirm("This will permanently modify the dataset. Continue?")) return;

        try {
            if (activeSourceId) {
                await dataSourceService.cleanData(activeSourceId, cleaningOperations);
                alert("Cleaning applied successfully!");
                setCleaningOperations([]); // Clear queue
                // reload data
                handlePreview(activeSourceId);
            }
        } catch (e) {
            console.error("Cleaning failed", e);
            alert("Failed to apply cleaning operations");
        }
    };

    const addOperation = () => {
        setCleaningOperations([...cleaningOperations, { ...newOperation }]);
    };

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.description}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="data">Data Sources</TabsTrigger>
                    <TabsTrigger value="eda">Exploratory Analysis</TabsTrigger>
                    <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
                    <TabsTrigger value="ask" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Ask AI
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="flex flex-col gap-6">
                        {/* Summary Metrics */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total datasets</CardTitle>
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{dataSources.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Saved Charts</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{savedCharts.length}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Interactive Dashboard Area */}
                        <div className="border rounded-xl bg-white shadow-sm overflow-hidden" ref={dashboardRef}>
                            <div className="flex items-center justify-between p-2 bg-slate-50 border-b">
                                <GlobalSlicer columns={previewData ? previewData.columns : []} className="flex-1" />
                                <div className="flex items-center">
                                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="ml-2 bg-white">
                                        <Download className="h-4 w-4 mr-2" /> Export
                                    </Button>
                                    <Button
                                        variant={isEditMode ? "default" : "outline"}
                                        size="sm"
                                        onClick={toggleEditMode}
                                        className={isEditMode ? "bg-blue-600 hover:bg-blue-700 ml-4 shadow-sm" : "ml-4 border-dashed"}
                                    >
                                        {isEditMode ? (
                                            <>
                                                <Save className="h-4 w-4 mr-2" /> Done Editing
                                            </>
                                        ) : (
                                            <>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit Dashboard
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50 min-h-[500px]">
                                <DashboardGrid
                                    charts={savedCharts}
                                    onAddVisual={() => {
                                        setActiveTab("eda");
                                        setEdaView("chart");
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="data">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Sources</CardTitle>
                            <CardDescription>Manage your CSV uploads and database connections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs defaultValue="file" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="file">File Upload</TabsTrigger>
                                    <TabsTrigger value="database">Database</TabsTrigger>
                                    <TabsTrigger value="web">Web Resource</TabsTrigger>
                                </TabsList>
                                <TabsContent value="file">
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg mt-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                        <input
                                            type="file"
                                            accept=".csv,.xlsx,.xls,.json,.xml"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                        />
                                        <div className="text-center space-y-3">
                                            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
                                                <Sparkles className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <Button onClick={() => fileInputRef.current?.click()} className="mb-2">
                                                    Select File
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    Supports CSV, Excel (.xlsx), JSON, XML
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="database">
                                    <div className="p-8 border rounded mt-4 bg-gray-50/50 space-y-4">
                                        <div className="flex gap-4">
                                            <div className="w-1/2 space-y-2">
                                                <Label>Database Type</Label>
                                                <Select value={dbConfig.type} onValueChange={(v: string) => setDbConfig({ ...dbConfig, type: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                                                        <SelectItem value="mysql">MySQL</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="w-1/2 space-y-2">
                                                <Label>Connection Name</Label>
                                                <Input value={dbConfig.name} onChange={e => setDbConfig({ ...dbConfig, name: e.target.value })} placeholder="e.g. Production DB" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Host</Label>
                                                <Input value={dbConfig.host} onChange={e => setDbConfig({ ...dbConfig, host: e.target.value })} placeholder="localhost" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Port</Label>
                                                <Input value={dbConfig.port} onChange={e => setDbConfig({ ...dbConfig, port: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>User</Label>
                                                <Input value={dbConfig.user} onChange={e => setDbConfig({ ...dbConfig, user: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Password</Label>
                                                <Input type="password" value={dbConfig.password} onChange={e => setDbConfig({ ...dbConfig, password: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Database Name</Label>
                                            <Input value={dbConfig.database} onChange={e => setDbConfig({ ...dbConfig, database: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>SQL Query (Select data to analyze)</Label>
                                            <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={dbConfig.query}
                                                onChange={e => setDbConfig({ ...dbConfig, query: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">Analyst works best with flat tables. Avoid complex nested JSON.</p>
                                        </div>
                                        <Button className="w-full" onClick={handleDbConnect} disabled={dbLoading}>
                                            {dbLoading ? "Connecting..." : "Connect & Import"}
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="web">
                                    <div className="p-8 border rounded mt-4 bg-gray-50/50 text-center space-y-4">
                                        <div className="p-3 bg-green-100 rounded-full w-fit mx-auto">
                                            <Search className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Web Import</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Import data from a public URL (CSV/JSON)</p>
                                            <div className="grid gap-2 max-w-sm mx-auto text-left">
                                                <input type="text" placeholder="https://example.com/data.csv" className="w-full p-2 text-sm border rounded" disabled />
                                                <Button className="w-full" disabled>Import (Coming Soon)</Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {dataSources.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-4">Uploaded Files</h3>
                                    <div className="space-y-2">
                                        {dataSources.map((source) => (
                                            <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded">
                                                        <Database className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{source.connection_config.original_name}</p>
                                                        <p className="text-xs text-muted-foreground uppercase">{source.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handlePreview(source.id)}>Preview</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(source.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="eda">
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Exploratory Data Analysis</CardTitle>
                            {previewData ? (
                                <div className="text-sm text-muted-foreground">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-semibold text-primary">{previewData.filename}</span>
                                                <div className="flex gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Database className="h-3 w-3" /> {previewData.total_rows.toLocaleString()} Rows
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Search className="h-3 w-3" /> {previewData.total_columns} Columns
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                                                    className={filterRules.length > 0 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : ""}
                                                >
                                                    Filter ({filterRules.length})
                                                </Button>
                                                <Button
                                                    variant={edaView === 'preview' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setEdaView('preview')}
                                                >
                                                    Preview
                                                </Button>
                                                <Button
                                                    variant={edaView === 'stats' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handleLoadStats(activeSourceId!)}
                                                >
                                                    Statistics
                                                </Button>
                                                <Button
                                                    variant={edaView === 'chart' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setEdaView('chart')}
                                                >
                                                    Visualizations
                                                </Button>
                                                <Button
                                                    variant={edaView === 'correlation' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handleLoadCorrelation(activeSourceId!)}
                                                >
                                                    Correlations
                                                </Button>
                                                <Button
                                                    variant={edaView === 'compare' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setEdaView('compare')}
                                                >
                                                    Compare
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <CardDescription>
                                    Select a data source from the Data tab to preview.
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 overflow-hidden">
                            {!previewData ? (
                                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Database className="h-10 w-10 mb-4 opacity-20" />
                                    <p>No data loaded.</p>
                                    <Button variant="link" onClick={() => setActiveTab("data")}>
                                        Go to Data Sources
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {edaView === 'preview' && (
                                        <div className="rounded-md border h-full overflow-hidden relative flex flex-col bg-white">
                                            {/* FILTER PANEL OVERLAY */}
                                            {showFilterPanel && (
                                                <FilterBuilder
                                                    columns={previewData.columns}
                                                    filters={filterRules}
                                                    setFilters={setFilterRules}
                                                    title="Filter Builder"
                                                    className="border-b rounded-none mb-4"
                                                />
                                            )}

                                            <div className="flex-1 overflow-hidden">
                                                <VirtualDataGrid
                                                    sourceId={typeof activeSourceId === 'string' ? parseInt(activeSourceId) : activeSourceId!}
                                                    initialColumns={previewData.columns}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {edaView === 'correlation' && correlationData && (
                                        <div className="h-full overflow-auto p-4">
                                            <h3 className="font-semibold mb-4 text-lg">Correlation Matrix (Pearson)</h3>
                                            <div className="overflow-x-auto">
                                                <div className="inline-block min-w-full">
                                                    <div className="grid gap-1" style={{
                                                        gridTemplateColumns: `auto repeat(${correlationData.columns.length}, minmax(60px, 1fr))`
                                                    }}>
                                                        {/* Header Row */}
                                                        <div className="p-2"></div>
                                                        {correlationData.columns.map(col => (
                                                            <div key={col} className="p-2 text-xs font-bold text-center truncate rotate-0" title={col}>{col.substring(0, 10)}</div>
                                                        ))}

                                                        {/* Rows */}
                                                        {correlationData.columns.map((rowCol, rIdx) => (
                                                            <Fragment key={rowCol}>
                                                                <div className="p-2 text-xs font-bold truncate text-right pr-4" title={rowCol}>{rowCol}</div>
                                                                {correlationData.columns.map((colCol, cIdx) => {
                                                                    // Find value
                                                                    const cell = correlationData.matrix.find(d => d.x === rowCol && d.y === colCol);
                                                                    const val = cell ? cell.value : 0;
                                                                    // Color Scale: -1 (Red) -> 0 (White) -> 1 (Blue)
                                                                    // Simple implementation
                                                                    let bg = 'bg-white';
                                                                    let text = 'text-gray-900';

                                                                    if (val > 0) {
                                                                        const opacity = Math.max(0.1, val);
                                                                        bg = `rgba(37, 99, 235, ${opacity})`; // Blue
                                                                        if (val > 0.5) text = 'text-white';
                                                                    } else if (val < 0) {
                                                                        const opacity = Math.max(0.1, Math.abs(val));
                                                                        bg = `rgba(220, 38, 38, ${opacity})`; // Red
                                                                        if (val < -0.5) text = 'text-white';
                                                                    }

                                                                    return (
                                                                        <div key={`${rIdx}-${cIdx}`} className="aspect-square flex items-center justify-center text-xs rounded-sm transition-transform hover:scale-110 cursor-alias border border-transparent hover:border-black"
                                                                            style={{ backgroundColor: bg }}
                                                                            title={`${rowCol} vs ${colCol}: ${val}`}
                                                                        >
                                                                            <span className={text}>{val}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {edaView === 'compare' && (
                                        <div className="h-full flex flex-col overflow-hidden">
                                            <div className="grid grid-cols-2 gap-4 p-4 border-b bg-gray-50/50 shrink-0">
                                                <FilterBuilder
                                                    title="Segment A Definition"
                                                    columns={previewData.columns}
                                                    filters={segment1Filters}
                                                    setFilters={setSegment1Filters}
                                                    className="bg-blue-50 border-blue-100"
                                                />
                                                <FilterBuilder
                                                    title="Segment B Definition"
                                                    columns={previewData.columns}
                                                    filters={segment2Filters}
                                                    setFilters={setSegment2Filters}
                                                    className="bg-orange-50 border-orange-100"
                                                />
                                            </div>

                                            <div className="p-4 border-b flex items-center justify-center bg-white shrink-0">
                                                <Button
                                                    onClick={handleCompareSegments}
                                                    disabled={comparing}
                                                    className="w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                                >
                                                    {comparing ? "Comparing..." : "Run Comparison"}
                                                </Button>
                                            </div>

                                            <div className="flex-1 overflow-auto p-4 bg-slate-50">
                                                {comparisonResult ? (
                                                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-w-4xl mx-auto">
                                                        <div className="p-4 bg-gray-50 border-b grid grid-cols-4 font-semibold text-sm text-gray-600">
                                                            <div>Metric</div>
                                                            <div className="text-right text-blue-700">Segment A</div>
                                                            <div className="text-right text-orange-700">Segment B</div>
                                                            <div className="text-right">Difference</div>
                                                        </div>
                                                        <div className="divide-y">
                                                            {comparisonResult.comparison.map((row: any, i: number) => (
                                                                <div key={i} className="p-4 grid grid-cols-4 text-sm items-center hover:bg-gray-50">
                                                                    <div className="font-medium text-gray-900">{row.metric}</div>
                                                                    <div className="text-right font-mono text-blue-600">{row.seg1?.toLocaleString() ?? '-'}</div>
                                                                    <div className="text-right font-mono text-orange-600">{row.seg2?.toLocaleString() ?? '-'}</div>
                                                                    <div className={`text-right font-bold ${row.diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                                        {row.diff > 0 ? '+' : ''}{row.diff?.toLocaleString() ?? '-'}
                                                                        {row.diff_pct !== undefined && <span className="text-xs ml-1 text-gray-400 font-normal">({row.diff > 0 ? '+' : ''}{row.diff_pct}%)</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                                        <Sparkles className="h-12 w-12 mb-4" />
                                                        <p>Define segments above and click Run Comparison</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {edaView === 'stats' && (
                                        <div className="h-full overflow-auto space-y-4">
                                            {/* AI SUMMARY CARD */}
                                            {statsData?.summary && (
                                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Sparkles className="h-4 w-4 text-purple-600" />
                                                        <h3 className="font-semibold text-purple-900 text-sm">AI Analyst Insights</h3>
                                                    </div>
                                                    <ul className="space-y-1">
                                                        {statsData.duplicate_rows > 0 && (
                                                            <li className="text-sm font-semibold text-red-600 flex items-start gap-2">
                                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                                                Duplicate Rows Detected: {statsData.duplicate_rows} ({((statsData.duplicate_rows / statsData.total_rows) * 100).toFixed(1)}%)
                                                            </li>
                                                        )}
                                                        {statsData.summary.map((point: string, i: number) => (
                                                            <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-400 shrink-0" />
                                                                {point}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {statsData?.column_stats ? (
                                                <table className="w-full text-sm border bg-white table-fixed">
                                                    <thead className="bg-gray-50 sticky top-0 z-10 text-xs uppercase text-gray-500">
                                                        <tr>
                                                            <th className="p-3 text-left border-b font-semibold w-[200px]">Column</th>
                                                            <th className="p-3 text-left border-b font-semibold w-[180px]">Data Quality</th>
                                                            <th className="p-3 text-left border-b font-semibold w-[250px]">Statistics</th>
                                                            <th className="p-3 text-left border-b font-semibold">Distribution</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(statsData.column_stats).map(([col, stats]: [string, any]) => {
                                                            // TAGGING LOGIC
                                                            let tag = 'Category';
                                                            let tagColor = 'bg-gray-100 text-gray-600';
                                                            const lowerCol = col.toLowerCase();

                                                            if (lowerCol.includes('id') || lowerCol.endsWith('_key') || (stats.distinct_pct > 99 && stats.type !== 'float64')) {
                                                                tag = 'Identifier';
                                                                tagColor = 'bg-purple-100 text-purple-700';
                                                            } else if (stats.type.includes('date') || stats.type.includes('time') || lowerCol.includes('date') || lowerCol.includes('time')) {
                                                                tag = 'Date';
                                                                tagColor = 'bg-yellow-100 text-yellow-700';
                                                            } else if (['int64', 'float64', 'int', 'float'].some(t => stats.type.includes(t))) {
                                                                tag = 'Measure';
                                                                tagColor = 'bg-blue-100 text-blue-700';
                                                            }

                                                            // QUALITY LOGIC
                                                            const validPct = 100 - (stats.missing_pct || 0);
                                                            const zeroPct = stats.zeros ? Math.round((stats.zeros / stats.count) * 100) : 0;
                                                            const emptyPct = stats.missing_pct || 0;

                                                            return (
                                                                <tr key={col} className="border-b last:border-0 hover:bg-gray-50 align-top">
                                                                    <td className="p-3">
                                                                        <div className="font-semibold text-gray-800 text-base truncate" title={col}>{col}</div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tagColor}`}>
                                                                                {tag}
                                                                            </span>
                                                                            <span className="text-xs text-gray-400 font-mono">{stats.type}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        {/* Quality Bar */}
                                                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex mb-2 border">
                                                                            <div className="h-full bg-green-500" style={{ width: `${validPct}%` }} title={`Valid: ${validPct}%`} />
                                                                            <div className="h-full bg-yellow-400" style={{ width: `${zeroPct}%` }} title={`Zeros: ${zeroPct}%`} />
                                                                            <div className="h-full bg-red-500" style={{ width: `${emptyPct}%` }} title={`Empty: ${emptyPct}%`} />
                                                                        </div>
                                                                        <div className="text-xs space-y-0.5 text-gray-600">
                                                                            <div className="flex justify-between"><span>Valid</span><span className="font-mono">{stats.count - stats.missing} ({validPct.toFixed(1)}%)</span></div>
                                                                            <div className="flex justify-between text-red-600"><span>Nulls</span><span className="font-mono">{stats.missing} ({emptyPct}%)</span></div>
                                                                            {stats.zeros !== undefined && (
                                                                                <div className="flex justify-between text-yellow-600"><span>Zeros</span><span className="font-mono">{stats.zeros}</span></div>
                                                                            )}
                                                                            <div className="flex justify-between text-gray-500"><span>Distinct</span><span className="font-mono">{stats.distinct}</span></div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                                                            {stats.mean !== undefined ? (
                                                                                <>
                                                                                    <div className="flex justify-between"><span>Mean:</span> <span className="font-mono font-medium">{Number(stats.mean).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></div>
                                                                                    <div className="flex justify-between"><span>Median:</span> <span className="font-mono font-medium">{Number(stats.median).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></div>
                                                                                    <div className="flex justify-between"><span>Std Dev:</span> <span className="font-mono">{Number(stats.std).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></div>
                                                                                    <div className="flex justify-between"><span>Std Dev:</span> <span className="font-mono">{Number(stats.std).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></div>
                                                                                    {stats.skew !== undefined && (
                                                                                        <div className="flex justify-between" title="Skewness > 1 is significant">
                                                                                            <span>Skew:</span>
                                                                                            <span className={`font-mono font-bold ${Math.abs(stats.skew) > 1 ? 'text-orange-600' : 'text-gray-600'}`}>
                                                                                                {Number(stats.skew).toFixed(2)}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    {stats.kurtosis !== undefined && (
                                                                                        <div className="flex justify-between" title="High Kurtosis = heavy tails (outliers)">
                                                                                            <span>Kurtosis:</span>
                                                                                            <span className="font-mono">{Number(stats.kurtosis).toFixed(2)}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex justify-between"><span>Mode:</span> <span className="font-mono">{stats.mode !== null ? Number(stats.mode).toLocaleString() : '-'}</span></div>
                                                                                    <div className="col-span-2 border-t my-1"></div>
                                                                                    <div className="flex justify-between"><span>Min:</span> <span className="font-mono">{Number(stats.min).toLocaleString()}</span></div>
                                                                                    <div className="flex justify-between"><span>Max:</span> <span className="font-mono">{Number(stats.max).toLocaleString()}</span></div>
                                                                                    <div className="flex justify-between text-gray-400"><span>Q1:</span> <span className="font-mono">{Number(stats['25%']).toLocaleString()}</span></div>
                                                                                    <div className="flex justify-between text-gray-400"><span>Q3:</span> <span className="font-mono">{Number(stats['75%']).toLocaleString()}</span></div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="col-span-2 flex justify-between"><span>Mode:</span> <span className="font-mono font-medium truncate max-w-[100px]" title={stats.mode}>{stats.mode}</span></div>
                                                                                    <div className="col-span-2 flex justify-between"><span>Unique:</span> <span className="font-mono">{stats.distinct}</span></div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 h-[120px]">
                                                                        {stats.distribution?.type === 'histogram' ? (
                                                                            <ResponsiveContainer width="100%" height="100%">
                                                                                <AreaChart data={stats.distribution.data}>
                                                                                    <Tooltip
                                                                                        content={({ active, payload }) => {
                                                                                            if (active && payload && payload.length) {
                                                                                                const d = payload[0].payload;
                                                                                                return (
                                                                                                    <div className="bg-white p-2 border shadow-lg text-xs rounded z-50">
                                                                                                        <p className="font-semibold">{d.bin}</p>
                                                                                                        <p>Count: {d.count}</p>
                                                                                                    </div>
                                                                                                );
                                                                                            }
                                                                                            return null;
                                                                                        }}
                                                                                    />
                                                                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                                                                                </AreaChart>
                                                                            </ResponsiveContainer>
                                                                        ) : stats.distribution?.data ? (
                                                                            <div className="text-xs space-y-1 h-full overflow-y-auto pr-2 custom-scrollbar">
                                                                                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-1">Top Values</p>
                                                                                {stats.distribution.data.map((item: any, i: number) => (
                                                                                    <div key={i} className="flex justify-between items-center group">
                                                                                        <span className="truncate max-w-[120px] text-gray-700 group-hover:text-blue-600" title={item.name}>{item.name}</span>
                                                                                        <span className="font-mono text-gray-400 bg-gray-50 px-1 rounded transform group-hover:scale-110 transition-transform">{item.count}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-gray-400 text-[10px] text-center pt-8">No distribution available</div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">Loading stats...</div>
                                            )}
                                        </div>
                                    )}

                                    {edaView === 'chart' && (
                                        <div className="h-full p-4 flex flex-col gap-4">
                                            <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded border">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        id="pivotMode"
                                                        className="w-4 h-4"
                                                        checked={chartConfig.isPivot === true}
                                                        onChange={e => {
                                                            setChartConfig(prev => ({ ...prev, isPivot: e.target.checked }));
                                                            setShowChart(false);
                                                        }}
                                                    />
                                                    <label htmlFor="pivotMode" className="text-sm font-semibold cursor-pointer !text-gray-900">
                                                        Pivot Mode (Group & Aggregate)
                                                    </label>
                                                </div>

                                                <div className="flex gap-4 items-center flex-wrap">
                                                    {chartConfig.xAxis && chartConfig.yAxis && (
                                                        <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-100">
                                                            <span role="img" aria-label="bulb">💡</span>
                                                            <span>
                                                                Suggested: <strong>
                                                                    {(() => {
                                                                        const xType = previewData?.dtypes?.[chartConfig.xAxis] || '';
                                                                        const isXDate = xType.includes('date') || xType.includes('time') || chartConfig.xAxis.toLowerCase().includes('date');
                                                                        const isXNum = ['int', 'float', 'number'].some(t => xType.includes(t));

                                                                        if (isXDate) return 'Line Chart';
                                                                        if (isXNum && !chartConfig.isPivot) return 'Scatter Plot';
                                                                        return 'Bar Chart';
                                                                    })()}
                                                                </strong>
                                                            </span>
                                                            <button
                                                                className="text-[10px] underline hover:no-underline font-bold ml-1"
                                                                onClick={() => {
                                                                    const xType = previewData?.dtypes?.[chartConfig.xAxis] || '';
                                                                    const isXDate = xType.includes('date') || xType.includes('time') || chartConfig.xAxis.toLowerCase().includes('date');
                                                                    const isXNum = ['int', 'float', 'number'].some(t => xType.includes(t));

                                                                    let type: any = 'bar';
                                                                    if (isXDate) type = 'line';
                                                                    else if (isXNum && !chartConfig.isPivot) type = 'scatter';

                                                                    setChartConfig({ ...chartConfig, type });
                                                                }}
                                                            >
                                                                Apply
                                                            </button>
                                                        </div>
                                                    )}

                                                    <Select
                                                        value={chartConfig.type}
                                                        onValueChange={(val: string) => {
                                                            const newType = val as any;
                                                            setChartConfig({ ...chartConfig, type: newType });
                                                            setShowChart(false);
                                                            if (newType === 'correlation') {
                                                                if (activeSourceId && !correlationData) {
                                                                    dataSourceService.getCorrelation(activeSourceId).then(setCorrelationData).catch(err => console.error("Corr failed", err));
                                                                }
                                                                setShowChart(true);
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[180px] bg-white text-black border-slate-300">
                                                            <SelectValue placeholder="Select Chart Type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white text-black">
                                                            <SelectItem value="bar">Bar Chart</SelectItem>
                                                            <SelectItem value="line">Line Chart</SelectItem>
                                                            <SelectItem value="scatter">Scatter Plot</SelectItem>
                                                            <SelectItem value="area">Area Chart</SelectItem>
                                                            <SelectItem value="histogram">Histogram</SelectItem>
                                                            <SelectItem value="pie">Pie Chart</SelectItem>
                                                            <SelectItem value="radar">Radar Chart</SelectItem>
                                                            <SelectItem value="radialBar">Radial Bar Chart</SelectItem>
                                                            <SelectItem value="boxplot">Box Plot</SelectItem>
                                                            <SelectItem value="correlation">Correlation Matrix</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={chartConfig.xAxis}
                                                        onValueChange={(val: string) => {
                                                            setChartConfig({ ...chartConfig, xAxis: val });
                                                            setShowChart(false);
                                                        }}
                                                        disabled={chartConfig.type === 'histogram'}
                                                    >
                                                        <SelectTrigger className="w-[150px] bg-white text-black border-slate-300">
                                                            <SelectValue placeholder={chartConfig.isPivot ? 'Group By' : (chartConfig.type === 'histogram' ? 'Auto Bins' : 'X Axis')} />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white text-black max-h-[300px]">
                                                            {previewData.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={chartConfig.yAxis}
                                                        onValueChange={(val: string) => {
                                                            setChartConfig({ ...chartConfig, yAxis: val });
                                                            setShowChart(false);
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-[150px] bg-white text-black border-slate-300">
                                                            <SelectValue placeholder={chartConfig.isPivot ? 'Value Column' : (chartConfig.type === 'histogram' ? 'Variable' : 'Y Axis')} />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white text-black max-h-[300px]">
                                                            {previewData.columns
                                                                .filter(c => ['int', 'float'].some(t => previewData.dtypes[c]?.toLowerCase().includes(t)))
                                                                .map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>

                                                    {chartConfig.isPivot && chartConfig.type !== 'histogram' && (
                                                        <Select
                                                            value={chartConfig.agg}
                                                            onValueChange={(val: string) => {
                                                                setChartConfig({ ...chartConfig, agg: val as any });
                                                                setShowChart(false);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-[120px] bg-white text-black border-slate-300">
                                                                <SelectValue placeholder="Agg" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white text-black">
                                                                <SelectItem value="sum">Sum</SelectItem>
                                                                <SelectItem value="avg">Average</SelectItem>
                                                                <SelectItem value="count">Count</SelectItem>
                                                                <SelectItem value="min">Min</SelectItem>
                                                                <SelectItem value="max">Max</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}

                                                    <div className="flex items-center gap-2 border-l pl-4 ml-2">
                                                        <input
                                                            type="checkbox"
                                                            id="limitEnable"
                                                            checked={limitConfig.enabled}
                                                            onChange={e => {
                                                                setLimitConfig({ ...limitConfig, enabled: e.target.checked });
                                                                setShowChart(false);
                                                            }}
                                                            className="w-4 h-4"
                                                        />
                                                        <label htmlFor="limitEnable" className="text-sm cursor-pointer whitespace-nowrap !text-gray-900">Filter:</label>

                                                        <Select
                                                            value={limitConfig.type}
                                                            onValueChange={(val: string) => {
                                                                setLimitConfig({ ...limitConfig, type: val as any });
                                                                setShowChart(false);
                                                            }}
                                                            disabled={!limitConfig.enabled}
                                                        >
                                                            <SelectTrigger className="w-[110px] bg-white text-black border-slate-300">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white text-black">
                                                                <SelectItem value="top">Top N</SelectItem>
                                                                <SelectItem value="bottom">Bottom N</SelectItem>
                                                                <SelectItem value="gt">Value &gt;</SelectItem>
                                                                <SelectItem value="lt">Value &lt;</SelectItem>
                                                            </SelectContent>
                                                        </Select>

                                                        <Input
                                                            type="number"
                                                            className="w-[80px] bg-white text-black border-slate-300"
                                                            value={limitConfig.value}
                                                            onChange={e => {
                                                                setLimitConfig({ ...limitConfig, value: Number(e.target.value) });
                                                                setShowChart(false);
                                                            }}
                                                            disabled={!limitConfig.enabled}
                                                        />
                                                    </div>

                                                    {/* TREND LINES UI */}
                                                    {['bar', 'line', 'scatter', 'area'].includes(chartConfig.type) && (
                                                        <div className="flex items-center gap-3 border-l pl-4 ml-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="checkbox"
                                                                    id="showAvg"
                                                                    checked={chartConfig.showAverage}
                                                                    onChange={e => setChartConfig({ ...chartConfig, showAverage: e.target.checked })}
                                                                    className="w-4 h-4"
                                                                />
                                                                <label htmlFor="showAvg" className="text-xs cursor-pointer !text-gray-900">Average</label>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="checkbox"
                                                                    id="showMedian"
                                                                    checked={chartConfig.showMedian}
                                                                    onChange={e => setChartConfig({ ...chartConfig, showMedian: e.target.checked })}
                                                                    className="w-4 h-4"
                                                                />
                                                                <label htmlFor="showMedian" className="text-xs cursor-pointer !text-gray-900">Median</label>
                                                            </div>
                                                            {chartConfig.type === 'scatter' && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="showOutliers"
                                                                        checked={chartConfig.showOutliers}
                                                                        onChange={e => setChartConfig({ ...chartConfig, showOutliers: e.target.checked })}
                                                                        className="w-4 h-4 accent-red-500"
                                                                    />
                                                                    <label htmlFor="showOutliers" className="text-xs cursor-pointer text-red-600 font-medium">Highlight Outliers</label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={handleNewChart}
                                                            variant="outline"
                                                            className="flex-1"
                                                            title="Reset to default"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" /> New
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveChart}
                                                            variant="outline"
                                                            className="flex-1"
                                                            disabled={!showChart}
                                                            title="Save current configuration"
                                                        >
                                                            <Save className="h-4 w-4 mr-2" /> Save to Analysis
                                                        </Button>
                                                        <Button
                                                            onClick={() => setPinModalOpen(true)}
                                                            variant="outline"
                                                            className="flex-1"
                                                            disabled={!showChart}
                                                            title="Pin this chart to a dashboard"
                                                        >
                                                            <Pin className="h-4 w-4 mr-2" /> Pin to Dashboard
                                                        </Button>
                                                        <Button
                                                            onClick={() => setShowChart(true)}
                                                            disabled={(!chartConfig.xAxis && chartConfig.type !== 'histogram') || !chartConfig.yAxis}
                                                            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            <BarChart3 className="h-4 w-4 mr-2" />
                                                            {chartConfig.isPivot ? 'Summarize & Graph' : 'Create Graph'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CHART AREA */}
                                            <div className="flex flex-col gap-4 flex-1 min-h-[500px]">
                                                <div className="border rounded p-4 relative min-h-[500px] flex flex-col bg-white">
                                                    <div className="absolute top-2 right-2 z-10">
                                                        {/* Download button could go here */}
                                                    </div>

                                                    {showChart && (chartConfig.type === 'correlation' || (chartConfig.xAxis && chartConfig.yAxis)) ? (
                                                        <ResponsiveContainer width="100%" height={500}>
                                                            {(() => {
                                                                if (chartConfig.type === 'correlation') {
                                                                    if (!correlationData) return <div className="flex items-center justify-center h-full">Loading Correlation...</div>;

                                                                    // Render Custom Heatmap Grid
                                                                    const cols = correlationData.columns;
                                                                    const cellSize = Math.min(60, 500 / cols.length);

                                                                    return (
                                                                        <div className="h-full overflow-auto flex items-center justify-center p-4">
                                                                            <div className="grid" style={{ gridTemplateColumns: `auto repeat(${cols.length}, ${cellSize}px)` }}>
                                                                                {/* Header Row */}
                                                                                <div className="h-[50px]"></div>
                                                                                {cols.map(c => (
                                                                                    <div key={c} className="h-[50px] flex items-end justify-center pb-2">
                                                                                        <span className="text-xs font-medium text-gray-600 -rotate-45 whitespace-nowrap origin-bottom-left translate-x-4">
                                                                                            {c.length > 10 ? c.substring(0, 10) + '..' : c}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}

                                                                                {/* Rows */}
                                                                                {cols.map(rowCol => (
                                                                                    <>
                                                                                        <div key={`row-${rowCol}`} className="flex items-center justify-end pr-2 h-[${cellSize}px]">
                                                                                            <span className="text-xs font-medium text-gray-600 truncate max-w-[100px]" title={rowCol}>{rowCol}</span>
                                                                                        </div>
                                                                                        {cols.map(colCol => {
                                                                                            const cell = correlationData.matrix.find(d => d.x === rowCol && d.y === colCol);
                                                                                            const val = cell?.value || 0;
                                                                                            // Color Scale (Blue -> White -> Red)
                                                                                            let bg = '#fff';
                                                                                            if (val > 0) bg = `rgba(59, 130, 246, ${val})`; // Blue
                                                                                            if (val < 0) bg = `rgba(239, 68, 68, ${Math.abs(val)})`; // Red

                                                                                            return (
                                                                                                <div
                                                                                                    key={`${rowCol}-${colCol}`}
                                                                                                    className="border border-gray-100 flex items-center justify-center text-[10px]"
                                                                                                    style={{ height: cellSize, backgroundColor: bg }}
                                                                                                    title={`${rowCol} vs ${colCol}: ${val}`}
                                                                                                >
                                                                                                    {Math.abs(val) > 0.3 ? val.toFixed(2) : ''}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                // Debug logs
                                                                console.log("Chart Config:", chartConfig);
                                                                console.log("Filtered Data Length:", filteredData?.length);


                                                                // Use backend fetched data
                                                                let plotData = chartData || [];
                                                                let wasTruncated = false;

                                                                if (chartLoading) return <div className="flex items-center justify-center h-full">Loading chart data...</div>;

                                                                // HISTOGRAM LOGIC (Client-side binning for now, or move to backend later)
                                                                if (chartConfig.type === 'histogram') {
                                                                    // Histogram usually needs raw data to bin, but if we have too many rows, we should bin on backend.
                                                                    // For now, let's assume chartData returns raw rows for histogram if !isPivot
                                                                    const values = plotData.map((r: any) => Number(r[chartConfig.yAxis])).filter((v: number) => !isNaN(v));
                                                                    if (values.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground">No numeric data for histogram</div>;

                                                                    const min = Math.min(...values);
                                                                    const max = Math.max(...values);
                                                                    const binCount = 10;
                                                                    const step = (max - min) / binCount || 1;

                                                                    const bins = Array.from({ length: binCount }, (_, i) => ({
                                                                        bin: `${(min + i * step).toFixed(1)} - ${(min + (i + 1) * step).toFixed(1)}`,
                                                                        count: 0,
                                                                        minVal: min + i * step,
                                                                        maxVal: min + (i + 1) * step
                                                                    }));

                                                                    values.forEach((v: number) => {
                                                                        const binIndex = Math.min(Math.floor((v - min) / step), binCount - 1);
                                                                        if (binIndex >= 0) bins[binIndex].count++;
                                                                    });
                                                                    plotData = bins;

                                                                    return (
                                                                        <BarChart data={plotData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                                            <CartesianGrid strokeDasharray="3 3" />
                                                                            <XAxis dataKey="bin" angle={-45} textAnchor="end" height={60} fontSize={10} />
                                                                            <YAxis />
                                                                            <Tooltip />
                                                                            <Bar dataKey="count" fill="#3b82f6" name="Frequency" />
                                                                        </BarChart>
                                                                    );
                                                                }

                                                                if (plotData.length === 0) {
                                                                    console.warn("No plot data available");
                                                                    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available (Check filters)</div>;
                                                                }

                                                                // Backend already aggregated if isPivot is true
                                                                if (chartConfig.isPivot) {
                                                                    // Data is already {groupBy: val, aggCol: val}
                                                                    // Just ensure keys match what Recharts expects
                                                                } else {
                                                                    // Raw data, filter out invalid
                                                                    plotData = plotData.filter((row: any) => {
                                                                        const val = Number(row[chartConfig.yAxis]);
                                                                        return !isNaN(val) && row[chartConfig.yAxis] !== null && row[chartConfig.yAxis] !== '';
                                                                    });
                                                                }

                                                                if (plotData.length === 0) {
                                                                    return <div className="flex items-center justify-center h-full text-muted-foreground">No valid numeric data found for "{chartConfig.yAxis}"</div>;
                                                                }

                                                                // --- OUTLIER CALCULATION (Client-Side) ---
                                                                let outliersData: any[] = [];
                                                                const yKey = chartConfig.yAxis;

                                                                if (chartConfig.showOutliers && !chartConfig.isPivot && chartConfig.type === 'scatter') {
                                                                    const vals = plotData.map((d: any) => Number(d[yKey])).sort((a, b) => a - b);
                                                                    if (vals.length > 4) {
                                                                        const q1 = vals[Math.floor(vals.length * 0.25)];
                                                                        const q3 = vals[Math.floor(vals.length * 0.75)];
                                                                        const iqr = q3 - q1;
                                                                        const lower = q1 - 1.5 * iqr;
                                                                        const upper = q3 + 1.5 * iqr;

                                                                        // Split Data
                                                                        const normal = [];
                                                                        const outliers = [];
                                                                        for (const row of plotData) {
                                                                            const val = Number(row[yKey]);
                                                                            if (val < lower || val > upper) {
                                                                                outliers.push(row);
                                                                            } else {
                                                                                normal.push(row);
                                                                            }
                                                                        }
                                                                        plotData = normal;
                                                                        outliersData = outliers;
                                                                    }
                                                                }

                                                                // Common props for charts
                                                                const commonProps = {
                                                                    data: plotData,
                                                                    margin: { top: 20, right: 30, left: 20, bottom: 60 }, // Increased bottom margin for axis labels
                                                                };

                                                                // Dynamic X-Axis Key
                                                                const xKey = chartConfig.xAxis;


                                                                // Calculate Reference Lines
                                                                let avgVal: number | null = null;
                                                                let medianVal: number | null = null;

                                                                if (chartConfig.showAverage || chartConfig.showMedian) {
                                                                    const vals = plotData.map(d => Number(d[yKey]));
                                                                    if (vals.length > 0) {
                                                                        if (chartConfig.showAverage) {
                                                                            avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;
                                                                        }
                                                                        if (chartConfig.showMedian) {
                                                                            const sorted = [...vals].sort((a, b) => a - b);
                                                                            medianVal = sorted[Math.floor(sorted.length / 2)];
                                                                        }
                                                                    }
                                                                }

                                                                const renderRefLines = () => (
                                                                    <>
                                                                        {avgVal !== null && <ReferenceLine y={avgVal} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: `Avg: ${avgVal.toFixed(1)}`, fill: '#ef4444', fontSize: 11 }} />}
                                                                        {medianVal !== null && <ReferenceLine y={medianVal} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: `Med: ${medianVal.toFixed(1)}`, fill: '#10b981', fontSize: 11 }} />}
                                                                    </>
                                                                );

                                                                return chartConfig.type === 'bar' ? (
                                                                    <BarChart {...commonProps}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend verticalAlign="top" />
                                                                        <Bar dataKey={yKey} fill="#3b82f6" name={`${chartConfig.isPivot ? (chartConfig.agg || 'Value') + ' of ' : ''}${yKey}`} />
                                                                        {renderRefLines()}
                                                                    </BarChart>
                                                                ) : chartConfig.type === 'line' ? (
                                                                    <LineChart {...commonProps}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend verticalAlign="top" />
                                                                        <Line type="monotone" dataKey={yKey} stroke="#8884d8" name={`${chartConfig.isPivot ? (chartConfig.agg || 'Value') + ' of ' : ''}${yKey}`} dot={false} />
                                                                        {renderRefLines()}
                                                                    </LineChart>
                                                                ) : chartConfig.type === 'area' ? (
                                                                    <AreaChart {...commonProps}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} interval={0} fontSize={12} />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend verticalAlign="top" />
                                                                        <Area type="monotone" dataKey={yKey} stroke="#8884d8" fill="#8884d8" name={`${chartConfig.isPivot ? (chartConfig.agg || 'Value') + ' of ' : ''}${yKey}`} />
                                                                        {renderRefLines()}
                                                                    </AreaChart>
                                                                ) : (

                                                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                                        <CartesianGrid />
                                                                        <XAxis type="category" dataKey={xKey} name={xKey} />
                                                                        <YAxis type="number" dataKey={yKey} name={yKey} />
                                                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                                        <Legend verticalAlign="top" />
                                                                        <Scatter name="Data" data={plotData} fill="#8884d8" />
                                                                        {outliersData.length > 0 && (
                                                                            <Scatter name="Outliers" data={outliersData} fill="#ef4444" shape="cross" />
                                                                        )}
                                                                        {renderRefLines()}
                                                                    </ScatterChart>
                                                                );
                                                            })()}
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            Select axes and click "{chartConfig.isPivot ? 'Summarize & Graph' : 'Create Graph'}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SAVED CHARTS SECTION */}
                                            <div className="mt-8 border-t pt-8">
                                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                    <Grid className="h-5 w-5 text-gray-500" /> Saved Charts Dashboard
                                                </h3>

                                                {savedChartsLoading ? (
                                                    <div className="text-sm text-gray-500">Loading saved charts...</div>
                                                ) : savedCharts.length === 0 ? (
                                                    <div className="text-sm text-gray-500 italic p-6 border rounded bg-gray-50 text-center">
                                                        No saved charts yet. Build a graph above and click "Save" to add it here.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {savedCharts.map(chart => (
                                                            <div key={chart.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-medium truncate pr-6" title={chart.name}>{chart.name}</h4>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-gray-400 hover:text-red-500 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteChart(chart.id); }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mb-4 h-10 overflow-hidden text-ellipsis">
                                                                    {chart.config.chartConfig.type.toUpperCase()} • {chart.config.chartConfig.yAxis} by {chart.config.chartConfig.xAxis || 'Index'}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1"
                                                                        onClick={() => handleLoadChart(chart)}
                                                                    >
                                                                        Load & View
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        title="Pin to Dashboard"
                                                                        onClick={() => {
                                                                            setChartConfig({ ...chart.config.chartConfig });
                                                                            setShowChart(true);
                                                                            setPinModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Pin className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        title="Delete Chart"
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteChart(chart.id); }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cleaning" className="h-[800px]">
                    <DataCleaningPanel
                        columns={previewData?.columns || []}
                        data={previewData?.data || []}
                        totalRows={previewData?.total_rows || 0}
                        onSaveRecipe={(pipeline) => console.log("Saving pipeline", pipeline)}
                    />
                </TabsContent>

                <TabsContent value="ask">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600" /> Ask Your Data
                                </CardTitle>
                                <CardDescription>
                                    Ask questions in plain English to generate insights and visualizations.
                                    <br />
                                    <span className="text-xs text-muted-foreground">Example: "Show me total revenue by region" or "What is the trend of sales over time?"</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={askQuestion}
                                        onChange={(e) => setAskQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAskData()}
                                        placeholder="Ask a question..."
                                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button onClick={handleAskData} disabled={askLoading || !askQuestion.trim()}>
                                        {askLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        <span className="ml-2">Ask</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {askResult && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Card className="bg-blue-50/50 border-blue-100">
                                    <CardContent className="pt-6">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-blue-100 rounded-full h-fit">
                                                <Sparkles className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-blue-900">Analysis Result</h3>
                                                <p className="text-blue-800 leading-relaxed text-lg">{askResult.answer}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {askResult.chart && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>{askResult.chart.title || "Visualization"}</CardTitle>
                                            <Button variant="outline" size="sm" onClick={() => { setActiveTab("eda"); setEdaView("chart"); }}>
                                                Open in Chart Editor
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="h-[400px]">
                                            {chartLoading ? (
                                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                                    <Sparkles className="h-4 w-4 mr-2 animate-spin" /> Preparing chart data...
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {askResult.chart.type === 'bar' ? (
                                                        <BarChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey={askResult.chart.xAxis} />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Bar dataKey={askResult.chart.yAxis} fill="#3b82f6" name={askResult.chart.yAxis} />
                                                        </BarChart>
                                                    ) : askResult.chart.type === 'line' ? (
                                                        <LineChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey={askResult.chart.xAxis} />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Line type="monotone" dataKey={askResult.chart.yAxis} stroke="#3b82f6" strokeWidth={2} />
                                                        </LineChart>
                                                    ) : askResult.chart.type === 'pie' ? (
                                                        <PieChart>
                                                            <Pie data={chartData} dataKey={askResult.chart.yAxis} nameKey={askResult.chart.xAxis} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                                                {chartData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend />
                                                        </PieChart>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            Chart type '{askResult.chart.type}' configured. View in Visualizations tab.
                                                        </div>
                                                    )}
                                                </ResponsiveContainer>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>


            <PinChartModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                config={{ ...chartConfig, sourceId: activeSourceId ? parseInt(activeSourceId.toString()) : undefined }}
            />

            {activeSourceId && (
                <>
                    <AIChatPanel
                        sourceId={parseInt(activeSourceId.toString())}
                        open={aiChatOpen}
                        onClose={() => setAiChatOpen(false)}
                    />
                    {!aiChatOpen && (
                        <Button
                            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 z-50 flex items-center justify-center transition-transform hover:scale-110"
                            onClick={() => setAiChatOpen(true)}
                        >
                            <MessageCircle className="h-7 w-7 text-white" />
                        </Button>
                    )}
                </>
            )}
        </div >
    );
}
