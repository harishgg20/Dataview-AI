"use client";

import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface ChartRendererProps {
    config: any;
    data: any[];
    height?: number;
}

export function ChartRenderer({ config, data = [], height = 500 }: ChartRendererProps) {

    // --- DATA PREPARATION ---
    const plotData = useMemo(() => {
        if (!data || data.length === 0) return [];

        let processedData = [...data];

        // Filter valid numerics for Y-Axis
        if (!config.isPivot && config.yAxis) {
            processedData = processedData.filter((row: any) => {
                const val = Number(row[config.yAxis]);
                return !isNaN(val) && row[config.yAxis] !== null && row[config.yAxis] !== '';
            });
        }

        // HISTOGRAM BINNING LOGIC (Client-side)
        if (config.type === 'histogram' && config.yAxis) {
            const values = data.map((r: any) => Number(r[config.yAxis])).filter((v: number) => !isNaN(v));
            if (values.length === 0) return [];

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
            return bins;
        }

        // OUTLIER REMOVAL (Scatter)
        if (config.type === 'scatter' && !config.showOutliers && !config.isPivot) {
            const vals = processedData.map((d: any) => Number(d[config.yAxis])).sort((a, b) => a - b);
            if (vals.length > 4) {
                const q1 = vals[Math.floor(vals.length * 0.25)];
                const q3 = vals[Math.floor(vals.length * 0.75)];
                const iqr = q3 - q1;
                const lower = q1 - 1.5 * iqr;
                const upper = q3 + 1.5 * iqr;

                processedData = processedData.filter(d => {
                    const val = Number(d[config.yAxis]);
                    return val >= lower && val <= upper;
                });
            }
        }

        return processedData;
    }, [data, config]);


    // --- OUTLIER HIGHLIGHTING DATA (Scatter Only) ---
    const outliersData = useMemo(() => {
        if (config.type !== 'scatter' || !config.showOutliers || config.isPivot) return [];
        const vals = data.map((d: any) => Number(d[config.yAxis])).sort((a, b) => a - b);
        if (vals.length < 5) return [];

        const q1 = vals[Math.floor(vals.length * 0.25)];
        const q3 = vals[Math.floor(vals.length * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;

        return data.filter(d => {
            const val = Number(d[config.yAxis]);
            return val < lower || val > upper;
        });
    }, [data, config]);


    // --- REFERENCE LINES ---
    const { avgVal, medianVal } = useMemo(() => {
        let avgVal: number | null = null;
        let medianVal: number | null = null;

        if (data.length > 0 && config.yAxis && (config.showAverage || config.showMedian)) {
            const vals = data.map(d => Number(d[config.yAxis])).filter(n => !isNaN(n));
            if (vals.length > 0) {
                if (config.showAverage) {
                    avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;
                }
                if (config.showMedian) {
                    const sorted = [...vals].sort((a, b) => a - b);
                    medianVal = sorted[Math.floor(sorted.length / 2)];
                }
            }
        }
        return { avgVal, medianVal };
    }, [data, config]);


    // --- RENDERING ---
    if (!config.type) return <div className="flex items-center justify-center bg-gray-50 h-full text-muted-foreground text-xs">Invalid Config</div>;

    // Correlation Heatmap (Client-side rendering not ideal inside generic component without dependency injection, skipping for standard charts)
    if (config.type === 'correlation') return <div className="flex items-center justify-center h-full text-xs">Correlation Matrix View</div>;

    if (plotData.length === 0) {
        return <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No data available</div>;
    }

    const commonProps = {
        data: plotData,
        margin: { top: 10, right: 30, left: 0, bottom: 20 }
    };

    const xKey = config.type === 'histogram' ? 'bin' : config.xAxis;
    const yKey = config.type === 'histogram' ? 'count' : config.yAxis;

    const renderRefLines = () => (
        <>
            {avgVal !== null && <ReferenceLine y={avgVal} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: `Avg`, fill: '#ef4444', fontSize: 10 }} />}
            {medianVal !== null && <ReferenceLine y={medianVal} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: `Med`, fill: '#10b981', fontSize: 10 }} />}
        </>
    );

    return (
        <ResponsiveContainer width="100%" height={height}>
            {(() => {
                switch (config.type) {
                    case 'bar':
                    case 'histogram':
                        return (
                            <BarChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} fontSize={10} interval="preserveStartEnd" />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Legend verticalAlign="top" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey={yKey} fill="#3b82f6" name={yKey} radius={[4, 4, 0, 0]} />
                                {renderRefLines()}
                            </BarChart>
                        );
                    case 'line':
                        return (
                            <LineChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Legend verticalAlign="top" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                <Line type="monotone" dataKey={yKey} stroke="#8884d8" strokeWidth={2} dot={false} />
                                {renderRefLines()}
                            </LineChart>
                        );
                    case 'area':
                        return (
                            <AreaChart {...commonProps}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={60} fontSize={10} />
                                <YAxis fontSize={10} />
                                <Tooltip />
                                <Legend verticalAlign="top" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                <Area type="monotone" dataKey={yKey} stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                {renderRefLines()}
                            </AreaChart>
                        );
                    case 'scatter':
                        return (
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="category" dataKey={xKey} name={xKey} fontSize={10} height={60} angle={-45} textAnchor="end" />
                                <YAxis type="number" dataKey={yKey} name={yKey} fontSize={10} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Legend verticalAlign="top" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                                <Scatter name="Data" data={plotData} fill="#8884d8" />
                                {outliersData.length > 0 && (
                                    <Scatter name="Outliers" data={outliersData} fill="#ef4444" shape="cross" />
                                )}
                                {renderRefLines()}
                            </ScatterChart>
                        );
                    case 'pie':
                        return (
                            <PieChart>
                                <Pie data={plotData} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={height / 2 - 40} fill="#8884d8" label>
                                    {plotData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        );
                    default:
                        return <div>Unsupported chart type: {config.type}</div>;
                }
            })()}
        </ResponsiveContainer>
    );
}
