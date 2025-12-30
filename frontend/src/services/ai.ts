import api from '@/lib/api';

export interface Insight {
    type: 'kpi_driver' | 'segment_comparison' | 'outlier' | 'data_quality' | 'trend' | 'anomaly' | 'correlation' | 'distribution' | 'seasonality' | 'pareto' | 'underperformer' | 'risk_alert' | 'change_summary' | 'benchmark' | 'opportunity';
    message: string;
    confidence: number;
    details?: {
        reasoning: string;
        sample_size: number;
        action_item: string;
        related_filter?: { column: string; value: string };
    };
    isBookmarked?: boolean;
}

export const aiService = {
    generateInsights: async (sourceId: number, focus: string = 'general') => {
        const response = await api.post<{ insights: Insight[] }>('/ai/generate', {
            source_id: sourceId,
            focus: focus
        });
        return response.data;
    },

    saveInsight: async (sourceId: number, insight: Insight) => {
        const response = await api.post('/ai/save', {
            source_id: sourceId,
            type: insight.type,
            message: insight.message,
            confidence: insight.confidence,
            details: insight.details || {}
        });
        return response.data;
    },

    getSavedInsights: async (sourceId: number) => {
        const response = await api.get<{ insights: Insight[] }>(`/ai/saved/${sourceId}`);
        return response.data;
    },

    askData: async (sourceId: number, question: string) => {
        const response = await api.post<{ answer: string; chart?: any }>('/ai/ask', {
            source_id: sourceId,
            question: question
        });
        return response.data;
    }
};
