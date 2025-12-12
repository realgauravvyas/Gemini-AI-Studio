import React, { useState } from 'react';

interface SymbolPaletteProps {
  onInsert: (code: string) => void;
}

const CATEGORIES = {
  'Math': [
    { label: 'x/y', code: '\\frac{a}{b}', tooltip: 'Fraction' },
    { label: 'Σ', code: '\\sum_{i=0}^{n}', tooltip: 'Summation' },
    { label: '∫', code: '\\int_{a}^{b}', tooltip: 'Integral' },
    { label: '√', code: '\\sqrt{x}', tooltip: 'Square Root' },
    { label: 'x²', code: 'x^{2}', tooltip: 'Superscript' },
    { label: 'xᵢ', code: 'x_{i}', tooltip: 'Subscript' },
    { label: 'lim', code: '\\lim_{x \\to \\infty}', tooltip: 'Limit' },
  ],
  'Greek': [
    { label: 'α', code: '\\alpha' },
    { label: 'β', code: '\\beta' },
    { label: 'γ', code: '\\gamma' },
    { label: 'δ', code: '\\delta' },
    { label: 'θ', code: '\\theta' },
    { label: 'π', code: '\\pi' },
    { label: 'λ', code: '\\lambda' },
    { label: 'σ', code: '\\sigma' },
    { label: 'Δ', code: '\\Delta' },
    { label: 'Ω', code: '\\Omega' },
  ],
  'Operators': [
    { label: '×', code: '\\times' },
    { label: '·', code: '\\cdot' },
    { label: '÷', code: '\\div' },
    { label: '±', code: '\\pm' },
    { label: '∞', code: '\\infty' },
    { label: '≠', code: '\\neq' },
    { label: '≈', code: '\\approx' },
    { label: '≤', code: '\\leq' },
    { label: '≥', code: '\\geq' },
    { label: '∈', code: '\\in' },
    { label: '→', code: '\\rightarrow' },
  ],
  'Structure': [
    { label: 'Section', code: '\\section{Title}' },
    { label: 'Subsection', code: '\\subsection{Title}' },
    { label: 'Bold', code: '\\textbf{text}' },
    { label: 'Italic', code: '\\textit{text}' },
    { label: 'Equation', code: '\\begin{equation}\n  \n\\end{equation}' },
    { label: 'Align', code: '\\begin{align*}\n  \n\\end{align*}' },
  ]
};

export const SymbolPalette: React.FC<SymbolPaletteProps> = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState<keyof typeof CATEGORIES>('Math');

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-slate-200 dark:border-slate-700">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat as keyof typeof CATEGORIES)}
            className={`px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === cat
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-2 overflow-x-auto">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES[activeTab].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onInsert(item.code)}
              title={item.tooltip || item.label}
              className="min-w-[32px] h-8 px-2 flex items-center justify-center text-sm rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};