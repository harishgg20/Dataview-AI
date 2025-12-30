import api from "@/lib/api";

export interface SystemStats {
    status: string;
    database: {
        status: string;
        latency_ms: number;
    };
    usage: {
        active_datasets: number;
        total_insights: number;
    };
    freshness: {
        last_ingestion: string | null;
        status: string;
        expected_refresh: string;
    };
    performance: {
        avg_query_time_ms: number;
        slowest_query_s: number;
        cached_queries_pct: number;
    };
    insight_quality: {
        high: number;
        medium: number;
        low: number;
    };
    data_coverage: {
        pct: number;
        missing_dates: number;
        affected_kpis: string[];
    };
    schema_changes: Array<{
        type: string;
        column: string;
        detail: string;
    }>;
    dataset_health: Array<{
        name: string;
        freshness: string;
        quality: string;
        last_query: string;
    }>;
    data_quality_alerts: Array<{
        message: string;
        severity: string;
    }>;
    activity: Array<{
        type: string;
        message: string;
        time: string;
        status: string;
    }>;
}

export const monitoringService = {
    getStats: async (datasetId?: string): Promise<SystemStats> => {
        const url = datasetId ? `/monitoring/stats?dataset_id=${datasetId}` : "/monitoring/stats";
        const response = await api.get(url);
        return response.data;
    }
};
