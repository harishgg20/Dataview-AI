import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Database, Zap, Activity } from "lucide-react";

export default function AdminOverviewPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">System Health</h1>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">+1 today</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Queries</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">All healthy</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0.0%</div>
                        <p className="text-xs text-muted-foreground">Last 24h</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-950 text-green-400 font-mono text-sm p-4 rounded-md h-[400px] overflow-y-auto">
                        <div>[INFO] System started at 2025-12-26 15:00:00</div>
                        <div>[INFO] Database connection established (PostgreSQL)</div>
                        <div>[INFO] Redis connection established</div>
                        <div>[INFO] DuckDB engine initialized</div>
                        <div>[INFO] Admin user logged in from 127.0.0.1</div>
                        <div>[WARN] High memory usage detected in worker-1 (simulated)</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
