import React, { useState } from 'react';
import { GradingResult } from '../types';
import { CheckCircle2, AlertCircle, TrendingUp, XCircle, ShieldCheck, ChevronDown, ChevronUp, FileSearch, Check } from 'lucide-react';
import { FormattedText } from './FormattedText';

interface GradingPanelProps {
  result: GradingResult | null;
  isLoading: boolean;
  isStale: boolean;
}

export const GradingPanel: React.FC<GradingPanelProps> = ({ result, isLoading, isStale }) => {
  const [mistakesExpanded, setMistakesExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 h-full flex flex-col items-center justify-center transition-colors duration-300">
        <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-indigo-100 dark:border-slate-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <FileSearch className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Analyzing Submission</h3>
        <div className="flex flex-col gap-2 items-center w-full max-w-xs">
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Reading handwritten math...</p>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite] w-1/3 rounded-full"></div>
            </div>
        </div>
        <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(100%); width: 60%; }
                100% { transform: translateX(200%); width: 20%; }
            }
        `}</style>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-full flex flex-col items-center justify-center text-center transition-colors duration-300">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mb-6 rotate-3 transform transition-transform hover:rotate-6">
          <TrendingUp className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ready to Grade</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xs leading-relaxed">
          Upload a student's handwritten answer or type LaTeX. The AI will evaluate steps, logic, and formatting.
        </p>
      </div>
    );
  }

  const scorePercentage = Math.round((result.score / result.maxScore) * 100);
  let gradeColor = 'text-red-600 dark:text-red-400';
  let gradeBg = 'bg-red-500';
  let verdict = 'Needs Improvement';

  if (scorePercentage >= 90) {
      gradeColor = 'text-green-600 dark:text-green-400';
      gradeBg = 'bg-green-500';
      verdict = 'Excellent';
  } else if (scorePercentage >= 75) {
      gradeColor = 'text-emerald-600 dark:text-emerald-400';
      gradeBg = 'bg-emerald-500';
      verdict = 'Good Job';
  } else if (scorePercentage >= 50) {
      gradeColor = 'text-amber-600 dark:text-amber-400';
      gradeBg = 'bg-amber-500';
      verdict = 'Fair';
  }

  const confidence = result.gradingConfidence || 0;
  const confidenceLabel = confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';
  
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-full flex flex-col transition-all duration-300 ${isStale ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
      
      {/* Header Summary Card */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total Score</h2>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold ${gradeColor}`}>{result.score}</span>
                    <span className="text-lg text-slate-400 font-medium">/ {result.maxScore}</span>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white ${gradeBg}`}>
                      {verdict}
                  </div>
                  {isStale && <span className="text-xs text-amber-600 font-medium animate-pulse">Update Pending...</span>}
              </div>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
             <div className={`h-full ${gradeBg} transition-all duration-1000 ease-out`} style={{ width: `${scorePercentage}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
             <div className="flex items-center gap-1.5" title="AI Grading Confidence">
                 <ShieldCheck className={`w-4 h-4 ${confidence > 0.8 ? 'text-green-500' : 'text-amber-500'}`} />
                 <span>Confidence: <strong className="text-slate-700 dark:text-slate-300">{confidenceLabel}</strong></span>
             </div>
             <div>
                {Math.round(scorePercentage)}%
             </div>
          </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        
        {/* Main Feedback */}
        <section>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                Assessment Summary
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    <FormattedText text={result.summary} />
                </p>
                <div className="text-slate-600 dark:text-slate-400">
                    <FormattedText text={result.feedback} />
                </div>
            </div>
        </section>

        {/* Mistakes */}
        {((result.mistakes && result.mistakes.length > 0) || (result.mistakeTypes && result.mistakeTypes.length > 0)) && (
            <section>
                <div 
                    className="flex items-center justify-between cursor-pointer mb-3 group"
                    onClick={() => setMistakesExpanded(!mistakesExpanded)}
                >
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <XCircle className="w-4 h-4 text-red-500" />
                        Areas for Improvement
                        <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full">
                            {result.mistakes?.length || 0}
                        </span>
                    </h3>
                    {mistakesExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                {mistakesExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Tags */}
                        {result.mistakeTypes && result.mistakeTypes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {result.mistakeTypes.map((type, idx) => (
                                    <span key={idx} className="text-[10px] uppercase font-bold px-2 py-1 rounded border bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800 text-red-600 dark:text-red-400">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* List */}
                        <ul className="space-y-2">
                            {result.mistakes?.map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="text-red-500 font-bold mt-0.5">•</span>
                                    <span><FormattedText text={item} /></span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
        )}

        {/* Improvements */}
        {result.improvements && result.improvements.length > 0 && (
            <section>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Key Takeaways
                </h3>
                <ul className="space-y-2">
                    {result.improvements.map((item, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                             <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                             </div>
                             <span><FormattedText text={item} /></span>
                        </li>
                    ))}
                </ul>
            </section>
        )}

      </div>
    </div>
  );
};