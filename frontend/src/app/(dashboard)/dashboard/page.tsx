"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { MagicCard } from "@/components/magicui/magic-card";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Added Button component
import { Database, FolderOpen, FileSpreadsheet, Activity, ArrowUpRight, HardDrive, Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { dataSourceService, DataSource } from "@/services/dataSource";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalProjects: 0,
        types: [] as { name: string, value: number }[],
        recent: [] as DataSource[],
        loading: true
    });

    // Rename State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newName, setNewName] = useState("");
    const [renaming, setRenaming] = useState(false);

    const openRename = (ds: DataSource) => {
        setEditingId(ds.id);
        setNewName(ds.connection_config?.original_name || ds.connection_config?.filename || "");
    };

    const handleRename = async () => {
        if (!editingId || !newName.trim()) return;
        setRenaming(true);
        try {
            await dataSourceService.update(editingId, newName);
            setEditingId(null);
            loadData(); // Reload to see changes
        } catch (err) {
            console.error("Failed to rename", err);
        } finally {
            setRenaming(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await dataSourceService.getAll();

            // Calculate Stats
            const uniqueProjects = new Set(data.map(d => d.project_id)).size;

            // Type Distribution
            const typeCounts: Record<string, number> = {};
            data.forEach(d => {
                const t = d.type || 'Unknown';
                typeCounts[t] = (typeCounts[t] || 0) + 1;
            });
            const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

            // Recent (Sort by ID desc)
            const sorted = [...data].sort((a, b) => b.id - a.id).slice(0, 5);

            setStats({
                totalFiles: data.length,
                totalProjects: uniqueProjects,
                types: typeData,
                recent: sorted,
                loading: false
            });
        } catch (err) {
            console.error("Failed to load dashboard stats", err);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    if (stats.loading) {
        return <div className="p-8 text-center text-gray-500" suppressHydrationWarning>Loading dashboard metrics...</div>;
    }

    return (
        <div className="flex flex-col gap-6" suppressHydrationWarning={true}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time summary of your data workspace
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => router.push("/analysis/new")}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Analysis
                    </Button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MagicCard className="shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalFiles}</div>
                        <p className="text-xs text-muted-foreground">Connected sources</p>
                    </CardContent>
                </MagicCard>

                <MagicCard className="shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">Workspaces used</p>
                    </CardContent>
                </MagicCard>

                <MagicCard className="shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Refresh Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-muted-foreground">System healthy</p>
                    </CardContent>
                </MagicCard>

                <MagicCard className="shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Type</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Local</div>
                        <p className="text-xs text-muted-foreground">Secure storage</p>
                    </CardContent>
                </MagicCard>
            </div>

            {/* MAIN CHART & LIST */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* CHART */}
                <MagicCard className="col-span-4 shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader>
                        <CardTitle>Data Source Distribution</CardTitle>
                        <CardDescription>Breakdown of connected file types</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            {stats.types.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.types}>
                                        <XAxis
                                            dataKey="name"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white border rounded shadow-sm p-2 text-sm">
                                                            <div className="font-bold mb-1 uppercase text-gray-500 text-xs">{payload[0].payload.name}</div>
                                                            <div className="text-blue-600 font-bold text-lg">
                                                                {payload[0].value} <span className="text-xs text-gray-400 font-normal">files</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <FileSpreadsheet className="h-10 w-10 mb-2 opacity-20" />
                                    No datasets found. Upload one to see stats.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </MagicCard>

                {/* RECENT UPLOADS LIST */}
                <MagicCard className="col-span-3 shadow-sm" gradientColor="#D9D9D955">
                    <CardHeader>
                        <CardTitle>Recent Datasets</CardTitle>
                        <CardDescription>
                            Latest files added to the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recent.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    No recent uploads.
                                </div>
                            ) : (
                                stats.recent.map((ds) => (
                                    <div key={ds.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-100 transition-colors">
                                                <FileSpreadsheet className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <Link href={`/analysis/${ds.id}`} className="text-sm font-medium leading-none hover:text-blue-600 hover:underline block truncate max-w-[150px]" title={ds.connection_config?.filename}>
                                                    {ds.connection_config?.original_name || ds.connection_config?.filename || `Dataset #${ds.id}`}
                                                </Link>
                                                <p className="text-xs text-muted-foreground uppercase">{ds.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => openRename(ds)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Link href={`/analysis/${ds.id}`}>
                                                <ArrowUpRight className="h-4 w-4 text-gray-300 hover:text-blue-600 transition-colors" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </MagicCard>
            </div>

            {/* RENAME DIALOG */}
            <Dialog open={!!editingId} onOpenChange={(open: boolean) => !open && setEditingId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Dataset</DialogTitle>
                        <DialogDescription>
                            Enter a new name for your dataset.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="My Dataset"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button onClick={handleRename} disabled={renaming}>
                            {renaming ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
