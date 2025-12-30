"use client";

import { useEffect, useState } from "react";
import { Widget } from "@/services/dashboard";
import { dataSourceService } from "@/services/dataSource";
import { ChartRenderer } from "@/components/visualization/ChartRenderer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardWidgetProps {
    widget: Widget;
    onDelete?: (id: number) => void;
}

export function DashboardWidget({ widget, onDelete }: DashboardWidgetProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [widget.config]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const sourceId = widget.config.sourceId;
            if (!sourceId) {
                // Determine if this is a static widget or text
                if (widget.type === 'text') {
                    setLoading(false);
                    return;
                }
                throw new Error("Widget missing data source configuration");
            }

            // Fetch data
            // TODO: In real app, optimize to only fetch needed columns or aggregated data
            const response = await dataSourceService.getPreview(sourceId);
            setData(response.data);
        } catch (err) {
            console.error("Failed to load widget data", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow relative group">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate" title={widget.title}>{widget.title}</CardTitle>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500 transition-opacity absolute top-2 right-2"
                            onClick={() => onDelete(widget.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <CardDescription className="text-xs truncate">
                    {widget.config.type ? widget.config.type.toUpperCase() : "Widget"}
                    {widget.config.yAxis && ` • ${widget.config.yAxis}`}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-500 text-sm">
                        {error}
                    </div>
                ) : (
                    <ChartRenderer
                        config={widget.config}
                        data={data}
                        height={300}
                    />
                )}
            </CardContent>
        </Card>
    );
}
