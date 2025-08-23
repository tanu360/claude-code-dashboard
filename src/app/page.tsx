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
  Moon
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
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [ratesLoading, setRatesLoading] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(83);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [inputRate, setInputRate] = useState<string>('83');

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

      // Fetch exchange rates for each date
      // setRatesLoading(true);
      const rates: Record<string, number> = {};
      let lastValidRate = currentRate;

      for (const day of usageData.daily) {
        try {
          const rateResponse = await fetch(`/api/exchange-rate?date=${day.date}`, { headers });
          const rateData = await rateResponse.json();
          rates[day.date] = rateData.rate;
          lastValidRate = rateData.rate; // Update last valid rate
        } catch {
          rates[day.date] = lastValidRate; // Use last valid rate instead of hardcoded 83
        }
      }

      setExchangeRates(rates);
      setCurrentRate(lastValidRate);
      setInputRate(lastValidRate.toString());
      // setRatesLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentRate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getChartData = () => {
    if (!data) return [];
    return data.daily
      .slice()
      .map(day => ({
        date: new Date(day.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
          month: 'short',
          day: 'numeric'
        }),
        cost: currency === 'INR' && exchangeRates[day.date]
          ? day.totalCost * exchangeRates[day.date]
          : day.totalCost,
        tokens: day.totalTokens / 1000000,
        inputTokens: day.inputTokens / 1000000,
        outputTokens: day.outputTokens / 1000000,
        cacheTokens: (day.cacheCreationTokens + day.cacheReadTokens) / 1000000,
        originalDate: day.date
      }));
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
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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

        {/* Savings Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{language === 'hi' ? 'निश्चित योजना तुलना' : 'Fixed Plan Comparison'}</CardTitle>
            <CardDescription>
              {language === 'hi' ? 'Max $100/महीने और Max $200/महीने योजनाओं की तुलना में बचत' : 'Savings compared to Max $100/mo and Max $200/mo plans'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const totalCost = data.totals.totalCost;

                const max100Savings = Math.max(0, 100 - totalCost);
                const max200Savings = Math.max(0, 200 - totalCost);
                const actualPlan = totalCost <= 100
                  ? 'Max $100'
                  : totalCost <= 200
                    ? 'Max $200'
                    : (language === 'hi' ? 'ओवर' : 'Over');

                return (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{language === 'hi' ? 'वर्तमान बिलिंग अवधि कुल' : 'Current Billing Period Total'}</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                      <p className="text-xs text-muted-foreground">{actualPlan}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{language === 'hi' ? 'Max $100 के विरुद्ध' : 'vs Max $100'}</p>
                      <p className={`text-2xl font-bold ${max100Savings > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {max100Savings > 0 ? formatCurrency(max100Savings) : formatCurrency(totalCost - 100)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {max100Savings > 0
                          ? (language === 'hi' ? 'बचत' : 'Saving')
                          : (language === 'hi' ? 'ओवर' : 'Over')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{language === 'hi' ? 'Max $200 के विरुद्ध' : 'vs Max $200'}</p>
                      <p className={`text-2xl font-bold ${max200Savings > 0 ? 'text-primary' : 'text-destructive'}`}>
                        {max200Savings > 0 ? formatCurrency(max200Savings) : formatCurrency(totalCost - 200)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {max200Savings > 0
                          ? (language === 'hi' ? 'बचत' : 'Saving')
                          : (language === 'hi' ? 'ओवर' : 'Over')}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

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
                  <CardTitle>{language === 'hi' ? `दैनिक लागत रुझान (${currency})` : `Daily Cost Trend (${currency})`}</CardTitle>
                  <CardDescription>{language === 'hi' ? 'समय के साथ लागत विश्लेषण' : 'Cost analysis over time'}</CardDescription>
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
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
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
                  <CardTitle>{language === 'hi' ? 'टोकन उपयोग' : 'Token Usage'}</CardTitle>
                  <CardDescription>{language === 'hi' ? 'दैनिक टोकन खपत (मिलियन में)' : 'Daily token consumption (millions)'}</CardDescription>
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
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
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
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
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
            <CardTitle>{language === 'hi' ? 'हाल की गतिविधि' : 'Recent Activity'}</CardTitle>
            <CardDescription>{language === 'hi' ? 'नवीनतम उपयोग डेटा और मेट्रिक्स' : 'Latest usage data and metrics'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === 'hi' ? 'दिनांक' : 'Date'}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === 'hi' ? 'लागत' : 'Cost'}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === 'hi' ? 'टोकन' : 'Tokens'}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === 'hi' ? 'इनपुट' : 'Input'}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      {language === 'hi' ? 'आउटपुट' : 'Output'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.slice(-8).reverse().map((day) => (
                    <tr key={day.date} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm">{new Date(day.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US')}</td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(day.totalCost, day.date)}</td>
                      <td className="py-3 px-4 text-sm">{(day.totalTokens / 1000000).toFixed(1)}M</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{(day.inputTokens / 1000).toLocaleString()}K</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{(day.outputTokens / 1000).toLocaleString()}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}