import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useState } from "react";

export interface FilterRule {
    id: string;
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains';
    value: string;
}

interface FilterBuilderProps {
    columns: string[];
    filters: FilterRule[];
    setFilters: (filters: FilterRule[]) => void;
    title?: string;
    className?: string;
}

export function FilterBuilder({ columns, filters, setFilters, title = "Filter Builder", className = "" }: FilterBuilderProps) {
    const [newFilter, setNewFilter] = useState<FilterRule>({ id: '', column: '', operator: 'contains', value: '' });

    const addFilter = () => {
        if (!newFilter.column) return;
        setFilters([...filters, { ...newFilter, id: Date.now().toString() }]);
        setNewFilter({ ...newFilter, value: '' });
    };

    return (
        <div className={`p-4 bg-yellow-50 border rounded-md space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-yellow-800 flex items-center gap-2">
                    <Filter className="h-4 w-4" /> {title}
                </h3>
                {filters.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters([])} className="text-red-600 hover:bg-red-50 h-6 px-2">
                        Clear ({filters.length})
                    </Button>
                )}
            </div>

            {/* Active Filters List */}
            <div className="flex flex-wrap gap-2">
                {filters.map(rule => (
                    <div key={rule.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded border text-xs shadow-sm">
                        <span className="font-medium text-blue-600">{rule.column}</span>
                        <span className="text-gray-500">{rule.operator}</span>
                        <span className="font-mono bg-gray-100 px-1 rounded">{rule.value}</span>
                        <button
                            onClick={() => setFilters(filters.filter(r => r.id !== rule.id))}
                            className="text-red-400 hover:text-red-600 font-bold ml-1"
                        >
                            ×
                        </button>
                    </div>
                ))}
                {filters.length === 0 && <span className="text-xs text-muted-foreground italic">No filters applied.</span>}
            </div>

            {/* New Filter Form */}
            <div className="flex gap-2 items-center flex-wrap">
                <select
                    className="p-2 border rounded text-sm min-w-[120px]"
                    value={newFilter.column}
                    onChange={e => setNewFilter({ ...newFilter, column: e.target.value })}
                >
                    <option value="">Column...</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                    className="p-2 border rounded text-sm w-[110px]"
                    value={newFilter.operator}
                    onChange={e => setNewFilter({ ...newFilter, operator: e.target.value as any })}
                >
                    <option value="contains">Contains</option>
                    <option value="not_contains">!Contains</option>
                    <option value="eq">=</option>
                    <option value="neq">!=</option>
                    <option value="gt">&gt;</option>
                    <option value="lt">&lt;</option>
                    <option value="gte">&gt;=</option>
                    <option value="lte">&lt;=</option>
                </select>

                <input
                    type="text"
                    placeholder="Value..."
                    className="p-2 border rounded text-sm flex-1 min-w-[100px]"
                    value={newFilter.value}
                    onChange={e => setNewFilter({ ...newFilter, value: e.target.value })}
                    onKeyDown={e => {
                        if (e.key === 'Enter') addFilter();
                    }}
                />

                <Button size="sm" onClick={addFilter}>Add</Button>
            </div>
        </div>
    );
}
