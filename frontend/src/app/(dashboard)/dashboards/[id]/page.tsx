"use client";

import { useEffect, useState, use } from "react";
import { dashboardService, Dashboard } from "@/services/dashboard";
import { DashboardWidget } from "@/components/dashboard/DashboardWidget";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { toast } = useToast();
    // Unwrap params using React.use() or await in useEffect if it was async component (but this is client)
    // Next.js 15+ allows async params in client components via `use` or async resolution.
    // For standard Next.js 14 client component, params is object. 
    // Wait, recent Next.js versions treat params as Promise. Let's handle it safely.
    const resolvedParams = use(params);
    const id = parseInt(resolvedParams.id);

    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, [id]);

    const loadDashboard = async () => {
        try {
            const data = await dashboardService.getById(id);
            setDashboard(data);
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to load dashboard", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWidget = async (widgetId: number) => {
        if (!confirm("Are you sure you want to remove this widget?")) return;
        try {
            await dashboardService.deleteWidget(id, widgetId);
            setDashboard(prev => prev ? {
                ...prev,
                widgets: prev.widgets.filter(w => w.id !== widgetId)
            } : null);
            toast({ title: "Success", description: "Widget removed" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to remove widget", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-red-600">Dashboard not found</h2>
                <Link href="/dashboards" className="text-blue-600 hover:underline mt-4 inline-block">
                    Return to Dashboards
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboards" className="text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
                    {dashboard.description && (
                        <p className="text-muted-foreground">{dashboard.description}</p>
                    )}
                </div>
            </div>

            {dashboard.widgets.length === 0 ? (
                <div className="p-12 border-2 border-dashed rounded-lg text-center bg-gray-50/50">
                    <p className="text-gray-500">This dashboard is empty.</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Go to your Analysis, create a chart, and click "Pin to Dashboard".
                    </p>
                    <Link href="/analysis">
                        <Button variant="outline" className="mt-4">
                            Go to Analysis
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6">
                    {/* Simple Grid Layout for MVP. Future: React-Grid-Layout */}
                    {dashboard.widgets.map((widget) => (
                        <div key={widget.id} className="min-h-[400px]">
                            <DashboardWidget
                                widget={widget}
                                onDelete={handleDeleteWidget}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
