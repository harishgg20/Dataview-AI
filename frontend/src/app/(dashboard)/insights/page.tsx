"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { aiService, Insight } from "@/services/ai";
import { dataSourceService } from "@/services/dataSource";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, AlertTriangle, Activity, Database, ArrowRight, Lightbulb, Star, BarChart2, PieChart, AlertOctagon, ArrowDown, Coins } from "lucide-react";

// ...


import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function InsightsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [dataSources, setDataSources] = useState<any[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>("");
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Dialog State
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Load Data Sources
    useEffect(() => {
        const loadSources = async () => {
            setLoading(true);
            try {
                const sources = await dataSourceService.getAll();
                setDataSources(sources);
                if (sources.length > 0) {
                    setSelectedSource(sources[0].id.toString());
                }
            } catch (err) {
                console.error("Failed to load data sources", err);
                toast({ title: "Error", description: "Failed to load data sources", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        loadSources();
    }, []);

    // Load Saved Insights when Source Changes
    useEffect(() => {
        const loadSaved = async () => {
            if (!selectedSource) return;
            setInsights([]); // clear previous while loading or just keep them? Better clear to show transition or keep empty if none.
            try {
                const result = await aiService.getSavedInsights(parseInt(selectedSource));
                if (result.insights && result.insights.length > 0) {
                    setInsights(result.insights);
                }
            } catch (err) {
                console.error("Failed to load saved insights", err);
            }
        };
        loadSaved();
    }, [selectedSource]);

    const handleGenerate = async () => {
        if (!selectedSource) return;
        setGenerating(true);
        setInsights([]); // clear previous
        try {
            // 1. Call AI Service directly (Source ID)
            const result = await aiService.generateInsights(parseInt(selectedSource));
            setInsights(result.insights);
            toast({ title: "Success", description: "Insights generated successfully!", variant: "success" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to generate insights. AI service might be busy.", variant: "destructive" });
        } finally {
            setGenerating(false);
        }
    };

    const handleViewDetails = (insight: Insight) => {
        setSelectedInsight(insight);
        setIsDialogOpen(true);
    };

    const toggleBookmark = async (limit: number, index: number) => {
        const insightToSave = insights[index];
        if (insightToSave.isBookmarked) {
            toast({ title: "Already Saved", description: "This insight is already in your library.", variant: "default" });
            return;
        }

        try {
            await aiService.saveInsight(parseInt(selectedSource), insightToSave);

            const updated = [...insights];
            updated[index].isBookmarked = true;
            setInsights(updated);

            toast({ title: "Saved", description: "Insight saved to database permanently.", variant: "success" });
        } catch (err) {
            console.error("Failed to save insight", err);
            toast({ title: "Error", description: "Failed to save insight.", variant: "destructive" });
        }
    };

    const handleDrillDown = () => {
        if (!selectedInsight || !selectedSource) return;

        // Construct query params for the dashboard
        const projectId = selectedSource; // assuming 1:1 project mapping for now
        let url = `/analysis/${projectId}?tab=overview`;

        // If the insight has a related filter context, pass it
        // For mock purposes, we will assume some context based on the insight type
        if (selectedInsight.type === 'kpi_driver') {
            url += `&filter_col=Category&filter_val=Electronics`;
        } else if (selectedInsight.type === 'segment_comparison') {
            url += `&filter_col=City&filter_val=Bangalore`;
        } else if (selectedInsight.type === 'outlier') {
            url += `&filter_col=Restaurant&filter_val=Cafe Coffee Day`;
        }

        router.push(url);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'trend': return <TrendingUp className="h-5 w-5 text-green-500" />;
            case 'seasonality': return <Activity className="h-5 w-5 text-indigo-500" />;
            case 'kpi_driver': return <Sparkles className="h-5 w-5 text-amber-500" />;
            case 'segment_comparison': return <ArrowRight className="h-5 w-5 text-blue-500" />;
            case 'outlier': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'data_quality': return <Database className="h-5 w-5 text-rose-600" />;
            case 'distribution': return <Activity className="h-5 w-5 text-purple-500" />;
            case 'pareto': return <PieChart className="h-5 w-5 text-blue-600" />;
            case 'underperformer': return <ArrowDown className="h-5 w-5 text-red-600" />;
            case 'risk_alert': return <AlertOctagon className="h-5 w-5 text-amber-600" />;
            case 'change_summary': return <TrendingUp className="h-5 w-5 text-blue-500" />;
            case 'benchmark': return <BarChart2 className="h-5 w-5 text-indigo-600" />;
            case 'opportunity': return <Coins className="h-5 w-5 text-green-600" />;
            default: return <Sparkles className="h-5 w-5 text-gray-500" />;
        }
    };

    // Helper for chip color
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'data_quality': return "bg-rose-100 text-rose-800";
            case 'kpi_driver': return "bg-amber-100 text-amber-800";
            case 'outlier': return "bg-red-100 text-red-800";
            case 'pareto': return "bg-blue-100 text-blue-800";
            case 'underperformer': return "bg-red-50 text-red-900";
            case 'risk_alert': return "bg-amber-50 text-amber-900";
            case 'opportunity': return "bg-green-100 text-green-800";
            case 'benchmark': return "bg-indigo-100 text-indigo-800";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Advanced AI Insights</h1>
                <p className="text-gray-500">
                    Automated discovery of KPI drivers, anomalies, data quality issues, and segment comparisons.
                </p>
            </div>

            {/* Controls */}
            <Card className="bg-slate-50 border-dashed">
                <CardContent className="flex flex-col md:flex-row gap-4 items-center p-6">
                    <div className="flex-1 w-full md:w-auto">
                        <label className="text-sm font-medium mb-1.5 block text-gray-700">Select Dataset</label>
                        <Select value={selectedSource} onValueChange={setSelectedSource} disabled={loading}>
                            <SelectTrigger className="bg-white w-full text-black border-slate-300">
                                <SelectValue>
                                    {selectedSource ? (
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-gray-500" />
                                            {dataSources.find(ds => ds.id.toString() === selectedSource)?.connection_config?.original_name || "Unknown Dataset"}
                                        </div>
                                    ) : (
                                        "Choose a dataset..."
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                                {dataSources.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-gray-500" />
                                            {ds.connection_config?.original_name || "Unnamed Dataset"}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {insights.length > 0 && (
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full md:w-auto mt-auto border-purple-200 text-purple-700 hover:bg-purple-50 md:self-end"
                            onClick={async () => {
                                const newInsights = [...insights];
                                let savedCount = 0;
                                for (let i = 0; i < newInsights.length; i++) {
                                    if (!newInsights[i].isBookmarked) {
                                        try {
                                            await aiService.saveInsight(parseInt(selectedSource), newInsights[i]);
                                            newInsights[i].isBookmarked = true;
                                            savedCount++;
                                        } catch (e) { console.error(e); }
                                    }
                                }
                                setInsights(newInsights);
                                if (savedCount > 0) toast({ title: "Saved All", description: `${savedCount} insights saved successfully.`, variant: "success" });
                                else toast({ title: "Info", description: "All insights were already saved.", variant: "default" });
                            }}
                        >
                            <Star className="mr-2 h-4 w-4" /> Save All
                        </Button>
                    )}

                    <Button
                        size="lg"
                        className="w-full md:w-auto mt-auto bg-purple-600 hover:bg-purple-700 shadow-md transition-all md:self-end"
                        onClick={handleGenerate}
                        disabled={!selectedSource || generating || loading}
                    >
                        {generating ? (
                            <>
                                <Sparkles className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" /> Generate Insights
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {insights.map((insight, i) => (
                    <Card key={i} className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500 overflow-hidden group flex flex-col relative">
                        {/* Bookmark Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(0, i); }}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
                        >
                            <Star className={`h-4 w-4 ${insight.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        </button>

                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                                    {getIcon(insight.type)}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${getTypeColor(insight.type)}`}>
                                    {insight.type.replace('_', ' ')}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 flex flex-col">
                            <p className="text-gray-800 leading-relaxed font-semibold text-sm mb-4 pr-4">
                                {insight.message}
                            </p>

                            <div className="mt-auto pt-4 border-t flex justify-between items-center">
                                <span className="text-xs font-bold px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                                    {(insight.confidence * 100).toFixed(0)}% Conf.
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-0 h-auto font-medium"
                                    onClick={() => handleViewDetails(insight)}
                                >
                                    View Logic <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {!generating && insights.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                    <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lightbulb className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No Insights Generated Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Select a dataset above and click "Generate Insights" to let our AI analyze your data for patterns.
                    </p>
                </div>
            )}

            {/* Insight Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedInsight && getIcon(selectedInsight.type)}
                            <span className="uppercase tracking-wide text-base text-gray-700">
                                {selectedInsight?.type.replace('_', ' ')} Insight
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of the AI analysis.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInsight && (
                        <div className="space-y-6 py-4">
                            {/* Main Message */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Insight</h4>
                                <p className="text-gray-900 font-medium leading-relaxed text-lg">
                                    {selectedInsight.message}
                                </p>
                            </div>

                            {/* Reasoning (Why it happened) */}
                            {selectedInsight.details?.reasoning && (
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
                                        <Lightbulb className="h-4 w-4" /> Why it happened?
                                    </h4>
                                    <p className="text-gray-600 text-sm leading-relaxed pl-6">
                                        {selectedInsight.details.reasoning}
                                    </p>
                                </div>
                            )}

                            {/* Confidence Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-3 rounded border border-green-100">
                                    <div className="text-xs text-green-800 font-semibold mb-1">Confidence Score</div>
                                    <div className="text-2xl font-bold text-green-700">{(selectedInsight.confidence * 100).toFixed(1)}%</div>
                                </div>
                                {selectedInsight.details?.sample_size && (
                                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                        <div className="text-xs text-blue-800 font-semibold mb-1">Based on Sample Size</div>
                                        <div className="text-2xl font-bold text-blue-700">{selectedInsight.details.sample_size.toLocaleString()}</div>
                                    </div>
                                )}
                            </div>

                            {/* Recommended Action */}
                            {selectedInsight.details?.action_item && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-bold text-gray-900 mb-2">Recommended Action</h4>
                                    <div className="flex items-start gap-3 bg-white p-3 border rounded-md shadow-sm">
                                        <div className="bg-purple-100 p-1.5 rounded-full mt-0.5">
                                            <ArrowRight className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <p className="text-gray-700 text-sm font-medium pt-0.5">
                                            {selectedInsight.details.action_item}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="sm:justify-between">
                        {(selectedInsight?.type === 'kpi_driver' || selectedInsight?.type === 'segment_comparison' || selectedInsight?.type === 'outlier') && (
                            <Button
                                variant="outline"
                                className="hidden sm:flex border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={handleDrillDown}
                            >
                                <BarChart2 className="w-4 h-4 mr-2" />
                                Analyze in Dashboard
                            </Button>
                        )}
                        <div className="text-xs text-gray-400 self-center hidden sm:block">
                            AI Model: Analytic-Engine v1.2
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => {
                                    toast({
                                        title: "Action Initiated",
                                        description: selectedInsight?.details?.action_item ? "Action added to queue: " + selectedInsight.details.action_item : "Action logged.",
                                        variant: "success"
                                    });
                                    setIsDialogOpen(false);
                                }}
                            >
                                Take Action
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
