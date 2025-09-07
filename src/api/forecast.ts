import { supabase } from '@/lib/supabaseClient';
import { logApiUsage } from '@/api/apiUsage';

export interface ForecastData {
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  averageMonthlyRevenue: number;
  forecastNextMonth: number;
  forecastConfidence: number;
  insights: string[];
}

export interface ForecastResponse {
  data: ForecastData | null;
  error: string | null;
}

/**
 * Generate revenue forecast using AI
 */
export const generateRevenueForecast = async (): Promise<ForecastResponse> => {
  try {
    // Get revenue data from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: revenueData, error: revenueError } = await supabase
      .from('invoices')
      .select('amount, paid_date')
      .eq('status', 'paid')
      .gte('paid_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('paid_date', { ascending: true });

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
      return {
        data: null,
        error: 'Failed to fetch revenue data for forecast',
      };
    }

    if (!revenueData || revenueData.length === 0) {
      return {
        data: null,
        error: 'No revenue data available for forecast',
      };
    }

    // Aggregate revenue by month
    const monthlyRevenue: { [key: string]: number } = {};
    revenueData.forEach((invoice: any) => {
      if (invoice.paid_date && invoice.amount) {
        const date = new Date(invoice.paid_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + invoice.amount;
      }
    });

    const sortedMonthlyData = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    if (sortedMonthlyData.length < 2) {
      return {
        data: null,
        error: 'Insufficient data for forecast (need at least 2 months of data)',
      };
    }

    // Calculate basic statistics
    const revenues = sortedMonthlyData.map((d) => d.revenue);
    const averageMonthlyRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;

    // Calculate trend
    const firstHalf = revenues.slice(0, Math.floor(revenues.length / 2));
    const secondHalf = revenues.slice(Math.floor(revenues.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, rev) => sum + rev, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, rev) => sum + rev, 0) / secondHalf.length;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';

    // Simple linear regression for forecast
    const n = revenues.length;
    const xSum = revenues.reduce((sum, _, i) => sum + i, 0);
    const ySum = revenues.reduce((sum, rev) => sum + rev, 0);
    const xySum = revenues.reduce((sum, rev, i) => sum + rev * i, 0);
    const xxSum = revenues.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const forecastNextMonth = intercept + slope * n;

    // Calculate confidence (simplified)
    const residuals = revenues.map((rev, i) => rev - (intercept + slope * i));
    const mse = residuals.reduce((sum, res) => sum + res * res, 0) / n;
    const rmse = Math.sqrt(mse);
    const confidence = Math.max(0, Math.min(100, 100 - (rmse / averageMonthlyRevenue) * 100));

    // Generate insights
    const insights: string[] = [];

    if (trend === 'increasing') {
      insights.push(
        `Revenue is trending upward with an average monthly increase of ${changePercent.toFixed(
          1,
        )}%`,
      );
    } else if (trend === 'decreasing') {
      insights.push(
        `Revenue is trending downward with an average monthly decrease of ${Math.abs(
          changePercent,
        ).toFixed(1)}%`,
      );
    } else {
      insights.push('Revenue has been relatively stable over the past 6 months');
    }

    if (forecastNextMonth > averageMonthlyRevenue * 1.1) {
      insights.push("Next month's forecast suggests strong growth");
    } else if (forecastNextMonth < averageMonthlyRevenue * 0.9) {
      insights.push("Next month's forecast suggests potential decline");
    }

    const volatility = rmse / averageMonthlyRevenue;
    if (volatility > 0.3) {
      insights.push('Revenue shows high volatility - consider diversifying income sources');
    }

    const forecastData: ForecastData = {
      revenueData: sortedMonthlyData,
      trend,
      averageMonthlyRevenue,
      forecastNextMonth: Math.max(0, forecastNextMonth),
      forecastConfidence: confidence,
      insights,
    };

    return {
      data: forecastData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error generating forecast:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while generating the forecast',
    };
  }
};

/**
 * Generate forecast using OpenAI (if available)
 */
export const generateAIForecast = async (): Promise<ForecastResponse> => {
  try {
    const baseForecast = await generateRevenueForecast();

    if (baseForecast.error || !baseForecast.data) {
      return baseForecast;
    }

    // Check if OpenAI API key is available
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiKey) {
      return baseForecast; // Return basic forecast if no OpenAI key
    }

    try {
      const forecastData = baseForecast.data;

      // Prepare data for OpenAI
      const revenueText = forecastData.revenueData
        .map((d) => `${d.month}: $${d.revenue.toLocaleString()}`)
        .join('\n');

      const prompt = `Based on the following monthly revenue data:
${revenueText}

Current trend: ${forecastData.trend}
Average monthly revenue: $${forecastData.averageMonthlyRevenue.toLocaleString()}
Next month forecast: $${forecastData.forecastNextMonth.toLocaleString()}

Please provide a brief, professional analysis of this revenue trend and forecast. Include:
1. Key insights about the revenue pattern
2. Potential reasons for the observed trend
3. Recommendations for the business
4. Any risks or opportunities to consider

Keep the response concise and actionable.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiAnalysis = data.choices[0]?.message?.content || 'AI analysis not available';

      // Log API usage
      await logApiUsage({
        service: 'OpenAI',
        description: 'Revenue forecast analysis',
        cost: 0.002, // Approximate cost for GPT-3.5-turbo
        tokens_used: data.usage?.total_tokens || 300,
      });

      // Enhance insights with AI analysis
      forecastData.insights.push('--- AI Analysis ---');
      forecastData.insights.push(aiAnalysis);

      return {
        data: forecastData,
        error: null,
      };
    } catch (aiError) {
      console.warn('AI forecast enhancement failed, using basic forecast:', aiError);
      return baseForecast;
    }
  } catch (error) {
    console.error('Unexpected error in AI forecast:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while generating the AI forecast',
    };
  }
};
