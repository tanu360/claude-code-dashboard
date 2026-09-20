'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import type { UsageResponse, Currency, DailyUsage, TimePeriod } from '@/types/usage';
import { useTranslations, type Locale } from '@/locales';
import { useTheme } from '@/components/theme-provider';
import { addDays, aggregateRows, emptyTotals, periodKey, sumRows } from '@/lib/usage';

type ModelStats = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  totalTokens: number;
};

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<UsageResponse | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('daily');
  const [error, setError] = useState<string | null>(null);
  const manualRate = useRef(false);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [ratesLoading, setRatesLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(0);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [inputRate, setInputRate] = useState<string>('');
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

      setError(null);
      setCurrentPage(1);
      try {
        const rateResponse = await fetch('/api/exchange-rate', { headers });
        if (!rateResponse.ok) throw new Error('Exchange rate unavailable');
        const rateData = await rateResponse.json();
        if (!Number.isFinite(rateData.rate) || rateData.rate <= 0) throw new Error('Invalid exchange rate');
        if (!manualRate.current) {
          setCurrentRate(rateData.rate);
          setInputRate(String(rateData.rate));
          setRateDate(rateData.date);
        }
      } catch {
        if (!manualRate.current) setRateDate(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Usage refresh failed. Previously loaded data may be out of date.');
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
  }, [minCostFilter, timePeriod, sortField, sortOrder, currency, currentRate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const formatCurrency = (amount: number) => {
    if (!Number.isFinite(amount)) return 'N/A';
    if (currency === 'INR') {
      if (!currentRate) return 'N/A';
      return `₹${(amount * currentRate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const matchesCostFilter = (item: DailyUsage) => minCostFilter === '' ||
    item.totalCost * (currency === 'INR' ? currentRate : 1) >= Number(minCostFilter);

  const displayDate = (key: string) => new Date(`${key}T00:00:00`);

  const formatTokenCount = (count: number): string => {
    if (count < 1000) {
      return count.toLocaleString();
    } else if (count < 1000000) {
      return `${(count / 1000).toFixed(2)}K`;
    } else {
      return `${(count / 1000000).toFixed(2)}M`;
    }
  };

  const handleRateChange = () => {
    const newRate = parseFloat(inputRate);
    if (Number.isFinite(newRate) && newRate > 0) {
      setCurrentRate(newRate);
      manualRate.current = true;
      setRateDate('Manual');
      setCurrency('INR');
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

  const aggregateDataByWeek = (rows: DailyUsage[]) => aggregateRows(rows, 'weekly');
  const aggregateDataByMonth = (rows: DailyUsage[]) => aggregateRows(rows, 'monthly');
  const getEmptyTotals = emptyTotals;
  const sumUsageRows = sumRows;
  const addDaysToDateKey = addDays;

  const getPeriodData = (period: TimePeriod): DailyUsage[] => {
    if (!data) return [];

    if (period === 'weekly') {
      return data.weekly?.length ? data.weekly : aggregateDataByWeek(data.daily);
    }

    if (period === 'monthly') {
      return data.monthly?.length ? data.monthly : aggregateDataByMonth(data.daily);
    }

    return data.daily;
  };

  const getDailyRowsForPeriod = (
    period: TimePeriod,
    currentPeriodUsage: DailyUsage | null,
    dailyRows: DailyUsage[]
  ) => {
    if (period === 'all') return dailyRows;
    if (!currentPeriodUsage) return [];

    if (period === 'daily') {
      return dailyRows.filter(day => day.date === currentPeriodUsage.date);
    }

    if (period === 'weekly') {
      const weekEnd = addDaysToDateKey(currentPeriodUsage.date, 6);
      return dailyRows.filter(day => day.date >= currentPeriodUsage.date && day.date <= weekEnd);
    }

    const monthKey = currentPeriodUsage.date.slice(0, 7);
    return dailyRows.filter(day => day.date.startsWith(monthKey));
  };

  const formatModelDisplayName = (modelName: string) => modelName;

  const getTopModelStats = (rows: DailyUsage[]) => {
    const modelStats: Record<string, ModelStats> = Object.create(null);

    rows.forEach(day => {
      day.modelBreakdowns?.forEach(breakdown => {
        const modelName = breakdown.modelName || '';


        if (!modelStats[modelName]) {
          modelStats[modelName] = {
            inputTokens: 0,
            outputTokens: 0,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
            totalCost: 0,
            totalTokens: 0,
          };
        }

        modelStats[modelName].inputTokens += breakdown.inputTokens || 0;
        modelStats[modelName].outputTokens += breakdown.outputTokens || 0;
        modelStats[modelName].cacheCreationTokens += breakdown.cacheCreationTokens || 0;
        modelStats[modelName].cacheReadTokens += breakdown.cacheReadTokens || 0;
        modelStats[modelName].totalCost += breakdown.cost || 0;
        modelStats[modelName].totalTokens +=
          (breakdown.inputTokens || 0) +
          (breakdown.outputTokens || 0) +
          (breakdown.cacheCreationTokens || 0) +
          (breakdown.cacheReadTokens || 0);
      });
    });

    return Object.entries(modelStats)
      .sort(([, a], [, b]) => b.totalCost - a.totalCost || b.totalTokens - a.totalTokens);
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
        return aValue === bValue ? 0 : aValue > bValue ? 1 : -1;
      } else {
        return aValue === bValue ? 0 : aValue < bValue ? 1 : -1;
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

    const processedData = getPeriodData(timePeriod);

    return processedData
      .slice()
      .map(item => {
        const date = displayDate(item.date);
        let dateLabel = '';

        if (timePeriod === 'daily' || timePeriod === 'all') {
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
          tokens: item.totalTokens,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens,
          cacheTokens: (item.cacheCreationTokens + item.cacheReadTokens),
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

  const selectedPeriodData = getPeriodData(timePeriod);
  const today = data.asOf || new Intl.DateTimeFormat('en-CA').format(new Date());
  const currentKey = timePeriod === 'all' ? today : periodKey(today, timePeriod);
  const previousKey = timePeriod === 'all' ? today : timePeriod === 'daily' ? addDays(currentKey, -1)
    : timePeriod === 'weekly' ? addDays(currentKey, -7) : periodKey(addDays(currentKey, -1), 'monthly');
  const currentPeriodUsage = timePeriod === 'all' ? null : selectedPeriodData.find(row => row.date === currentKey) || { date: currentKey, ...emptyTotals() };
  const previousPeriodUsage = timePeriod === 'all' ? null : selectedPeriodData.find(row => row.date === previousKey) || null;
  const selectedTotals = timePeriod === 'all'
    ? data.totals
    : currentPeriodUsage
      ? sumUsageRows([currentPeriodUsage])
      : getEmptyTotals();
  const selectedDailyRows = getDailyRowsForPeriod(timePeriod, currentPeriodUsage, data.daily);
  const selectedActiveDays = selectedDailyRows.filter(day => day.totalTokens > 0 || day.totalCost > 0).length;
  const selectedTotalDays = timePeriod === 'all'
    ? (data.daily.length ? Math.max(1, Math.round((Date.parse(today) - Date.parse(data.daily[0].date)) / 86400000) + 1) : 0)
    : Math.round((Date.parse(today) - Date.parse(currentKey)) / 86400000) + 1;
  const selectedAverageCost = selectedTotalDays > 0 ? selectedTotals.totalCost / selectedTotalDays : 0;
  const selectedModelRows = timePeriod === 'all'
    ? data.daily
    : currentPeriodUsage
      ? [currentPeriodUsage]
      : [];
  const topModelStats = getTopModelStats(selectedModelRows);
  const selectedPeriodLabel = timePeriod === 'all' ? t.timePeriod.all : t.timePeriod[timePeriod];
  const growthLabel = timePeriod === 'daily'
    ? t.stats.fromYesterday
    : timePeriod === 'weekly'
      ? t.stats.fromLastWeek
      : timePeriod === 'monthly'
        ? t.stats.fromLastMonth
        : t.stats.allTime;
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
                  <Button
                    variant={timePeriod === 'all' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('all')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {t.timePeriod.all}
                  </Button>
                </div>
              </div>

              {(currency === 'INR' || isEditingRate) && (
                <div className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1 bg-background">
                  {!isEditingRate ? (
                    <>
                      <span className="text-muted-foreground">1 USD =</span>
                      <span className="font-medium">{currentRate ? `₹${currentRate.toFixed(2)}` : 'Rate unavailable'}</span>
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
                  onClick={() => { if (currency === 'USD' && !currentRate) setIsEditingRate(true); else setCurrency(currency === 'USD' ? 'INR' : 'USD'); }}
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
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(selectedTotals.totalCost)}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {(() => {
                      if (timePeriod === 'all') {
                        return (
                          <>
                            <Info className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{t.stats.allTime}</span>
                          </>
                        );
                      }

                      if (!previousPeriodUsage) {
                        return (
                          <>
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {t.stats.insufficientData}
                            </span>
                          </>
                        );
                      }

                      const previousTotal = previousPeriodUsage.totalCost || 0;
                      if (previousTotal === 0) {
                        return (
                          <>
                            <TrendingUp className="w-3 h-3 text-success" />
                            <span className="text-success">{t.stats.newUsage}</span>
                          </>
                        );
                      }

                      const growth = ((selectedTotals.totalCost - previousTotal) / previousTotal) * 100;
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
                            {growthLabel}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.periodAvg}: <span className="text-sm font-bold text-success">{formatCurrency(selectedAverageCost)}</span>
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
                  <p className="text-3xl font-bold tracking-tight">{formatTokenCount(selectedTotals.totalTokens)}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Cpu className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      {t.stats.processingPower}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.input}: <span className="text-sm font-bold">{formatTokenCount(selectedTotals.inputTokens || 0)}</span> • {t.stats.output}: <span className="text-sm font-bold">{formatTokenCount(selectedTotals.outputTokens || 0)}</span>
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
                      const cacheReads = selectedTotals.cacheReadTokens || 0;
                      const inputTokens = selectedTotals.inputTokens || 0;
                      const totalInput = inputTokens + cacheReads + selectedTotals.cacheCreationTokens;
                      const cacheEfficiency = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;
                      return `${cacheEfficiency.toFixed(1)}%`;
                    })()}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-primary">
                      {(() => {
                        const cacheReads = selectedTotals.cacheReadTokens || 0;
                        const inputTokens = selectedTotals.inputTokens || 0;
                        const totalInput = inputTokens + cacheReads + selectedTotals.cacheCreationTokens;
                        const cacheEfficiency = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;
                        return cacheEfficiency > 80 ? t.stats.excellent : cacheEfficiency > 60 ? t.stats.good : cacheEfficiency > 40 ? t.stats.average : t.stats.low;
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.stats.read}: <span className="text-sm font-bold">{formatTokenCount(selectedTotals.cacheReadTokens || 0)}</span> • {t.stats.write}: <span className="text-sm font-bold">{formatTokenCount(selectedTotals.cacheCreationTokens || 0)}</span>
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
                    {selectedActiveDays}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Timer className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      {selectedPeriodLabel}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-sm font-bold">{selectedActiveDays}</span> {t.stats.activeDaysCount} <span className="text-sm font-bold">{selectedTotalDays}</span> {t.stats.activeDaysText}
                  </div>
                </div>
                <div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm text-muted-foreground" role="status">
          {data.source || 'Claude Code local logs'} · {data.timezone} · {today}.
          {' '}Costs are API estimates, not subscription charges or limits.
          {' '}INR rate: {rateDate || (currentRate ? 'previously loaded; refresh unavailable' : 'unavailable; enter a manual rate')}.
          {!!data.unpricedModels?.length && ` Pricing unavailable for: ${data.unpricedModels.join(', ')}. Cost totals exclude unpriced usage.`}
          {error && ` ${error}`}
        </p>

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
                // Calculate current month's cost (billing is monthly)
                const now = displayDate(today);
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const monthlyCost = data.daily
                  .filter(day => {
                    const dayDate = displayDate(day.date);
                    return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear;
                  })
                  .reduce((sum, day) => sum + (day.totalCost || 0), 0);

                const max100Savings = Math.max(0, 100 - monthlyCost);
                const max200Savings = Math.max(0, 200 - monthlyCost);
                const currentUtilization100 = (monthlyCost / 100) * 100;
                const currentUtilization200 = (monthlyCost / 200) * 100;

                const actualPlan = monthlyCost <= 100 ? '$100 reference' : monthlyCost <= 200 ? '$200 reference' : 'Above $200 reference';
                const planStatus = monthlyCost <= 100 ? 'success' : monthlyCost <= 200 ? 'warning' : 'danger';

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
                            {t.plan.totalSpend}: {formatCurrency(monthlyCost)} - {planStatus === 'success' ? t.plan.withinBudget : planStatus === 'warning' ? t.plan.moderateUsage : t.plan.overBudget}
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
                        <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyCost)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.plan.thisBillingPeriod}
                        </p>
                      </div>

                      {/* $100 reference Plan */}
                      <div className="p-4 rounded-lg border bg-success/10">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-success" />
                          <h4 className="font-semibold text-sm">$100 reference</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t.plan.usage}:</span>
                            <span className="text-sm font-medium">{currentUtilization100.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(currentUtilization100, 100)} className="h-2" />
                          <p className={`text-lg font-bold ${max100Savings > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {max100Savings > 0
                              ? `${formatCurrency(max100Savings)} ${t.plan.saving}`
                              : `${formatCurrency(monthlyCost - 100)} ${t.plan.over}`
                            }
                          </p>
                        </div>
                      </div>

                      {/* $200 reference Plan */}
                      <div className="p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4" />
                          <h4 className="font-semibold text-sm">$200 reference</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{t.plan.usage}:</span>
                            <span className="text-sm font-medium">{currentUtilization200.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(currentUtilization200, 100)} className="h-2" />
                          <p className={`text-lg font-bold ${max200Savings > 0 ? 'text-chart-2' : 'text-muted-foreground'}`}>
                            {max200Savings > 0
                              ? `${formatCurrency(max200Savings)} ${t.plan.saving}`
                              : `${formatCurrency(monthlyCost - 200)} ${t.plan.over}`
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
                        if (topModelStats.length === 0) {
                          return (
                            <p className="text-sm text-muted-foreground">
                              {t.activity.noDataAvailable}
                            </p>
                          );
                        }

                        return topModelStats.map(([modelName, stats], index) => (
                          <div key={modelName} className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-3 h-3 bg-chart-${(index % 5) + 1} rounded-full`}></div>
                              <h5 className="font-medium text-sm">{formatModelDisplayName(modelName)}</h5>
                              <span className="text-base font-bold text-chart-2">{data.unpricedModels?.includes(modelName) ? 'Pricing unavailable' : formatCurrency(stats.totalCost)}</span>
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
                          <span className="font-bold text-lg text-chart-2">{formatCurrency(selectedTotals.totalCost)}</span>
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
                // Calculate current month's cost for accurate metrics
                const now = displayDate(today);
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const currentMonthDays = data.daily.filter(day => {
                  const dayDate = displayDate(day.date);
                  return dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear;
                });
                const currentMonthCost = currentMonthDays.reduce((sum, day) => sum + (day.totalCost || 0), 0);
                const daysInMonth = now.getDate();
                const avgDailyCost = currentMonthCost / daysInMonth;
                const daysRemaining = new Date(currentYear, currentMonth + 1, 0).getDate() - now.getDate();
                const projectedMonthlyCost = currentMonthCost + (avgDailyCost * daysRemaining);
                const cacheEfficiency = ((selectedTotals.cacheReadTokens / (selectedTotals.cacheReadTokens + selectedTotals.inputTokens + selectedTotals.cacheCreationTokens)) * 100) || 0;

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
                          <p className="text-lg font-bold text-magenta">{formatCurrency(selectedTotals.totalTokens > 0 ? selectedTotals.totalCost / (selectedTotals.totalTokens / 1000000) : 0)}</p>
                        </div>
                        <Hash className="w-8 h-8 text-magenta" />
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">
                            {topModelStats.length} {topModelStats.length !== 1 ? t.keyMetrics.modelsUsed : t.keyMetrics.modelUsed}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const primaryModel = topModelStats[0]?.[0] || 'N/A';
                              return `${t.keyMetrics.primary}: ${formatModelDisplayName(primaryModel)}`;
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
                              const peakDay = selectedDailyRows.reduce((max, day) =>
                                (day.totalCost || 0) > (max.totalCost || 0) ? day : max,
                                selectedDailyRows[0] || { totalCost: 0 }
                              );
                              return formatCurrency(peakDay.totalCost || 0);
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const peakDay = selectedDailyRows.reduce((max, day) =>
                                (day.totalCost || 0) > (max.totalCost || 0) ? day : max,
                                selectedDailyRows[0] || { totalCost: 0, date: '' }
                              );
                              if (!peakDay.date) return t.keyMetrics.noData;
                              const date = displayDate(peakDay.date);
                              const formattedDate = date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              });
                              const avgCost = selectedAverageCost;
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
                              const activeDays = selectedDailyRows.filter(day => day.totalCost > 0);
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
                              const activeDays = selectedDailyRows.filter(day => day.totalCost > 0);
                              if (activeDays.length === 0) return t.keyMetrics.noData;

                              const leastDay = activeDays.reduce((min, day) =>
                                (day.totalCost || 0) < (min.totalCost || 0) ? day : min,
                                activeDays[0]
                              );
                              const date = displayDate(leastDay.date);
                              const formattedDate = date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              });
                              const avgCostForComparison = selectedAverageCost;
                              const isLow = (leastDay.totalCost || 0) < avgCostForComparison * 0.5;
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
                        {currentMonthCost < 50 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            <p className="text-xs text-success font-medium">
                              {t.recommendations.excellent}
                            </p>
                          </div>
                        )}
                        {currentMonthCost >= 80 && currentMonthCost < 100 && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <p className="text-xs text-yellow-700 font-medium">
                              $100 reference {t.recommendations.approachingLimit}
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
                          {timePeriod === 'daily' ? t.charts.dailyCostTrend : timePeriod === 'weekly' ? t.charts.weeklyCostTrend : timePeriod === 'monthly' ? t.charts.monthlyCostTrend : t.charts.allCostTrend} ({currency})
                        </CardTitle>
                        <CardDescription>
                          {timePeriod === 'daily' ? t.charts.dailyCostAnalysis : timePeriod === 'weekly' ? t.charts.weeklyCostAnalysis : timePeriod === 'monthly' ? t.charts.monthlyCostAnalysis : t.charts.allCostAnalysis}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={chartData}
                            margin={{ right: 20 }}>
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
                              width={80}
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
                          {timePeriod === 'daily' ? t.charts.dailyTokenUsage : timePeriod === 'weekly' ? t.charts.weeklyTokenUsage : timePeriod === 'monthly' ? t.charts.monthlyTokenUsage : t.charts.allTokenUsage}
                        </CardTitle>
                        <CardDescription>
                          {timePeriod === 'daily' ? t.charts.dailyTokenConsumption : timePeriod === 'weekly' ? t.charts.weeklyTokenConsumption : timePeriod === 'monthly' ? t.charts.monthlyTokenConsumption : t.charts.allTokenConsumption}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={chartData}
                            margin={{ right: 20 }}>
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
                              width={80}
                              tickFormatter={(value) => `${value}`}
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
                                          {(payload[0].value as number)?.toLocaleString()}
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
                      const totalTokens = selectedTotals.totalTokens;
                      const totalCost = selectedTotals.totalCost;
                      const activeDays = selectedActiveDays;

                      // Calculate efficiency metrics
                      const cacheReads = selectedTotals.cacheReadTokens;
                      const inputTokens = selectedTotals.inputTokens;
                      const totalInput = inputTokens + cacheReads + selectedTotals.cacheCreationTokens;
                      const cacheRatio = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;

                      return (
                        <>
                          {/* Efficiency Score */}
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {t.keyMetrics.costPerMillionTokens}
                                </p>
                                <p className="text-2xl font-bold text-success">
                                  {(() => {
                                    const costPerMToken = totalTokens > 0 ? totalCost / (totalTokens / 1000000) : 0;
                                    return formatCurrency(costPerMToken);
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
                                    const consistencyRatio = selectedTotalDays ? activeDays / selectedTotalDays : 0;
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
                                          {(entry.value as number)?.toLocaleString()}
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
                            stroke="var(--chart-4)"
                            fill="var(--chart-4)"
                            fillOpacity={0.6}
                            name={t.charts.inputTokens}
                          />
                          <Area
                            type="monotone"
                            dataKey="outputTokens"
                            stackId="1"
                            stroke="var(--chart-3)"
                            fill="var(--chart-3)"
                            fillOpacity={0.6}
                            name={t.charts.outputTokens}
                          />
                          <Area
                            type="monotone"
                            dataKey="cacheTokens"
                            stackId="1"
                            stroke="var(--chart-2)"
                            fill="var(--chart-2)"
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
                        // Calculate real metrics from the selected period
                        const totalTokens = selectedTotals.totalTokens || 0;
                        const totalCost = selectedTotals.totalCost || 0;
                        const cacheReads = selectedTotals.cacheReadTokens || 0;
                        const totalInput = selectedTotals.inputTokens + cacheReads + selectedTotals.cacheCreationTokens;

                        // Cost efficiency (lower cost per token is better)
                        const costPerToken = totalTokens > 0 ? totalCost / (totalTokens / 1000000) : 0;

                        // Cache hit rate
                        const cacheHitRate = totalInput > 0 ? (cacheReads / totalInput) * 100 : 0;

                        // Token utilization based on active vs inactive days
                        const activeDays = selectedActiveDays;
                        const totalDays = selectedTotalDays;
                        const tokenUtilization = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;

                        // Calculate dynamic growth for projections based on time period
                        const currentPeriodCost = selectedTotals.totalCost || 0;
                        const previousPeriodCost = previousPeriodUsage?.totalCost || 0;
                        const growthLabel = timePeriod === 'daily'
                          ? t.trends.daily
                          : timePeriod === 'weekly'
                            ? t.trends.weekly
                            : timePeriod === 'monthly'
                              ? t.trends.monthly
                              : t.trends.all;
                        const comparisonLabel = timePeriod === 'daily'
                          ? t.trends.comparedToYesterday
                          : timePeriod === 'weekly'
                            ? t.trends.comparedToLastWeek
                            : timePeriod === 'monthly'
                              ? t.trends.comparedToLastMonth
                              : t.stats.allTime;
                        const growthRate = previousPeriodCost > 0 ? ((currentPeriodCost - previousPeriodCost) / previousPeriodCost) * 100 : 0;

                        return (
                          <>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{t.keyMetrics.costPerMillionTokens}</span>
                                  <span className="font-medium">{formatCurrency(costPerToken)}</span>
                                </div>
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
                                      const monthCost = data.daily.filter(day => day.date.startsWith(today.slice(0, 7))).reduce((sum, day) => sum + day.totalCost, 0);
                                      const now = displayDate(today);
                                      const projectedMonthlyCost = monthCost / now.getDate() * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
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
                                    {previousPeriodCost > 0 ? `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%` : t.stats.insufficientData}
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
                  {timePeriod === 'daily' ? t.activity.dailyActivityDetails : timePeriod === 'weekly' ? t.activity.weeklyActivityDetails : timePeriod === 'monthly' ? t.activity.monthlyActivityDetails : t.activity.allActivityDetails}
                </CardTitle>
                <CardDescription>
                  {timePeriod === 'daily' ? t.activity.dailyUsageData : timePeriod === 'weekly' ? t.activity.weeklyUsageData : timePeriod === 'monthly' ? t.activity.monthlyUsageData : t.activity.allUsageData}
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
                    const dataToShow = getPeriodData(timePeriod);

                    // Apply sorting
                    const sortedData = getSortedData(dataToShow);

                    // Apply filters
                    const filteredData = sortedData.filter(item => {
                      const costFilter = minCostFilter === '' || matchesCostFilter(item);
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
                                {timePeriod === 'daily' || timePeriod === 'all'
                                  ? displayDate(item.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US')
                                  : timePeriod === 'weekly'
                                    ? (() => {
                                      const startDate = displayDate(item.date);
                                      const endDate = new Date(startDate);
                                      endDate.setDate(startDate.getDate() + 6);
                                      return `${startDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { month: 'short', day: 'numeric' })}`;
                                    })()
                                    : displayDate(item.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { year: 'numeric', month: 'long' })
                                }
                              </div>
                            </td>
                            <td className="py-3 px-2 text-sm font-semibold">
                              <span className="text-success font-bold">
                                {formatCurrency(item.totalCost)}
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
              const dataToShow = getPeriodData(timePeriod);

              const sortedData = getSortedData(dataToShow);
              const filteredData = sortedData.filter(item => {
                const costFilter = minCostFilter === '' || matchesCostFilter(item);
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
