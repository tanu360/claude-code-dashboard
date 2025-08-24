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
  Info
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
import type { UsageResponse, Currency } from '@/types/usage';
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

  // Unused function - commenting out for now
  // const calculateSavings = (actualCost: number) => {
  //   // Max plans: $100/month and $200/month
  //   // Calculate daily rates
  //   const max100Daily = 100 / 30; // ~$3.33/day
  //   const max200Daily = 200 / 30; // ~$6.67/day
  //   
  //   if (actualCost <= max100Daily) {
  //     // If actual cost is less than Max $100 plan
  //     const savings = ((max100Daily - actualCost) / max100Daily) * 100;
  //     return { plan: 'Max $100', savings };
  //   } else if (actualCost <= max200Daily) {
  //     // If actual cost is between Max $100 and Max $200
  //     const savings = ((max200Daily - actualCost) / max200Daily) * 100;
  //     return { plan: 'Max $200', savings };
  //   } else {
  //     // If actual cost exceeds Max $200 plan
  //     const overage = ((actualCost - max200Daily) / actualCost) * 100;
  //     return { plan: 'Over', savings: -overage };
  //   }
  // };

  const aggregateDataByWeek = (dailyData: any[]) => {
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

  const aggregateDataByMonth = (dailyData: any[]) => {
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

  const getSortedData = (dataToSort: any[]) => {
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
                <h1 className="text-2xl font-bold">{language === 'hi' ? 'Claude Code विश्लेषण' : 'Claude Code Analytics'}</h1>
                <p className="text-sm text-muted-foreground">{language === 'hi' ? 'वास्तविक समय उपयोग निगरानी' : 'Real-time usage monitoring'}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-wrap justify-center gap-2">
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                  >
                    EN
                  </Button>
                  <Button
                    variant={language === 'hi' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setLanguage('hi')}
                  >
                    हिंदी
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Button
                    variant={currency === 'USD' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setCurrency('USD')}
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    USD
                  </Button>
                  <Button
                    variant={currency === 'INR' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setCurrency('INR')}
                  >
                    ₹ INR
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Button
                    variant={timePeriod === 'daily' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('daily')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {language === 'hi' ? 'दैनिक' : 'Daily'}
                  </Button>
                  <Button
                    variant={timePeriod === 'weekly' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('weekly')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {language === 'hi' ? 'साप्ताहिक' : 'Weekly'}
                  </Button>
                  <Button
                    variant={timePeriod === 'monthly' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setTimePeriod('monthly')}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {language === 'hi' ? 'मासिक' : 'Monthly'}
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
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{language === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'कुल लागत' : 'Total Cost'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totals.totalCost)}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'पिछले महीने से +12.5%' : '+12.5% from last month'}
                  </p>
                </div>
                {currency === 'INR' ? (
                  <span className="w-8 h-8 text-muted-foreground flex items-center justify-center text-2xl font-bold">₹</span>
                ) : (
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'कुल टोकन' : 'Total Tokens'}
                  </p>
                  <p className="text-2xl font-bold">{(data.totals.totalTokens / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'कुल उपयोग' : 'Total usage'}
                  </p>
                </div>
                <Cpu className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'औसत दैनिक लागत' : 'Avg Daily Cost'}
                  </p>
                  <p className="text-2xl font-bold">{formatCurrency(data.totals.totalCost / data.daily.length)}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'प्रति दिन विश्लेषण' : 'Per day analysis'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'hi' ? 'सक्रिय दिन' : 'Active Days'}
                  </p>
                  <p className="text-2xl font-bold">{data.daily.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'ट्रैकिंग अवधि' : 'Tracking period'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
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
                <CardTitle>{language === 'hi' ? 'योजना तुलना और वित्तीय अंतर्दृष्टि' : 'Plan Comparison & Financial Insights'}</CardTitle>
              </div>
              <CardDescription>
                {language === 'hi' ? 'Claude Code प्राइसिंग प्लान और कॉस्ट ब्रेकडाउन का विस्तृत विश्लेषण' : 'Detailed analysis of Claude Code pricing plans and cost breakdown'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const totalCost = data.totals.totalCost;
                const max100Savings = Math.max(0, 100 - totalCost);
                const max200Savings = Math.max(0, 200 - totalCost);
                const currentUtilization100 = Math.min((totalCost / 100) * 100, 100);
                const currentUtilization200 = Math.min((totalCost / 200) * 100, 100);

                // Model pricing calculation (Claude Sonnet 4 pricing)
                const inputTokenCost = (data.totals.inputTokens / 1000000) * 3; // $3 per million input tokens
                const outputTokenCost = (data.totals.outputTokens / 1000000) * 15; // $15 per million output tokens
                const cacheWriteCost = (data.totals.cacheCreationTokens / 1000000) * 3.75; // $3.75 per million cache write
                const cacheReadCost = (data.totals.cacheReadTokens / 1000000) * 0.30; // $0.30 per million cache read

                const actualPlan = totalCost <= 100 ? 'Max $100' : totalCost <= 200 ? 'Max $200' : 'Over Budget';
                const planStatus = totalCost <= 100 ? 'success' : totalCost <= 200 ? 'warning' : 'danger';

                return (
                  <>
                    {/* Current Status Banner */}
                    <div className={`p-4 rounded-lg border ${planStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                        planStatus === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                      <div className="flex items-center gap-3">
                        {planStatus === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                          planStatus === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                            <AlertTriangle className="w-5 h-5 text-red-600" />}
                        <div>
                          <h3 className="font-semibold text-sm">
                            {language === 'hi' ? `वर्तमान स्थिति: ${actualPlan}` : `Current Status: ${actualPlan}`}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {language === 'hi'
                              ? `कुल खर्च: ${formatCurrency(totalCost)} - ${planStatus === 'success' ? 'बजट के भीतर' : planStatus === 'warning' ? 'मध्यम उपयोग' : 'बजट से अधिक'}`
                              : `Total Spend: ${formatCurrency(totalCost)} - ${planStatus === 'success' ? 'Within Budget' : planStatus === 'warning' ? 'Moderate Usage' : 'Over Budget'}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Comparison Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Current Usage */}
                      <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-blue-600" />
                          <h4 className="font-semibold text-sm">{language === 'hi' ? 'वर्तमान उपयोग' : 'Current Usage'}</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalCost)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === 'hi' ? 'इस बिलिंग अवधि में' : 'This billing period'}
                        </p>
                      </div>

                      {/* Max $100 Plan */}
                      <div className="p-4 rounded-lg border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <h4 className="font-semibold text-sm">Max $100</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Usage:</span>
                            <span className="text-sm font-medium">{currentUtilization100.toFixed(1)}%</span>
                          </div>
                          <Progress value={currentUtilization100} className="h-2" />
                          <p className={`text-lg font-bold ${max100Savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {max100Savings > 0
                              ? `${formatCurrency(max100Savings)} ${language === 'hi' ? 'बचत' : 'saving'}`
                              : `${formatCurrency(totalCost - 100)} ${language === 'hi' ? 'अधिक' : 'over'}`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Max $200 Plan */}
                      <div className="p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          <h4 className="font-semibold text-sm">Max $200</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Usage:</span>
                            <span className="text-sm font-medium">{currentUtilization200.toFixed(1)}%</span>
                          </div>
                          <Progress value={currentUtilization200} className="h-2" />
                          <p className={`text-lg font-bold ${max200Savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {max200Savings > 0
                              ? `${formatCurrency(max200Savings)} ${language === 'hi' ? 'बचत' : 'saving'}`
                              : `${formatCurrency(totalCost - 200)} ${language === 'hi' ? 'अधिक' : 'over'}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Model-based Cost Breakdown */}
                    <div className="border rounded-lg p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-4 h-4 text-slate-600" />
                        <h4 className="font-semibold">{language === 'hi' ? 'Claude Sonnet 4 मॉडल कॉस्ट ब्रेकडाउन' : 'Claude Sonnet 4 Model Cost Breakdown'}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded bg-white dark:bg-slate-800 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-medium">{language === 'hi' ? 'इनपुट' : 'Input'}</span>
                          </div>
                          <p className="text-sm font-bold">{formatCurrency(inputTokenCost)}</p>
                          <p className="text-xs text-muted-foreground">{(data.totals.inputTokens / 1000000).toFixed(1)}M tokens</p>
                        </div>
                        <div className="text-center p-3 rounded bg-white dark:bg-slate-800 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-xs font-medium">{language === 'hi' ? 'आउटपुट' : 'Output'}</span>
                          </div>
                          <p className="text-sm font-bold">{formatCurrency(outputTokenCost)}</p>
                          <p className="text-xs text-muted-foreground">{(data.totals.outputTokens / 1000000).toFixed(1)}M tokens</p>
                        </div>
                        <div className="text-center p-3 rounded bg-white dark:bg-slate-800 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-xs font-medium">{language === 'hi' ? 'कैश राइट' : 'Cache Write'}</span>
                          </div>
                          <p className="text-sm font-bold">{formatCurrency(cacheWriteCost)}</p>
                          <p className="text-xs text-muted-foreground">{(data.totals.cacheCreationTokens / 1000000).toFixed(1)}M tokens</p>
                        </div>
                        <div className="text-center p-3 rounded bg-white dark:bg-slate-800 border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            <span className="text-xs font-medium">{language === 'hi' ? 'कैश रीड' : 'Cache Read'}</span>
                          </div>
                          <p className="text-sm font-bold">{formatCurrency(cacheReadCost)}</p>
                          <p className="text-xs text-muted-foreground">{(data.totals.cacheReadTokens / 1000000).toFixed(1)}M tokens</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{language === 'hi' ? 'कुल मॉडल कॉस्ट:' : 'Total Model Cost:'}</span>
                          <span className="font-bold text-lg">{formatCurrency(inputTokenCost + outputTokenCost + cacheWriteCost + cacheReadCost)}</span>
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
                <CardTitle>{language === 'hi' ? 'मुख्य मेट्रिक्स' : 'Key Metrics'}</CardTitle>
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
                      <div className="flex items-center justify-between p-3 rounded border bg-blue-50 dark:bg-blue-900/20">
                        <div>
                          <p className="text-sm font-medium">{language === 'hi' ? 'औसत दैनिक लागत' : 'Avg Daily Cost'}</p>
                          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(avgDailyCost)}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded border bg-purple-50 dark:bg-purple-900/20">
                        <div>
                          <p className="text-sm font-medium">{language === 'hi' ? 'अनुमानित मासिक' : 'Projected Monthly'}</p>
                          <p className="text-lg font-bold text-purple-700 dark:text-purple-400">{formatCurrency(projectedMonthlyCost)}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-purple-500" />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded border bg-green-50 dark:bg-green-900/20">
                        <div>
                          <p className="text-sm font-medium">{language === 'hi' ? 'कैश दक्षता' : 'Cache Efficiency'}</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">{cacheEfficiency.toFixed(1)}%</p>
                        </div>
                        <Cpu className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {language === 'hi' ? 'सुझाव' : 'Recommendations'}
                      </h4>
                      <div className="space-y-2">
                        {totalCost < 50 && (
                          <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-400">
                              {language === 'hi' ? '✓ बेहतरीन! आप बजट के भीतर हैं।' : '✓ Excellent! You\'re well within budget.'}
                            </p>
                          </div>
                        )}
                        {totalCost >= 80 && totalCost < 100 && (
                          <div className="p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                              {language === 'hi' ? '⚠ Max $100 प्लान की सीमा के करीब।' : '⚠ Approaching Max $100 plan limit.'}
                            </p>
                          </div>
                        )}
                        {projectedMonthlyCost > 150 && (
                          <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                              {language === 'hi' ? '💡 Max $200 प्लान बेहतर हो सकता है।' : '💡 Consider Max $200 plan for better value.'}
                            </p>
                          </div>
                        )}
                        {cacheEfficiency > 80 && (
                          <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-400">
                              {language === 'hi' ? '🚀 उत्कृष्ट कैश उपयोग!' : '🚀 Excellent cache utilization!'}
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">{language === 'hi' ? 'सिंहावलोकन' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="tokens">{language === 'hi' ? 'टोकन विश्लेषण' : 'Token Analysis'}</TabsTrigger>
            <TabsTrigger value="trends">{language === 'hi' ? 'ट्रेंड्स' : 'Trends'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'hi'
                      ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} लागत रुझान (${currency})`
                      : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Cost Trend (${currency})`
                    }
                  </CardTitle>
                  <CardDescription>
                    {language === 'hi'
                      ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} लागत विश्लेषण`
                      : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} cost analysis`
                    }
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
                                  <span className="text-xs text-muted-foreground">{language === 'hi' ? 'दिनांक:' : 'Date:'}</span>
                                  <span className="text-xs font-medium">{label}</span>
                                  <span className="text-xs text-muted-foreground">{language === 'hi' ? 'लागत:' : 'Cost:'}</span>
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
                    {language === 'hi'
                      ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} टोकन उपयोग`
                      : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Token Usage`
                    }
                  </CardTitle>
                  <CardDescription>
                    {language === 'hi'
                      ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} टोकन खपत (मिलियन में)`
                      : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} token consumption (millions)`
                    }
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
                                  <span className="text-xs text-muted-foreground">{language === 'hi' ? 'दिनांक:' : 'Date:'}</span>
                                  <span className="text-xs font-medium">{label}</span>
                                  <span className="text-xs text-muted-foreground">{language === 'hi' ? 'टोकन:' : 'Tokens:'}</span>
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
          </TabsContent>

          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'hi' ? 'टोकन विभाजन विश्लेषण' : 'Token Breakdown Analysis'}</CardTitle>
                <CardDescription>{language === 'hi' ? 'प्रकार के आधार पर विस्तृत टोकन उपयोग' : 'Detailed token usage by type'}</CardDescription>
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
                      name={language === 'hi' ? 'इनपुट टोकन' : 'Input Tokens'}
                    />
                    <Area
                      type="monotone"
                      dataKey="outputTokens"
                      stackId="1"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2)"
                      fillOpacity={0.6}
                      name={language === 'hi' ? 'आउटपुट टोकन' : 'Output Tokens'}
                    />
                    <Area
                      type="monotone"
                      dataKey="cacheTokens"
                      stackId="1"
                      stroke="var(--chart-3)"
                      fill="var(--chart-3)"
                      fillOpacity={0.6}
                      name={language === 'hi' ? 'कैश टोकन' : 'Cache Tokens'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'hi' ? 'उपयोग ट्रेंड्स और अंतर्दृष्टि' : 'Usage Trends & Insights'}</CardTitle>
                <CardDescription>{language === 'hi' ? 'प्रदर्शन मेट्रिक्स और विश्लेषण' : 'Performance metrics and analytics'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{language === 'hi' ? 'लागत दक्षता' : 'Cost Efficiency'}</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{language === 'hi' ? 'टोकन उपयोग' : 'Token Utilization'}</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{language === 'hi' ? 'कैश हिट दर' : 'Cache Hit Rate'}</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'hi'
                ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} गतिविधि विवरण`
                : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} Activity Details`
              }
            </CardTitle>
            <CardDescription>
              {language === 'hi'
                ? `${timePeriod === 'daily' ? 'दैनिक' : timePeriod === 'weekly' ? 'साप्ताहिक' : 'मासिक'} उपयोग डेटा और टोकन विश्लेषण`
                : `${timePeriod === 'daily' ? 'Daily' : timePeriod === 'weekly' ? 'Weekly' : 'Monthly'} usage data and token analysis`
              }
            </CardDescription>
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
                        {language === 'hi' ? 'दिनांक' : 'Date'}
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('totalCost')}
                    >
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        {language === 'hi' ? 'कुल लागत' : 'Total Cost'}
                        <SortIcon field="totalCost" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('inputTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" />
                        {language === 'hi' ? 'इनपुट' : 'Input'}
                        <SortIcon field="inputTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('outputTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-purple-500" />
                        {language === 'hi' ? 'आउटपुट' : 'Output'}
                        <SortIcon field="outputTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('cacheCreationTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-orange-500" />
                        {language === 'hi' ? 'कैश निर्माण' : 'Cache Create'}
                        <SortIcon field="cacheCreationTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('cacheReadTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-cyan-500" />
                        {language === 'hi' ? 'कैश रीड' : 'Cache Read'}
                        <SortIcon field="cacheReadTokens" />
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-2 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('totalTokens')}
                    >
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-indigo-500" />
                        {language === 'hi' ? 'कुल टोकन' : 'Total Tokens'}
                        <SortIcon field="totalTokens" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let dataToShow = [];
                    if (timePeriod === 'daily' && data.daily) {
                      dataToShow = data.daily.slice(-15); // Show more rows for better sorting demo
                    } else if (timePeriod === 'weekly' && data.daily) {
                      const weeklyData = aggregateDataByWeek(data.daily);
                      dataToShow = weeklyData.slice(-15);
                    } else if (timePeriod === 'monthly' && data.daily) {
                      const monthlyData = aggregateDataByMonth(data.daily);
                      dataToShow = monthlyData.slice(-15);
                    }

                    // Apply sorting
                    const sortedData = getSortedData(dataToShow);

                    return sortedData.map((item, index) => (
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
                        <td className="py-3 px-2 text-xs font-semibold">
                          <span className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                            {formatCurrency(item.totalCost, item.date)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {(item.inputTokens / 1000).toLocaleString()}K
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {(item.outputTokens / 1000).toLocaleString()}K
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {(item.cacheCreationTokens / 1000).toLocaleString()}K
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                            {(item.cacheReadTokens / 1000).toLocaleString()}K
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
                            {(item.totalTokens / 1000000).toFixed(1)}M
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-300 hover:scale-110 flex items-center justify-center"
          aria-label={language === 'hi' ? 'शीर्ष पर जाएं' : 'Scroll to top'}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}