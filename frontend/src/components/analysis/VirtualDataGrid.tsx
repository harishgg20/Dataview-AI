import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { dataSourceService } from '@/services/dataSource';
import { Card, CardContent } from '@/components/ui/card';

interface VirtualDataGridProps {
    sourceId: number;
    initialColumns: string[];
}

export function VirtualDataGrid({ sourceId, initialColumns }: VirtualDataGridProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const [rows, setRows] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [columns, setColumns] = useState<string[]>(initialColumns);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load
    useEffect(() => {
        setIsLoading(true);
        // Load first chunk to get total count
        dataSourceService.getRows(sourceId, 0, 100).then(data => {
            setRows(data.rows);
            setTotalRows(data.total_rows);
            // Ensure columns are up to date from actual data if needed, or use props
            if (data.rows.length > 0 && columns.length === 0) {
                setColumns(Object.keys(data.rows[0]));
            }
        }).finally(() => setIsLoading(false));
    }, [sourceId]);

    const rowVirtualizer = useVirtualizer({
        count: totalRows,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35, // 35px row height ESTIMATE
        overscan: 10, // Render 10 items outside view
    });

    const items = rowVirtualizer.getVirtualItems();

    // Infinite Scroll Logic
    // We check if we need to load more data based on the items currently being rendered
    useEffect(() => {
        if (items.length === 0) return;

        const lastItem = items[items.length - 1];
        // If the last visible item is beyond what we have loaded
        if (lastItem.index >= rows.length - 1 && !isLoading && rows.length < totalRows) {
            loadMore(rows.length);
        }
    }, [items, rows.length, totalRows, isLoading]);

    const loadMore = useCallback(async (startIndex: number) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Load next batch (e.g., 100 rows)
            const count = 100;
            const res = await dataSourceService.getRows(sourceId, startIndex, startIndex + count);

            setRows(prev => {
                const newRows = [...prev];
                // Insert new rows at correct index? 
                // Simple append for now as we are scrolling down linearly.
                // For random access we'd need a map or sparsely populated array.
                // Given standard scrolling, append works if we don't jump.
                return [...prev, ...res.rows];
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, sourceId]);

    return (
        <Card className="h-full border-none shadow-none">
            <CardContent className="p-0 h-[600px] relative font-mono text-sm">
                <div className="overflow-auto h-full w-full border rounded-md bg-white text-slate-600" ref={parentRef}>
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${items[0]?.start ?? 0}px)`,
                            }}
                        >
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-gray-100 sticky top-0 md:relative z-10 hidden">
                                    {/* Sticky header is tricky in virtualized list without separate sticky div. 
                                       For now, we render header in a separate div above if needed, or simple row 0.
                                       Simplest: Plain rows.
                                   */}
                                </thead>
                                <tbody>
                                    {items.map((virtualRow) => {
                                        const row = rows[virtualRow.index];
                                        return (
                                            <tr
                                                key={virtualRow.key}
                                                data-index={virtualRow.index}
                                                ref={rowVirtualizer.measureElement}
                                                className="border-b hover:bg-gray-50 h-[35px]"
                                                style={{ height: '35px' }} // fixed height for perf
                                            >
                                                <td className="w-[50px] p-2 text-gray-400 border-r bg-gray-50 select-none">
                                                    {virtualRow.index + 1}
                                                </td>
                                                {row ? columns.map(col => (
                                                    <td key={col} className="p-2 border-r truncate max-w-[200px] text-gray-900" title={String(row[col])}>
                                                        {String(row[col] ?? "")}
                                                    </td>
                                                )) : (
                                                    <td colSpan={columns.length} className="p-2 text-gray-300 italic">
                                                        Loading...
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 w-full bg-gray-100 border-b z-20 flex overflow-hidden ml-[0px] pl-[1px] pr-[17px]">
                    <div className="w-[50px] p-2 border-r font-bold text-gray-500 bg-gray-200 shrink-0">#</div>
                    <div className="flex flex-1 overflow-hidden" ref={el => { if (el && parentRef.current) el.scrollLeft = parentRef.current.scrollLeft }}>
                        {columns.map(col => (
                            <div key={col} className="flex-1 min-w-[150px] p-2 font-semibold border-r truncate">
                                {col}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-4 right-8 bg-black/80 text-white px-3 py-1 rounded-full text-xs shadow-lg backdrop-blur">
                    {rows.length.toLocaleString()} / {totalRows.toLocaleString()} rows loaded
                </div>
            </CardContent>
        </Card>
    );
}
