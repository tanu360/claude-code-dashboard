export interface ModelBreakdown {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed?: string[];
  modelBreakdowns?: ModelBreakdown[];
}

export interface UsageResponse {
  unpricedModels?: string[];
  timezone?: string;
  asOf?: string;
  source?: string;
  daily: DailyUsage[];
  weekly?: DailyUsage[];
  monthly?: DailyUsage[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalTokens: number;
    totalCost: number;
  };
}

export interface ExchangeRate {
  date: string;
  rate: number;
}

export type Currency = 'USD' | 'INR';
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';
