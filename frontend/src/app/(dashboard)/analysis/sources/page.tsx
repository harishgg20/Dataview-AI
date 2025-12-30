"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Database, FileSpreadsheet, Globe, Plus } from "lucide-react";

export default function DataSourcesPage() {
    const sources = [
        { id: 1, name: "Production DB", type: "PostgreSQL", status: "Connected" },
        { id: 2, name: "Sales CSV", type: "CSV Upload", status: "Syncing" },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Source
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {sources.map((source) => (
                    <Card key={source.id}>
                        <CardHeader className="flex flex-row items-center gap-4 py-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Database className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-base">{source.name}</CardTitle>
                                <CardDescription>{source.type}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-muted-foreground">{source.status}</span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}

                <Card className="border-dashed flex items-center justify-center min-h-[120px] cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Plus className="h-8 w-8" />
                        <span className="text-sm font-medium">Connect New Source</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}
