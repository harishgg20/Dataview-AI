"use client";

import { useEffect, useState } from "react";
import { dataSourceService, DataSource } from "@/services/dataSource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Trash2, Database, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DataSourcesPage() {
    const { toast } = useToast();
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await dataSourceService.getAll();
            setDataSources(data);
        } catch (err) {
            console.error("Failed to load data sources", err);
            toast({
                title: "Error",
                description: "Failed to load data sources",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this data source? This cannot be undone.")) return;

        try {
            await dataSourceService.delete(id);
            toast({ title: "Data source deleted" });
            loadData(); // Reload list
        } catch (err) {
            console.error("Failed to delete", err);
            toast({
                title: "Error",
                description: "Failed to delete data source",
                variant: "destructive",
            });
        }
    };

    const filteredData = dataSources.filter(ds =>
        (ds.connection_config?.original_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        ds.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                    <p className="text-muted-foreground">
                        Manage all uploaded datasets and connections.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Data Sources</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or type..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="h-12 px-4 font-medium text-slate-500">Name</th>
                                    <th className="h-12 px-4 font-medium text-slate-500">Type</th>
                                    <th className="h-12 px-4 font-medium text-slate-500">Project ID</th>
                                    <th className="h-12 px-4 font-medium text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No data sources found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((ds) => (
                                        <tr key={ds.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="font-medium">
                                                        {ds.connection_config?.original_name || "Untitled"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 uppercase">
                                                    {ds.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">#{ds.project_id}</td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600"
                                                    onClick={() => handleDelete(ds.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
