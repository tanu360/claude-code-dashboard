'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  DollarSign,
  TrendingUp,
  Calendar,
  Cpu,
  RefreshCw,
  Edit3,
  Check,
  X,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  CreditCard,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Languages,
  Globe,
  IndianRupee,
  Hash,
  Timer,
  Lightbulb,
  Zap,
  Monitor
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UsageResponse, Currency, DailyUsage } from '@/types/usage';
import { useTranslations, type Locale } from '@/locales';
import { useTheme } from '@/components/theme-provider';

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [ratesLoading, setRatesLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(83);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [inputRate, setInputRate] = useState<string>('83');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minCostFilter, setMinCostFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Get translations based on current language
  const t = useTranslations(language as Locale);

  const fetchData = useCallback(async () => {
    try {
      // Add API key header if available (for production)
      const headers: HeadersInit = {};
      if (process.env.NEXT_PUBLIC_API_KEY) {
        headers['x-api-key'] = process.env.NEXT_PUBLIC_API_KEY;
      }

      const response = await fetch('/api/usage', { headers });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const usageData = await response.json();
      setData(usageData);

      // Fetch exchange rate only once per session unless manually refreshed
      const rates: Record<string, number> = {};
      let fetchedRate = 83; // Default fallback

      // Only fetch the most recent exchange rate instead of all dates
      if (usageData.daily.length > 0) {
        try {
          const latestDate = usageData.daily[usageData.daily.length - 1].date; // Get latest date
          const rateResponse = await fetch(`/api/exchange-rate?date=${latestDate}`, { headers });
          const rateData = await rateResponse.json();
          fetchedRate = rateData.rate;
        } catch {
          // Keep default rate as fallback
        }
      }

      // Apply the same rate to all dates to avoid multiple API calls
      for (const day of usageData.daily) {
        rates[day.date] = fetchedRate;
      }

      setExchangeRates(rates);
      setCurrentRate(fetchedRate);
      setInputRate(fetchedRate.toString());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Remove dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle scroll for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [minCostFilter, timePeriod, sortField, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const formatCurrency = (amount: number, date?: string) => {
    if (currency === 'INR') {
      // Use specific date rate, or current rate if no date provided
      const rate = date && exchangeRates[date]
        ? exchangeRates[date]
        : currentRate;
      const inrAmount = amount * rate;
      return `₹${inrAmount.toLocaleString('hi-IN', { maximumFractionDigits: 0 })}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const handleRateChange = () => {
    const newRate = parseFloat(inputRate);
    if (!isNaN(newRate) && newRate > 0) {
      setCurrentRate(newRate);
      // Update all exchange rates to use the new rate for consistency
      const updatedRates: Record<string, number> = {};
      Object.keys(exchangeRates).forEach(date => {
        updatedRates[date] = newRate;
      });
      setExchangeRates(updatedRates);
      setIsEditingRate(false);
    }
  };

  const handleRateCancel = () => {
    setInputRate(currentRate.toString());
    setIsEditingRate(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const aggregateDataByWeek = (dailyData: DailyUsage[]) => {
    const weeklyData = new Map();

    dailyData.forEach(day => {
      const date = new Date(day.date);
      // Get the Monday of the week (ISO week)
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(date);
      monday.setDate(date.getDate() + mondayOffset);
      const weekKey = monday.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          date: weekKey,
          totalCost: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          count: 0
        });
      }

      const weekData = weeklyData.get(weekKey);
      weekData.totalCost += day.totalCost;
      weekData.totalTokens += day.totalTokens;
      weekData.inputTokens += day.inputTokens;
      weekData.outputTokens += day.outputTokens;
      weekData.cacheCreationTokens += day.cacheCreationTokens;
      weekData.cacheReadTokens += day.cacheReadTokens;
      weekData.count += 1;
    });

    return Array.from(weeklyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const aggregateDataByMonth = (dailyData: DailyUsage[]) => {
    const monthlyData = new Map();

    dailyData.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          date: monthKey,
          totalCost: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          count: 0
        });
      }

      const monthData = monthlyData.get(monthKey);
      monthData.totalCost += day.totalCost;
      monthData.totalTokens += day.totalTokens;
      monthData.inputTokens += day.inputTokens;
      monthData.outputTokens += day.outputTokens;
      monthData.cacheCreationTokens += day.cacheCreationTokens;
      monthData.cacheReadTokens += day.cacheReadTokens;
      monthData.count += 1;
    });

    return Array.from(monthlyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortedData = (dataToSort: DailyUsage[]) => {
    return [...dataToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'totalCost':
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case 'inputTokens':
          aValue = a.inputTokens;
          bValue = b.inputTokens;
          break;
        case 'outputTokens':
          aValue = a.outputTokens;
          bValue = b.outputTokens;
          break;
        case 'cacheCreationTokens':
          aValue = a.cacheCreationTokens;
          bValue = b.cacheCreationTokens;
          break;
        case 'cacheReadTokens':
          aValue = a.cacheReadTokens;
          bValue = b.cacheReadTokens;
          break;
        case 'totalTokens':
          aValue = a.totalTokens;
          bValue = b.totalTokens;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    }
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const getChartData = () => {
    if (!data) return [];

    let processedData = data.daily;

    // Aggregate data based on time period
    if (timePeriod === 'weekly') {
      processedData = aggregateDataByWeek(data.daily);
    } else if (timePeriod === 'monthly') {
      processedData = aggregateDataByMonth(data.daily);
    }

    return processedData
      .slice()
      .map(item => {
        const date = new Date(item.date);
        let dateLabel = '';

        if (timePeriod === 'daily') {
          dateLabel = date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
            month: 'short',
            day: 'numeric'
          });
        } else if (timePeriod === 'weekly') {
          const endDate = new Date(date);
          endDate.setDate(date.getDate() + 6);
          dateLabel = `${date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
            month: 'short',
            day: 'numeric'
          })} - ${endDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
            month: 'short',
            day: 'numeric'
          })}`;
        } else if (timePeriod === 'monthly') {
          dateLabel = date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
            year: 'numeric',
            month: 'long'
          });
        }

        return {
          date: dateLabel,
          cost: currency === 'INR'
            ? item.totalCost * currentRate  // Use current rate for all aggregated data
            : item.totalCost,
          tokens: item.totalTokens / 1000000,
          inputTokens: item.inputTokens / 1000000,
          outputTokens: item.outputTokens / 1000000,
          cacheTokens: (item.cacheCreationTokens + item.cacheReadTokens) / 1000000,
          originalDate: item.date
        };
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-full h-full border-4 border-muted rounded-full animate-spin border-t-primary"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">Loading Dashboard</p>
            <p className="text-muted-foreground">Fetching your Claude Code analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Activity className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Failed to Load Data</CardTitle>
            <CardDescription>
              Unable to fetch Claude Code usage data. Please check your setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-wrap justify-center gap-2">
                <div className="flex gap-2 items-center">
                  <Button
                    variant={timePeriod === 'daily' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('daily')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {t.timePeriod.daily}
                  </Button>
                  <Button
                    variant={timePeriod === 'weekly' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('weekly')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {t.timePeriod.weekly}
                  </Button>
                  <Button
                    variant={timePeriod === 'monthly' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('monthly')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {t.timePeriod.monthly}
                  </Button>
                </div>
              </div>

              {currency === 'INR' && (
                <div className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1 bg-background">
                  {!isEditingRate ? (
                    <>
                      <span className="text-muted-foreground">1 USD =</span>
                      <span className="font-medium">₹{currentRate.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => setIsEditingRate(true)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">1 USD = ₹</span>
                      <input
                        type="number"
                        value={inputRate}
                        onChange={(e) => setInputRate(e.target.value)}
                        className="w-16 px-1 text-center bg-transparent border-b border-border"
                        step="0.01"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-chart-1"
                        onClick={handleRateChange}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-destructive"
                        onClick={handleRateCancel}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')}
                  title={currency === 'USD' ? 'Switch to INR' : 'Switch to USD'}
                >
                  {currency === 'USD' ? (
                    <span className="text-sm font-medium">USD</span>
                  ) : (
                    <span className="text-sm font-medium">INR</span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                >
                  {language === 'en' ? (
                    <Languages className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (theme === 'light') {
                      setTheme('dark');
                    } else if (theme === 'dark') {
                      setTheme('system');
                    } else {
                      setTheme('light');
                    }
                  }}
                  title={
                    theme === 'light' 
                      ? 'Switch to dark mode' 
                      : theme === 'dark' 
                      ? 'Switch to system theme' 
                      : 'Switch to light mode'
                  }
                >
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4" />
                  ) : theme === 'dark' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t.stats.newUsage}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Cost Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.stats.totalCost}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(data.totals.totalCost)}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {(() => {
                      // Calculate growth based on selected time period
                      const dailyData = data.daily || [];

                      let processedData, recentTotal, previousTotal, periodLabel;

                      if (timePeriod === 'weekly') {
                        processedData = aggregateDataByWeek(dailyData);
                        if (processedData.length < 2) {
                          return (
                            <>
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {t.stats.insufficientData}
                              </span>
                            </>
                          );
                        }
                        const recent = processedData[processedData.length - 1];
                        const previous = processedData[processedData.length - 2];
                        recentTotal = recent.totalCost;
                        previousTotal = previous.totalCost;
                        periodLabel = t.stats.fromLastWeek;
                      } else if (timePeriod === 'monthly') {
                        processedData = aggregateDataByMonth(dailyData);
                        if (processedData.length < 2) {
                          return (
                            <>
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {t.stats.insufficientData}
                              </span>
                            </>
                          );
                        }
                        const recent = processedData[processedData.length - 1];
                        const previous = processedData[processedData.length - 2];
                        recentTotal = recent.totalCost;
                        previousTotal = previous.totalCost;
                        periodLabel = t.stats.fromLastMonth;
                      } else {
                        // Daily view - compare yesterday vs day before yesterday
                        if (dailyData.length < 2) {
                          return (
                            <>
                              <TrendingUp className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {t.stats.insufficientData}
                              </span>
                            </>
                          );
                        }
                        const yesterday = dailyData[dailyData.length - 1];
                        const dayBefore = dailyData[dailyData.length - 2];
                        recentTotal = yesterday.totalCost || 0;
                        previousTotal = dayBefore.totalCost || 0;
                        periodLabel = t.stats.fromYesterday;
                      }

                      if (previousTotal === 0) {
                        return (
                          <>
                            <TrendingUp className="w-3 h-3 text-success" />
                            <span className="text-success">New usage</span>
                          </>
                        );
                      }

                      const growth = ((recentTotal - previousTotal) / previousTotal) * 100;
                      const isPositive = growth > 0;

                      return (
                        <>
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-success" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-destructive" />
                          )}
                          <span className={isPositive ? "text-success" : "text-destructive"}>
                            {isPositive ? '+' : ''}{growth.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">
                            {periodLabel}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.dailyAvg}: <span className="text-sm font-bold text-success">{formatCurrency(data.totals.totalCost / data.daily.length)}</span>
                  </div>
                </div>
                <div>
                  {currency === 'INR' ? (
                    <IndianRupee className="w-8 h-8 text-muted-foreground" />
                  ) : (
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Tokens Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.stats.totalTokens}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{(data.totals.totalTokens / 1000000).toFixed(1)}M</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Cpu className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      {t.stats.processingPower}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.input}: <span className="text-sm font-bold">{((data.totals.inputTokens || 0) / 1000000).toFixed(1)}M</span> • {t.stats.output}: <span className="text-sm font-bold">{((data.totals.outputTokens || 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
                <div>
                  <Cpu className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Efficiency Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.stats.cacheEfficiency}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {(() => {
                      const cacheReads = data.totals.cacheReadTokens || 0;
                      const inputTokens = data.totals.inputTokens || 0;
                      const totalInput = inputTokens + cacheReads;
                      const cacheEfficiency = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;
                      return `${cacheEfficiency.toFixed(1)}%`;
                    })()}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-primary">
                      {(() => {
                        const cacheReads = data.totals.cacheReadTokens || 0;
                        const inputTokens = data.totals.inputTokens || 0;
                        const totalInput = inputTokens + cacheReads;
                        const cacheEfficiency = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;
                        return cacheEfficiency > 80 ? t.stats.excellent : cacheEfficiency > 60 ? t.stats.good : cacheEfficiency > 40 ? t.stats.average : t.stats.low;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.read}: <span className="text-sm font-bold">{((data.totals.cacheReadTokens || 0) / 1000000).toFixed(1)}M</span> • {t.stats.write}: <span className="text-sm font-bold">{((data.totals.cacheCreationTokens || 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
                <div>
                  <Zap className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Days Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.stats.activeDays}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {(() => {
                      const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0).length;
                      return activeDays;
                    })()}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Timer className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      {t.stats.activeDays}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0).length;
                      const totalDays = data.daily.length;
                      return (
                        <><span className="text-sm font-bold">{activeDays}</span> {t.stats.activeDaysCount} <span className="text-sm font-bold">{totalDays}</span> {t.stats.activeDaysText}</>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Plan Comparison & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Comparison Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle>{t.plan.title}</CardTitle>
              </div>
              <CardDescription>
                {t.plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const totalCost = data.totals.totalCost;
                const max100Savings = Math.max(0, 100 - totalCost);
                const max200Savings = Math.max(0, 200 - totalCost);
                const currentUtilization100 = Math.min((totalCost / 100) * 100, 100);
                const currentUtilization200 = Math.min((totalCost / 200) * 100, 100);

                const actualPlan = totalCost <= 100 ? 'Max $100' : totalCost <= 200 ? 'Max $200' : 'Over Budget';
                const planStatus = totalCost <= 100 ? 'success' : totalCost <= 200 ? 'warning' : 'danger';

                return (
                  <>
                    {/* Current Status Banner */}
                    <div className={`p-4 rounded-lg border ${planStatus === 'success' ? 'bg-success/10 border-success/20' :
                      planStatus === 'warning' ? 'bg-accent/50 border-accent' :
                        'bg-destructive/10 border-destructive/20'
                      }`}>
                      <div className="flex items-center gap-3">
                        {planStatus === 'success' ? <CheckCircle className="w-5 h-5 text-success" /> :
                          planStatus === 'warning' ? <AlertTriangle className="w-5 h-5 text-accent-foreground" /> :
                            <AlertTriangle className="w-5 h-5 text-destructive" />}
                        <div>
                          <h3 className="font-semibold text-sm">
                            {t.plan.currentStatus}: {actualPlan}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t.plan.totalSpend}: {formatCurrency(totalCost)} - {planStatus === 'success' ? t.plan.withinBudget : planStatus === 'warning' ? t.plan.moderateUsage : t.plan.overBudget}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Current Usage */}
                      <div className="p-4 rounded-lg border bg-primary/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-sm">{t.plan.currentUsage}</h4>
                        </div>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.plan.thisBillingPeriod}
                        </p>
                      </div>

                      {/* Max $100 Plan */}
                      <div className="p-4 rounded-lg border bg-success/10">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-success" />
                          <h4 className="font-semibold text-sm">Max $100</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t.plan.usage}:</span>
                            <span className="text-sm font-medium">{currentUtilization100.toFixed(1)}%</span>
                          </div>
                          <Progress value={currentUtilization100} className="h-2" />
                          <p className={`text-lg font-bold ${max100Savings > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {max100Savings > 0
                              ? `${formatCurrency(max100Savings)} ${t.plan.saving}`
                              : `${formatCurrency(totalCost - 100)} ${t.plan.over}`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Max $200 Plan */}
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4" />
                          <h4 className="font-semibold text-sm">Max $200</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t.plan.usage}:</span>
                            <span className="text-sm font-medium">{currentUtilization200.toFixed(1)}%</span>
                          </div>
                          <Progress value={currentUtilization200} className="h-2" />
                          <p className={`text-lg font-bold ${max200Savings > 0 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                            {max200Savings > 0
                              ? `${formatCurrency(max200Savings)} ${t.plan.saving}`
                              : `${formatCurrency(totalCost - 200)} ${t.plan.over}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Model-based Cost Breakdown */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-semibold">{t.plan.modelCostBreakdown}</h4>
                      </div>

                      {(() => {
                        // Get all unique models used across all days
                        const allModelsUsed = new Set<string>();
                        data.daily.forEach(day => {
                          if (day.modelsUsed) {
                            day.modelsUsed.forEach(model => allModelsUsed.add(model));
                          }
                        });

                        const modelStats: Record<string, {
                          inputTokens: number;
                          outputTokens: number;
                          cacheCreationTokens: number;
                          cacheReadTokens: number;
                          totalCost: number;
                        }> = {};
                        Array.from(allModelsUsed).forEach((modelName: string) => {
                          modelStats[modelName] = {
                            inputTokens: 0,
                            outputTokens: 0,
                            cacheCreationTokens: 0,
                            cacheReadTokens: 0,
                            totalCost: 0
                          };
                        });

                        // Aggregate stats by model
                        data.daily.forEach(day => {
                          if (day.modelBreakdowns) {
                            day.modelBreakdowns.forEach(breakdown => {
                              const model = breakdown.modelName;
                              if (modelStats[model]) {
                                modelStats[model].inputTokens += breakdown.inputTokens || 0;
                                modelStats[model].outputTokens += breakdown.outputTokens || 0;
                                modelStats[model].cacheCreationTokens += breakdown.cacheCreationTokens || 0;
                                modelStats[model].cacheReadTokens += breakdown.cacheReadTokens || 0;
                                modelStats[model].totalCost += breakdown.cost || 0;
                              }
                            });
                          }
                        });

                        const getModelDisplayName = (modelName: string) => {
                          if (modelName.includes('sonnet-4')) return t.models.claudeSonnet4;
                          if (modelName.includes('opus-4')) return t.models.claudeOpus4;
                          if (modelName.includes('haiku')) return t.models.claudeHaiku;
                          return modelName.replace(/claude-|-\d{8}/g, '').replace(/-/g, ' ').toUpperCase();
                        };

                        return Object.entries(modelStats).map(([modelName, stats], index) => (
                          <div key={modelName} className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-3 h-3 bg-chart-${(index % 5) + 1} rounded-full`}></div>
                              <h5 className="font-medium text-sm">{getModelDisplayName(modelName)}</h5>
                              <span className="text-base font-bold text-chart-2">{formatCurrency(stats.totalCost)}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div className="text-center p-2 rounded">
                                <span className="text-xs text-muted-foreground">{t.stats.input}</span>
                                <p className="text-sm font-semibold">{stats.inputTokens.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 rounded">
                                <span className="text-xs text-muted-foreground">{t.stats.output}</span>
                                <p className="text-sm font-semibold">{stats.outputTokens.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 rounded">
                                <span className="text-xs text-muted-foreground">{t.plan.cacheWrite}</span>
                                <p className="text-sm font-semibold">{stats.cacheCreationTokens.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 rounded">
                                <span className="text-xs text-muted-foreground">{t.plan.cacheRead}</span>
                                <p className="text-sm font-semibold">{stats.cacheReadTokens.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{t.plan.totalModelCost}:</span>
                          <span className="font-bold text-lg text-chart-2">{formatCurrency(data.totals.totalCost)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Quick Stats & Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle>{t.keyMetrics.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const totalCost = data.totals.totalCost;
                const avgDailyCost = totalCost / data.daily.length;
                const projectedMonthlyCost = avgDailyCost * 30;
                const cacheEfficiency = ((data.totals.cacheReadTokens / (data.totals.cacheReadTokens + data.totals.inputTokens)) * 100) || 0;

                return (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{t.keyMetrics.avgDailyCost}</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(avgDailyCost)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{t.keyMetrics.projectedMonthly}</p>
                          <p className="text-lg font-bold">{formatCurrency(projectedMonthlyCost)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{t.keyMetrics.costPerMillionTokens}</p>
                          <p className="text-lg font-bold text-magenta">{formatCurrency((totalCost / (data.totals.totalTokens / 1000000)))}</p>
                        </div>
                        <Hash className="w-8 h-8 text-magenta" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">
                            {(() => {
                              const allModelsUsed = new Set<string>();
                              data.daily.forEach(day => {
                                if (day.modelsUsed) {
                                  day.modelsUsed.forEach(model => allModelsUsed.add(model));
                                }
                              });
                              return `${allModelsUsed.size} ${allModelsUsed.size > 1 ? t.keyMetrics.modelsUsed : t.keyMetrics.modelUsed}`;
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const allModelsUsed = new Set<string>();
                              data.daily.forEach(day => {
                                if (day.modelsUsed) {
                                  day.modelsUsed.forEach(model => allModelsUsed.add(model));
                                }
                              });
                              const models = Array.from(allModelsUsed);
                              const primaryModel = models[0] || 'N/A';
                              const displayName = primaryModel.includes('sonnet-4') ? 'Claude Sonnet 4' :
                                primaryModel.includes('opus-4') ? 'Claude Opus 4' :
                                  primaryModel.includes('haiku') ? 'Claude Haiku' :
                                    primaryModel.replace(/claude-|-\d{8}/g, '').replace(/-/g, ' ');
                              return `${t.keyMetrics.primary}: ${displayName}`;
                            })()}
                          </p>
                        </div>
                        <PieChart className="w-8 h-8 text-primary" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{t.keyMetrics.peakUsageDay}</p>
                          <p className="text-lg text-chart-2 font-bold text-chart">
                            {(() => {
                              const peakDay = data.daily.reduce((max, day) =>
                                (day.totalCost || 0) > (max.totalCost || 0) ? day : max,
                                data.daily[0] || { totalCost: 0 }
                              );
                              return formatCurrency(peakDay.totalCost || 0);
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const peakDay = data.daily.reduce((max, day) =>
                                (day.totalCost || 0) > (max.totalCost || 0) ? day : max,
                                data.daily[0] || { totalCost: 0, date: '' }
                              );
                              const date = new Date(peakDay.date);
                              const formattedDate = date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              });
                              const avgCost = totalCost / data.daily.length;
                              const isHigh = (peakDay.totalCost || 0) > avgCost * 2;
                              const status = isHigh ? t.trends.highPeak : t.trends.moderatePeak;
                              return `${status} ${t.trends.date}: ${formattedDate}`;
                            })()}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-chart-2" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{t.keyMetrics.leastUsageDay}</p>
                          <p className="text-lg font-bold">
                            {(() => {
                              const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0);
                              if (activeDays.length === 0) return formatCurrency(0);

                              const leastDay = activeDays.reduce((min, day) =>
                                (day.totalCost || 0) < (min.totalCost || 0) ? day : min,
                                activeDays[0]
                              );
                              return formatCurrency(leastDay.totalCost || 0);
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0);
                              if (activeDays.length === 0) return t.keyMetrics.noData;

                              const leastDay = activeDays.reduce((min, day) =>
                                (day.totalCost || 0) < (min.totalCost || 0) ? day : min,
                                activeDays[0]
                              );
                              const date = new Date(leastDay.date);
                              const formattedDate = date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              });
                              const avgCost = totalCost / activeDays.length;
                              const isLow = (leastDay.totalCost || 0) < avgCost * 0.5;
                              const status = isLow ? t.trends.veryLow : t.trends.low;
                              return `${status} ${t.trends.date}: ${formattedDate}`;
                            })()}
                          </p>
                        </div>
                        <TrendingDown className="w-8 h-8 te" />
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {t.recommendations.title}
                      </h4>
                      <div className="space-y-3">
                        {totalCost < 50 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <p className="text-xs text-success font-medium">
                              {t.recommendations.excellent}
                            </p>
                          </div>
                        )}
                        {totalCost >= 80 && totalCost < 100 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <p className="text-xs text-yellow-700 font-medium">
                              Max $100 {t.recommendations.approachingLimit}
                            </p>
                          </div>
                        )}
                        {cacheEfficiency > 80 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                            <Lightbulb className="w-4 h-4 flex-shrink-0" />
                            <p className="text-xs font-medium">
                              {t.recommendations.excellentCache}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-center">
              <Tabs defaultValue="overview" className="w-full">
                <div className="flex justify-center mb-6">
                  <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full max-w-md gap-1 sm:gap-0 h-auto">
                    <TabsTrigger value="overview" className="w-full justify-center">{t.charts.overview}</TabsTrigger>
                    <TabsTrigger value="tokens" className="w-full justify-center">{t.charts.tokenAnalysis}</TabsTrigger>
                    <TabsTrigger value="trends" className="w-full justify-center">{t.charts.trends}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {timePeriod === 'daily' ? t.charts.dailyCostTrend : timePeriod === 'weekly' ? t.charts.weeklyCostTrend : t.charts.monthlyCostTrend} ({currency})
                        </CardTitle>
                        <CardDescription>
                          {timePeriod === 'daily' ? t.charts.dailyCostAnalysis : timePeriod === 'weekly' ? t.charts.weeklyCostAnalysis : t.charts.monthlyCostAnalysis}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              className="text-xs"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              className="text-xs"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) =>
                                currency === 'INR' ? `₹${value.toLocaleString()}` : `$${value}`
                              }
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-lg border bg-background p-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <span className="text-xs text-muted-foreground">{t.activity.date}:</span>
                                        <span className="text-xs font-medium">{label}</span>
                                        <span className="text-xs text-muted-foreground">{t.activity.cost}:</span>
                                        <span className="text-xs font-medium">
                                          {currency === 'INR'
                                            ? `₹${(payload[0].value as number)?.toLocaleString()}`
                                            : `$${(payload[0].value as number)?.toFixed(2)}`}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="cost"
                              stroke="var(--chart-1)"
                              fillOpacity={1}
                              fill="url(#costGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {timePeriod === 'daily' ? t.charts.dailyTokenUsage : timePeriod === 'weekly' ? t.charts.weeklyTokenUsage : t.charts.monthlyTokenUsage}
                        </CardTitle>
                        <CardDescription>
                          {timePeriod === 'daily' ? t.charts.dailyTokenConsumption : timePeriod === 'weekly' ? t.charts.weeklyTokenConsumption : t.charts.monthlyTokenConsumption}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              className="text-xs"
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              className="text-xs"
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${value}M`}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="rounded-lg border bg-background p-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <span className="text-xs text-muted-foreground">{t.activity.date}:</span>
                                        <span className="text-xs font-medium">{label}</span>
                                        <span className="text-xs text-muted-foreground">{t.activity.tokens}:</span>
                                        <span className="text-xs font-medium">
                                          {(payload[0].value as number)?.toFixed(1)}M
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar
                              dataKey="tokens"
                              fill="var(--chart-2)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Overview Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      // Calculate insights from data
                      const totalTokens = data.totals.totalTokens || 0;
                      const totalCost = data.totals.totalCost || 0;
                      const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0).length;

                      // Calculate efficiency metrics
                      const cacheReads = data.totals.cacheReadTokens || 0;
                      const inputTokens = data.totals.inputTokens || 0;
                      const totalInput = inputTokens + cacheReads;
                      const cacheRatio = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;

                      return (
                        <>
                          {/* Efficiency Score */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {t.insights.costEfficiency}
                                </p>
                                <p className="text-2xl font-bold text-success">
                                  {(() => {
                                    const costPerMToken = totalTokens > 0 ? totalCost / (totalTokens / 1000000) : 0;
                                    const efficiencyScore = Math.max(0, Math.min(100, 100 - (costPerMToken * 10)));
                                    return `${efficiencyScore.toFixed(0)}/100`;
                                  })()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t.keyMetrics.basedOnRecentActivity}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Usage Pattern */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {t.insights.usagePattern}
                                </p>
                                <p className="text-2xl font-bold text-primary">
                                  {(() => {
                                    const consistencyRatio = activeDays / data.daily.length;
                                    return consistencyRatio > 0.8 ? t.patterns.regular :
                                      consistencyRatio > 0.5 ? t.patterns.moderate :
                                        t.patterns.sporadic;
                                  })()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {activeDays} {t.stats.activeDaysText}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Cache Optimization */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {t.insights.cacheOptimization}
                                </p>
                                <p className={`text-2xl font-bold ${cacheRatio > 30 ? 'text-success' : cacheRatio > 15 ? 'text-chart-1' : 'text-muted-foreground'}`}>
                                  {cacheRatio.toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t.trends.cacheUsageRate}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                </TabsContent>

                <TabsContent value="tokens" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.charts.tokenBreakdownAnalysis}</CardTitle>
                      <CardDescription>{t.charts.detailedTokenUsage}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" tickFormatter={(value) => `${value}M`} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2">
                                    <p className="text-xs font-medium mb-2">{label}</p>
                                    {payload.map((entry, index) => (
                                      <div key={index} className="grid grid-cols-2 gap-2">
                                        <span className="text-xs text-muted-foreground">{entry.name}:</span>
                                        <span className="text-xs font-medium">
                                          {(entry.value as number)?.toFixed(1)}M
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="inputTokens"
                            stackId="1"
                            stroke="var(--chart-1)"
                            fill="var(--chart-1)"
                            fillOpacity={0.6}
                            name={t.charts.inputTokens}
                          />
                          <Area
                            type="monotone"
                            dataKey="outputTokens"
                            stackId="1"
                            stroke="var(--chart-2)"
                            fill="var(--chart-2)"
                            fillOpacity={0.6}
                            name={t.charts.outputTokens}
                          />
                          <Area
                            type="monotone"
                            dataKey="cacheTokens"
                            stackId="1"
                            stroke="var(--chart-3)"
                            fill="var(--chart-3)"
                            fillOpacity={0.6}
                            name={t.charts.cacheTokens}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.charts.usageTrendsInsights}</CardTitle>
                      <CardDescription>{t.charts.performanceMetrics}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(() => {
                        // Calculate real metrics from data
                        const totalTokens = data.totals.totalTokens || 0;
                        const totalCost = data.totals.totalCost || 0;
                        const cacheReads = data.totals.cacheReadTokens || 0;
                        const totalInput = (data.totals.inputTokens || 0) + cacheReads;

                        // Cost efficiency (lower cost per token is better)
                        const costPerToken = totalTokens > 0 ? totalCost / (totalTokens / 1000000) : 0;
                        const costEfficiency = Math.max(0, Math.min(100, 100 - (costPerToken * 5))); // Scale to 0-100%

                        // Cache hit rate
                        const cacheHitRate = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;

                        // Token utilization based on active vs inactive days
                        const activeDays = data.daily.filter(day => (day.totalCost || 0) > 0).length;
                        const totalDays = data.daily.length;
                        const tokenUtilization = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;

                        // Calculate dynamic growth for projections based on time period
                        let currentPeriodCost = 0;
                        let previousPeriodCost = 0;
                        let growthLabel = '';
                        let comparisonLabel = '';

                        if (timePeriod === 'daily') {
                          currentPeriodCost = data.daily[data.daily.length - 1]?.totalCost || 0;
                          previousPeriodCost = data.daily[data.daily.length - 2]?.totalCost || 0;
                          growthLabel = t.trends.daily;
                          comparisonLabel = t.trends.comparedToYesterday;
                        } else if (timePeriod === 'weekly') {
                          const processedData = aggregateDataByWeek(data.daily);
                          if (processedData.length >= 2) {
                            const recent = processedData[processedData.length - 1];
                            const previous = processedData[processedData.length - 2];
                            currentPeriodCost = recent.totalCost;
                            previousPeriodCost = previous.totalCost;
                          }
                          growthLabel = t.trends.weekly;
                          comparisonLabel = t.trends.comparedToLastWeek;
                        } else if (timePeriod === 'monthly') {
                          const processedData = aggregateDataByMonth(data.daily);
                          if (processedData.length >= 2) {
                            const recent = processedData[processedData.length - 1];
                            const previous = processedData[processedData.length - 2];
                            currentPeriodCost = recent.totalCost;
                            previousPeriodCost = previous.totalCost;
                          }
                          growthLabel = t.trends.monthly;
                          comparisonLabel = t.trends.comparedToLastMonth;
                        }

                        const growthRate = previousPeriodCost > 0 ? ((currentPeriodCost - previousPeriodCost) / previousPeriodCost) * 100 : 0;

                        return (
                          <>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{t.trends.costEfficiency}</span>
                                  <span className="font-medium">{costEfficiency.toFixed(0)}%</span>
                                </div>
                                <Progress value={costEfficiency} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {t.trends.costPerToken.replace('{cost}', formatCurrency(costPerToken))}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{t.trends.usageRate}</span>
                                  <span className="font-medium">{tokenUtilization.toFixed(0)}%</span>
                                </div>
                                <Progress value={tokenUtilization} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {t.trends.activeDaysPattern
                                    .replace('{active}', activeDays.toString())
                                    .replace('{total}', totalDays.toString())
                                  }
                                </p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{t.trends.cacheHitRate}</span>
                                  <span className="font-medium">{cacheHitRate.toFixed(0)}%</span>
                                </div>
                                <Progress value={cacheHitRate} className="h-2" />
                                <p className="text-xs text-muted-foreground">
                                  {((cacheReads) / 1000000).toFixed(1)}M {t.trends.cacheReads}
                                </p>
                              </div>
                            </div>

                            {/* Future Projections */}
                            <div className="border-t pt-6">
                              <h4 className="font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                {t.insights.futureProjections}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg border bg-card/50">
                                  <p className="text-sm font-medium">
                                    {t.insights.monthlyProjection}
                                  </p>
                                  <p className="text-lg font-bold text-primary">
                                    {(() => {
                                      const totalCost = data.totals.totalCost;
                                      const avgDailyCost = totalCost / data.daily.length;
                                      const projectedMonthlyCost = avgDailyCost * 30;
                                      return formatCurrency(projectedMonthlyCost);
                                    })()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.insights.basedOnRecentActivity}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg border bg-card/50">
                                  <p className="text-sm font-medium">
                                    {growthLabel}
                                  </p>
                                  <p className={`text-lg font-bold ${growthRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {comparisonLabel}
                                  </p>
                                </div>
                              </div>

                              {/* Insights & Recommendations */}
                              <div className="mt-4 space-y-3">
                                {cacheHitRate < 50 && (
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <p className="text-xs text-blue-700 font-medium">
                                      {t.insights.increaseCacheUsage}
                                    </p>
                                  </div>
                                )}
                                {growthRate > 50 && (
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                    <p className="text-xs text-destructive font-medium">
                                      {t.insights.usageGrowingRapidly}
                                    </p>
                                  </div>
                                )}
                                {costEfficiency > 80 && (
                                  <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                    <p className="text-xs text-success font-medium">
                                      {t.insights.excellentCostEfficiency}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </CardHeader>
        </Card>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>
                  {timePeriod === 'daily' ? t.activity.dailyActivityDetails : timePeriod === 'weekly' ? t.activity.weeklyActivityDetails : t.activity.monthlyActivityDetails}
                </CardTitle>
                <CardDescription>
                  {timePeriod === 'daily' ? t.activity.dailyUsageData : timePeriod === 'weekly' ? t.activity.weeklyUsageData : t.activity.monthlyUsageData}
                </CardDescription>
              </div>

              {/* Currency Filter & Pagination */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="bg-muted/30 rounded-lg border flex items-center w-16 sm:w-36 relative">
                  {/* Mobile input - icon only */}
                  <input
                    type="number"
                    value={minCostFilter}
                    onChange={(e) => setMinCostFilter(e.target.value)}
                    placeholder={currency === 'INR' ? '₹' : '$'}
                    className="w-full h-11 px-2 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-lg sm:hidden"
                    step="0.01"
                  />
                  {/* Desktop input - full text */}
                  <input
                    type="number"
                    value={minCostFilter}
                    onChange={(e) => setMinCostFilter(e.target.value)}
                    placeholder={currency === 'INR'
                      ? `₹ ${t.activity.minAmount}`
                      : `$ ${t.activity.minAmount}`
                    }
                    className="w-full h-11 px-3 py-2 text-sm border-0 bg-transparent focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-lg hidden sm:block"
                    step="0.01"
                  />
                  {minCostFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMinCostFilter('')}
                      className="h-6 w-6 p-0 hover:bg-muted rounded-full mr-1 sm:mr-2 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {/* Pagination Controls - Mobile-Friendly */}
                <div className="bg-muted/30 rounded-lg border flex flex-shrink-0 overflow-hidden">
                  <button
                    onClick={() => {
                      setItemsPerPage(10);
                      setCurrentPage(1);
                    }}
                    className={`px-4 sm:px-6 py-3 h-11 min-w-[44px] text-sm font-medium border-r transition-colors flex items-center justify-center ${itemsPerPage === 10
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                      }`}
                  >
                    10
                  </button>
                  <button
                    onClick={() => {
                      setItemsPerPage(50);
                      setCurrentPage(1);
                    }}
                    className={`px-4 sm:px-6 py-3 h-11 min-w-[44px] text-sm font-medium border-r transition-colors flex items-center justify-center ${itemsPerPage === 50
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                      }`}
                  >
                    50
                  </button>
                  <button
                    onClick={() => {
                      setItemsPerPage(100);
                      setCurrentPage(1);
                    }}
                    className={`px-4 sm:px-6 py-3 h-11 min-w-[44px] text-sm font-medium transition-colors flex items-center justify-center ${itemsPerPage === 100
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70'
                      }`}
                  >
                    100
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t.activity.date}
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('totalCost')}
                    >
                      <div className="flex items-center gap-1">
                        {currency === 'INR' ? (
                          <IndianRupee className="w-3 h-3 text-success" />
                        ) : (
                          <DollarSign className="w-3 h-3 text-success" />
                        )}
                        <span className="text-success font-semibold">{t.activity.cost}</span>
                        <SortIcon field="totalCost" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('inputTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-medium">{t.stats.input}</span>
                        <SortIcon field="inputTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('outputTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span className="font-medium">{t.stats.output}</span>
                        <SortIcon field="outputTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('cacheCreationTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span className="font-medium">{t.plan.cacheWrite}</span>
                        <SortIcon field="cacheCreationTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('cacheReadTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span className="font-medium">{t.plan.cacheRead}</span>
                        <SortIcon field="cacheReadTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('totalTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span className="font-medium">{t.activity.tokens}</span>
                        <SortIcon field="totalTokens" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let dataToShow = [];
                    if (timePeriod === 'daily' && data.daily) {
                      dataToShow = data.daily; // Get all data first
                    } else if (timePeriod === 'weekly' && data.daily) {
                      const weeklyData = aggregateDataByWeek(data.daily);
                      dataToShow = weeklyData;
                    } else if (timePeriod === 'monthly' && data.daily) {
                      const monthlyData = aggregateDataByMonth(data.daily);
                      dataToShow = monthlyData;
                    }

                    // Apply sorting
                    const sortedData = getSortedData(dataToShow);

                    // Apply filters
                    const filteredData = sortedData.filter(item => {
                      const costFilter = minCostFilter === '' || (item.totalCost || 0) >= parseFloat(minCostFilter || '0');
                      return costFilter;
                    });

                    // Calculate pagination
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = startIndex + itemsPerPage;
                    const paginatedData = filteredData.slice(startIndex, endIndex);

                    return (
                      <>
                        {paginatedData.map((item, index) => (
                          <tr key={item.date || index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-2 text-xs">
                              <div className="flex items-center gap-1">
                                {timePeriod === 'daily'
                                  ? new Date(item.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US')
                                  : timePeriod === 'weekly'
                                    ? (() => {
                                      const startDate = new Date(item.date);
                                      const endDate = new Date(startDate);
                                      endDate.setDate(startDate.getDate() + 6);
                                      return `${startDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' })}`;
                                    })()
                                    : new Date(item.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long' })
                                }
                              </div>
                            </td>
                            <td className="py-3 px-2 text-sm font-semibold">
                              <span className="text-success font-bold">
                                {formatCurrency(item.totalCost, item.date)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs">
                              <span className="font-medium">
                                {item.inputTokens.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs">
                              <span className="font-medium">
                                {item.outputTokens.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs">
                              <span className="font-medium">
                                {item.cacheCreationTokens.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs">
                              <span className="font-medium">
                                {item.cacheReadTokens.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-sm">
                              <span className="font-semibold">
                                {item.totalTokens.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {paginatedData.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              {t.activity.noDataAvailable}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              let dataToShow = [];
              if (timePeriod === 'daily' && data.daily) {
                dataToShow = data.daily;
              } else if (timePeriod === 'weekly' && data.daily) {
                const weeklyData = aggregateDataByWeek(data.daily);
                dataToShow = weeklyData;
              } else if (timePeriod === 'monthly' && data.daily) {
                const monthlyData = aggregateDataByMonth(data.daily);
                dataToShow = monthlyData;
              }

              const sortedData = getSortedData(dataToShow);
              const filteredData = sortedData.filter(item => {
                const costFilter = minCostFilter === '' || (item.totalCost || 0) >= parseFloat(minCostFilter || '0');
                return costFilter;
              });

              const totalItems = filteredData.length;
              const totalPages = Math.ceil(totalItems / itemsPerPage);
              const startItem = (currentPage - 1) * itemsPerPage + 1;
              const endItem = Math.min(currentPage * itemsPerPage, totalItems);

              if (totalPages <= 1) return null;

              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t.activity.showingEntriesPattern
                      .replace('{start}', startItem.toString())
                      .replace('{end}', endItem.toString())
                      .replace('{total}', totalItems.toString())
                    }
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      {t.activity.first}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                    </Button>

                    <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded">
                      {currentPage} / {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronUp className="w-4 h-4 rotate-90" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      {t.activity.last}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          aria-label={t.activity.scrollToTop}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}