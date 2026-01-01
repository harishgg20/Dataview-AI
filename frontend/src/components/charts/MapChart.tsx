"use client";

import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

interface MapChartProps {
    data: any[];
    countryCol: string;
    valueCol: string;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function MapChart({ data, countryCol, valueCol }: MapChartProps) {

    // Aggregate data by country
    const aggregatedData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach(row => {
            const country = row[countryCol];
            const value = parseFloat(row[valueCol]);

            // Basic normalization of country names (very naive)
            if (country) {
                const normalized = country.toString().trim(); // In real app, consider fuzzy matching or ISO codes
                counts[normalized] = (counts[normalized] || 0) + (isNaN(value) ? 1 : value); // Sum values or count rows if no value
            }
        });
        return counts;
    }, [data, countryCol, valueCol]);

    // Color Scale
    const colorScale = useMemo(() => {
        const values = Object.values(aggregatedData);
        const min = Math.min(...values, 0);
        const max = Math.max(...values, 100); // Default max to avoid 0/0
        return scaleLinear<string>()
            .domain([min, max])
            .range(["#ffedea", "#ff5233"]);
    }, [aggregatedData]);

    return (
        <div className="w-full h-[400px] border rounded-lg bg-slate-50 overflow-hidden relative">
            <ComposableMap
                projectionConfig={{
                    rotate: [-10, 0, 0],
                    scale: 147
                }}
            >
                <Sphere stroke="#E4E5E6" strokeWidth={0.5} id="sphere" fill="transparent" />
                <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
                {aggregatedData && Object.keys(aggregatedData).length > 0 && (
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Try to match by Name or ISO
                                const countryName = geo.properties.name;
                                const d = aggregatedData[countryName] || aggregatedData[geo.id]; // Try ID (ISO) too

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={d ? colorScale(d) : "#F5F4F6"}
                                        stroke="#D6D6DA"
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#F53", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                        // Simple tooltip via title attribute
                                        {...({ title: `${countryName}: ${d ? d.toFixed(2) : "N/A"}` } as any)}
                                    />
                                );
                            })
                        }
                    </Geographies>
                )}
            </ComposableMap>

            <div className="absolute bottom-2 right-2 bg-white/80 p-2 text-xs rounded shadow backdrop-blur-sm">
                <div className="font-semibold mb-1">Legend</div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-[#ffedea] border"></div> Low
                    <div className="w-3 h-3 bg-[#ff5233] border ml-2"></div> High
                </div>
            </div>
        </div>
    );
}
