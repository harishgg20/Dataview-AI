"use client";

import { useEffect, useState } from "react";
import { dashboardService, Dashboard } from "@/services/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, LayoutTemplate, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardsPage() {
    const { toast } = useToast();
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newDashboardName, setNewDashboardName] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadDashboards();
    }, []);

    const loadDashboards = async () => {
        try {
            const data = await dashboardService.getAll();
            setDashboards(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newDashboardName.trim()) return;
        setCreating(true);
        try {
            const newDash = await dashboardService.create({ name: newDashboardName });
            setDashboards([...dashboards, newDash]);
            setCreateOpen(false);
            setNewDashboardName("");
            toast({ title: "Success", description: "Dashboard created" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to create dashboard", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
                    <p className="text-muted-foreground">Monitor your key metrics and visualizations.</p>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Dashboard
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Dashboard</DialogTitle>
                            <DialogDescription>
                                Create a new empty dashboard to pin charts to.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={newDashboardName}
                                    onChange={(e) => setNewDashboardName(e.target.value)}
                                    placeholder="e.g. Sales Overview"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={creating || !newDashboardName.trim()}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : dashboards.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-gray-50/50">
                    <LayoutTemplate className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No dashboards yet</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                        Create your first dashboard to start pinning charts and metrics from your analysis.
                    </p>
                    <Button onClick={() => setCreateOpen(true)} variant="outline">
                        Create Dashboard
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {dashboards.map((dash) => (
                        <Link key={dash.id} href={`/dashboards/${dash.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-600 h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-xl">{dash.name}</CardTitle>
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <CardDescription>
                                        Created {new Date(dash.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-gray-500">
                                        Click to view pinned charts.
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
