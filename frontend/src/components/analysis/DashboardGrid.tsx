"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { dataSourceService } from "@/services/dataSource";
import { SavedChart } from "@/services/analysis";
import { ChartRenderer } from "./ChartRenderer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FilterX, Plus } from "lucide-react";
import { useMemo } from "react";

interface DashboardGridProps {
    charts: SavedChart[];
}

function ChartCard({ chart }: { chart: SavedChart }) {
    const { globalFilters, selections, setSelection } = useDashboardStore();

    // 1. Merge Global Filters + Cross-Filtering Selections
    const activeFilters = useMemo(() => {
        const filters = [...globalFilters];

        // Add selections from OTHER charts (Cross-filtering)
        Object.entries(selections).forEach(([sourceChartId, selection]) => {
            if (sourceChartId === chart.id.toString()) return; // Don't filter self by self

            Object.entries(selection).forEach(([col, val]) => {
                filters.push({
                    id: `cross-${sourceChartId}-${col}`,
                    column: col,
                    operator: 'eq',
                    value: String(val)
                });
            });
        });

        // Add Chart-Specific Filters (Saved with chart)
        if (chart.config.filterRules) {
            chart.config.filterRules.forEach((rule: any) => {
                filters.push({
                    id: `saved-${rule.id}`,
                    column: rule.column,
                    operator: rule.operator,
                    value: rule.value
                });
            });
        }

        return filters;
    }, [globalFilters, selections, chart.id, chart.config.filterRules]);

    // 2. Fetch Data
    const { data: queryResult, isLoading, error, isFetching } = useQuery({
        queryKey: ['chart-data', chart.id, activeFilters],
        queryFn: async () => {
            const config = chart.config.chartConfig;
            const limitConfig = chart.config.limitConfig;

            // Map to backend schema
            const backendFilters = activeFilters.map(f => ({
                column: f.column,
                operator: f.operator,
                value: f.value
            }));

            // Determine Sort
            let sortBy: string | undefined = undefined;
            let sortDir: string | undefined = undefined;
            if (limitConfig?.enabled && (limitConfig.type === 'top' || limitConfig.type === 'bottom')) {
                if (config.isPivot || (config.xAxis && config.agg)) {
                    sortBy = config.yAxis;
                    sortDir = limitConfig.type === 'top' ? 'desc' : 'asc';
                }
            }

            const query: any = {
                filters: backendFilters,
                group_by: config.isPivot ? config.xAxis : undefined,
                agg_column: (config.isPivot || config.agg) ? config.yAxis : undefined,
                agg_method: config.agg,
                limit: limitConfig?.enabled ? limitConfig.value : 5000,
                sort_by: sortBy,
                sort_direction: sortDir
            };

            if (!config.isPivot) {
                delete query.group_by;
                delete query.agg_method;
                delete query.agg_column;
            }

            // Assuming chart.data_source_id is valid. If null, we skip?
            if (!chart.data_source_id) throw new Error("No data source linked");

            return await dataSourceService.queryData(chart.data_source_id, query);
        },
        enabled: !!chart.data_source_id,
        staleTime: 1000 * 60 * 5 // 5 mins cache
    });

    // 3. Handle Click (Cross-Filtering)
    const handlePointClick = (pointData: any) => {
        // e.g. clicked on bar "Category: Electronics"
        // We set selection for this chartId: { Category: 'Electronics' }
        const dimCol = chart.config.chartConfig.xAxis; // The dimension
        if (dimCol && pointData[dimCol]) {
            setSelection(chart.id.toString(), { [dimCol]: pointData[dimCol] });
        }
    };

    const isFiltered = selections[chart.id.toString()] !== undefined;

    return (
        <Card className="flex flex-col h-[400px] hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">{chart.name}</CardTitle>
                    {isFetching && <span className="text-xs text-blue-500 animate-pulse">Refreshing...</span>}
                </div>
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-50"
                        onClick={() => setSelection(chart.id.toString(), null)}
                        title="Clear selection"
                    >
                        <FilterX className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4">
                <ChartRenderer
                    config={chart.config.chartConfig}
                    data={queryResult?.data || []}
                    loading={isLoading}
                    error={error ? (error as Error).message : null}
                    onPointClick={handlePointClick}
                    height="100%"
                />
            </CardContent>
        </Card>
    );
}

interface DashboardGridProps {
    charts: SavedChart[];
    onAddVisual?: () => void;
}

export function DashboardGrid({ charts, onAddVisual }: DashboardGridProps) {
    const { isEditMode } = useDashboardStore();

    if (charts.length === 0 && !isEditMode) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p>No saved charts yet. Click "Edit Dashboard" to add one!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
            {charts.map(chart => (
                <ChartCard key={chart.id} chart={chart} />
            ))}

            {/* Edit Mode Placeholder */}
            {isEditMode && (
                <div
                    onClick={onAddVisual}
                    className="h-[400px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all animate-in fade-in"
                >
                    <Plus className="h-10 w-10 mb-2" />
                    <span className="font-semibold">Add Visual</span>
                </div>
            )}
        </div>
    );
}
