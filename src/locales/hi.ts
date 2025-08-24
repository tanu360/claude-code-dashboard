import type { LocaleKeys } from './en';

export const hi: LocaleKeys = {
    // Navigation & Header
    title: "Claude Code Analytics Dashboard",
    subtitle: "रियल-टाइम उपयोग विश्लेषण और लागत अंतर्दृष्टि",

    // Time Period Controls
    timePeriod: {
        daily: "दैनिक",
        weekly: "साप्ताहिक",
        monthly: "मासिक"
    },

    // Currency
    currency: {
        inr: "INR",
        usd: "USD"
    },

    // Stats Cards
    stats: {
        totalCost: "कुल लागत",
        totalTokens: "कुल टोकन",
        cacheEfficiency: "कैश दक्षता",
        activeDays: "सक्रिय दिन",
        processingPower: "प्रोसेसिंग पावर",
        insufficientData: "पर्याप्त डेटा नहीं",
        fromLastWeek: "पिछले सप्ताह से",
        fromLastMonth: "पिछले महीने से",
        fromYesterday: "कल से",
        newUsage: "नया उपयोग",
        dailyAvg: "दैनिक औसत",
        input: "इनपुट",
        output: "आउटपुट",
        read: "रीड",
        write: "राइट",
        excellent: "उत्कृष्ट",
        good: "अच्छा",
        average: "औसत",
        low: "कम",
        activeDaysCount: "में से",
        activeDaysText: "दिन सक्रिय"
    },

    // Plan Comparison
    plan: {
        title: "योजना तुलना और वित्तीय अंतर्दृष्टि",
        description: "Claude Code प्राइसिंग प्लान और कॉस्ट ब्रेकडाउन का विस्तृत विश्लेषण",
        currentStatus: "वर्तमान स्थिति",
        currentUsage: "वर्तमान उपयोग",
        thisBillingPeriod: "इस बिलिंग अवधि में",
        usage: "उपयोग",
        saving: "बचत",
        over: "अधिक",
        withinBudget: "बजट के भीतर",
        moderateUsage: "मध्यम उपयोग",
        overBudget: "बजट ओवर",
        totalSpend: "कुल खर्च",
        modelCostBreakdown: "मॉडल कॉस्ट ब्रेकडाउन",
        totalModelCost: "कुल मॉडल कॉस्ट",
        cacheWrite: "कैश राइट",
        cacheRead: "कैश रीड"
    },

    // Key Metrics
    keyMetrics: {
        title: "मुख्य मेट्रिक्स",
        avgDailyCost: "औसत दैनिक लागत",
        projectedMonthly: "अनुमानित मासिक",
        costPerMillionTokens: "प्रति दस लाख टोकन लागत",
        modelsUsed: "मॉडल उपयोग",
        modelUsed: "मॉडल उपयोग",
        primary: "प्राथमिक",
        peakUsageDay: "चरम उपयोग दिन",
        leastUsageDay: "न्यूनतम उपयोग दिन",
        highPeak: "उच्च चरम",
        moderatePeak: "मध्यम चरम",
        veryLow: "बहुत कम",
        lowUsage: "कम",
        date: "तारीख",
        noData: "कोई डेटा नहीं",
        basedOnRecentActivity: "हाल की गतिविधि के आधार पर"
    },

    // Recommendations
    recommendations: {
        title: "सुझाव",
        excellent: "बेहतरीन! आप बजट के भीतर हैं।",
        approachingLimit: "प्लान की सीमा के करीब।",
        excellentCache: "उत्कृष्ट कैश उपयोग!",
        increaseCacheUsage: "कैश उपयोग बढ़ाकर लागत कम करें",
        usageGrowingRapidly: "उपयोग तेजी से बढ़ रहा है - बजट की निगरानी करें",
        efficiencyOptimal: "दक्षता इष्टतम है"
    },

    // Charts Section
    charts: {
        overview: "सिंहावलोकन",
        tokenAnalysis: "टोकन विश्लेषण",
        trends: "ट्रेंड्स",
        dailyCostTrend: "दैनिक लागत रुझान",
        weeklyCostTrend: "साप्ताहिक लागत रुझान",
        monthlyCostTrend: "मासिक लागत रुझान",
        dailyCostAnalysis: "दैनिक लागत विश्लेषण",
        weeklyCostAnalysis: "साप्ताहिक लागत विश्लेषण",
        monthlyCostAnalysis: "मासिक लागत विश्लेषण",
        dailyTokenUsage: "दैनिक टोकन उपयोग",
        weeklyTokenUsage: "साप्ताहिक टोकन उपयोग",
        monthlyTokenUsage: "मासिक टोकन उपयोग",
        dailyTokenConsumption: "दैनिक टोकन खपत (मिलियन में)",
        weeklyTokenConsumption: "साप्ताहिक टोकन खपत (मिलियन में)",
        monthlyTokenConsumption: "मासिक टोकन खपत (मिलियन में)",
        tokenBreakdownAnalysis: "टोकन विभाजन विश्लेषण",
        detailedTokenUsage: "प्रकार के आधार पर विस्तृत टोकन उपयोग",
        inputTokens: "इनपुट टोकन",
        outputTokens: "आउटपुट टोकन",
        cacheTokens: "कैश टोकन",
        usageTrendsInsights: "उपयोग ट्रेंड्स और अंतर्दृष्टि",
        performanceMetrics: "प्रदर्शन मेट्रिक्स और विश्लेषण",
        dailyTrend: "दैनिक ट्रेंड",
        weeklyTrend: "साप्ताहिक ट्रेंड",
        monthlyTrend: "मासिक ट्रेंड",
        comparedToYesterday: "कल से तुलना",
        comparedToLastWeek: "पिछले सप्ताह से तुलना",
        comparedToLastMonth: "पिछले महीने से तुलना"
    },

    // Activity Table
    trends: {
        daily: 'दैनिक ट्रेंड',
        weekly: 'साप्ताहिक ट्रेंड',
        monthly: 'मासिक ट्रेंड',
        comparedToYesterday: 'कल से तुलना',
        comparedToLastWeek: 'पिछले सप्ताह से तुलना',
        comparedToLastMonth: 'पिछले महीने से तुलना',
        costEfficiency: 'लागत दक्षता',
        usageRate: 'उपयोग दर',
        cacheHitRate: 'कैश हिट दर',
        cacheUsageRate: 'कैश उपयोग दर',
        highPeak: 'उच्च शिखर',
        moderatePeak: 'मध्यम शिखर',
        lowUsage: 'कम उपयोग',
        veryLow: 'बहुत कम',
        low: 'कम',
        date: 'दिनांक',
        perMTokens: 'प्रति M टोकन',
        perMTokensText: 'प्रति M टोकन',
        costPerToken: 'प्रति M टोकन {cost}',
        activeDaysPattern: '{active} में से {total} दिन सक्रिय',
        perMTokensPrefix: 'प्रति M टोकन',
        activeDaysOf: 'में से',
        activeDaysTotal: 'दिन सक्रिय',
        cacheReads: 'कैश रीड'
    },
    activity: {
        dailyActivityDetails: "दैनिक गतिविधि विवरण",
        weeklyActivityDetails: "साप्ताहिक गतिविधि विवरण",
        monthlyActivityDetails: "मासिक गतिविधि विवरण",
        dailyUsageData: "दैनिक उपयोग डेटा और टोकन विश्लेषण",
        weeklyUsageData: "साप्ताहिक उपयोग डेटा और टोकन विश्लेषण",
        monthlyUsageData: "मासिक उपयोग डेटा और टोकन विश्लेषण",
        minAmount: "न्यूनतम राशि",
        date: "तारीख",
        cost: "लागत",
        tokens: "टोकन",
        models: "मॉडल",
        efficiency: "दक्षता",
        noDataAvailable: "कोई डेटा उपलब्ध नहीं",
        showingEntries: "दिखाया जा रहा है",
        to: "से",
        of: "में से",
        entries: "एंट्री",
        previous: "पिछला",
        next: "अगला",
        first: "पहला",
        last: "अंतिम",
        scrollToTop: "शीर्ष पर जाएं",
        showingEntriesPattern: "{start}-{end} का {total} प्रविष्टियां दिखा रहे हैं"
    },

    // Model Names
    models: {
        claudeSonnet4: "Claude Sonnet 4",
        claudeOpus4: "Claude Opus 4",
        claudeHaiku: "Claude Haiku"
    },

    // Growth Calculations
    growth: {
        comparedToLastWeek: "पिछले सप्ताह से तुलना",
        comparedToLastMonth: "पिछले महीने से तुलना",
        comparedToYesterday: "कल से तुलना"
    },

    // Usage Patterns
    patterns: {
        regular: "नियमित",
        moderate: "मध्यम",
        sporadic: "कभी-कभी"
    },

    // Insights
    insights: {
        costEfficiency: "लागत दक्षता",
        usagePattern: "उपयोग पैटर्न",
        cacheOptimization: "कैश अनुकूलन",
        futureProjections: 'भविष्य के अनुमान',
        monthlyProjection: 'मासिक अनुमान',
        basedOnRecentActivity: 'हाल की गतिविधि के आधार पर',
        increaseCacheUsage: 'कैश उपयोग बढ़ाकर लागत कम करें',
        usageGrowingRapidly: 'उपयोग तेजी से बढ़ रहा है - बजट की निगरानी करें',
        excellentCostEfficiency: 'बेहतरीन लागत दक्षता!'
    }
};
