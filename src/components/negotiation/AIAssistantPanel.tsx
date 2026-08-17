'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { AIAnalysis, CounterSuggestion } from '@/lib/ai/negotiation-assistant';

interface AIAssistantPanelProps {
  analysis?: AIAnalysis | null;
  suggestion?: CounterSuggestion | null;
  isLoading?: boolean;
  onAnalyze?: () => void;
  onApplySuggestion?: (suggestion: CounterSuggestion) => void;
  language?: 'en' | 'ar' | 'fr';
}

export function AIAssistantPanel({
  analysis,
  suggestion,
  isLoading = false,
  onAnalyze,
  onApplySuggestion,
  language = 'en',
}: AIAssistantPanelProps) {
  const [showDetails, setShowDetails] = useState(true);

  const getLabel = (en: string, ar: string, fr: string) => {
    return language === 'ar' ? ar : language === 'fr' ? fr : en;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPositionBadge = (position: string) => {
    switch (position) {
      case 'BELOW_MARKET':
        return <Badge variant="destructive" className="text-xs">
          {getLabel('Below Market', 'أقل من السوق', 'En dessous du marché')}
        </Badge>;
      case 'ABOVE_MARKET':
        return <Badge className="bg-green-100 text-green-700 text-xs">
          {getLabel('Above Market', 'أعلى من السوق', 'Au-dessus du marché')}
        </Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">
          {getLabel('At Market', 'في السوق', 'Au niveau du marché')}
        </Badge>;
    }
  };

  return (
    <Card className="w-full border-dashed border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {getLabel('AI Assistant', 'مساعد الذكاء الاصطناعي', 'Assistant IA')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {onAnalyze && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAnalyze}
                disabled={isLoading}
                className="h-8"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {getLabel('Analyze', 'حلل', 'Analyser')}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {(showDetails || analysis || suggestion) && (
        <CardContent className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              {getLabel('Analyzing...', 'جارٍ التحليل...', 'Analyse en cours...')}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <>
              {/* Fairness Score */}
              <div className="space-y-2 p-4 bg-card rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {getLabel('Fairness Score', 'درجة العدالة', 'Score d\'équité')}
                  </span>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.fairnessScore)}`}>
                    {analysis.fairnessScore}/100
                  </span>
                </div>
                
                <Progress value={analysis.fairnessScore} className="h-2" />
                
                <div className="flex items-center justify-between mt-2">
                  {getPositionBadge(analysis.marketPosition)}
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    {getLabel(
                      `Win Probability: ${analysis.winProbability}%`,
                      `احتمالية الفوز: ${analysis.winProbability}%`,
                      `Probabilité de réussite: ${analysis.winProbability}%`
                    )}
                  </div>
                </div>
              </div>

              {/* Suggested Price */}
              {analysis.suggestedCounterPrice && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    {getLabel('Suggested Counter Price', 'السعر المقترح للعرض المضاد', 'Prix de contre-offre suggéré')}
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {analysis.suggestedCounterPrice.toLocaleString()} د.ج
                  </p>
                </div>
              )}

              {/* Risk Factors */}
              {analysis.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    {getLabel('Risk Factors', 'عوامل الخطر', 'Facteurs de risque')}
                  </p>
                  <ul className="space-y-1">
                    {analysis.riskFactors.map((factor, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {getLabel('Strengths', 'نقاط القوة', 'Points forts')}
                  </p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="font-medium text-sm text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    {getLabel('Recommendations', 'التوصيات', 'Recommandations')}
                  </p>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-purple-600 dark:text-purple-400 flex items-start gap-2">
                        <span>{index + 1}.</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Similar Deals */}
              {analysis.similarDeals.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">{getLabel('Similar Deals', 'صفقات مشابهes', 'Transactions similaires')}</p>
                  <div className="grid grid-cols-5 gap-1">
                    {analysis.similarDeals.map((deal, index) => (
                      <div key={index} className="text-center p-2 rounded bg-muted/50">
                        <p className="text-xs font-medium">{(deal.price / 1000).toFixed(0)}K</p>
                        <Badge 
                          variant={deal.outcome === 'ACCEPTED' ? 'default' : 'outline'} 
                          className="text-[10px] mt-1 px-1 py-0"
                        >
                          {deal.outcome === 'ACCEPTED' ? '✓' : '✗'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Counter Offer Suggestion */}
          {suggestion && !isLoading && (
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    {getLabel('AI Counter-Offer Suggestion', 'اقتراح العرض المضاد بالذكاء الاصطناعي', 'Suggestion de contre-offre IA')}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    {getLabel('Confidence', 'الثقة', 'Confiance')}: {suggestion.confidence}%
                  </p>
                </div>
                <Badge className={
                  suggestion.expectedOutcome === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  suggestion.expectedOutcome === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }>
                  {suggestion.expectedOutcome}
                </Badge>
              </div>

              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {suggestion.suggestedPrice.toLocaleString()} د.ج
              </div>

              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                {language === 'ar' ? suggestion.reasoningAr : 
                 language === 'fr' ? suggestion.reasoningFr : 
                 suggestion.reasoning}
              </p>

              {onApplySuggestion && (
                <Button
                  onClick={() => onApplySuggestion(suggestion)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {getLabel('Apply This Suggestion', 'تطبيق هذا الاقتراع', 'Appliquer cette suggestion')}
                </Button>
              )}
            </div>
          )}

          {/* Empty State */}
          {!analysis && !suggestion && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {getLabel(
                  'Submit an offer and click "Analyze" to get AI insights',
                  'قدم عرضاً وانقر على "تحليل" للحصول على رؤى الذكاء الاصطناعي',
                  'Soumettez une offre et cliquez sur "Analyser" pour obtenir des insights IA'
                )}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default AIAssistantPanel;
