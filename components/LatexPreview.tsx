import React, { useEffect, useRef, useState } from 'react';

interface LatexPreviewProps {
  latex: string;
  id?: string;
}

// Regex to capture:
// 1. $$ ... $$ (Display Math)
// 2. \[ ... \] (Display Math)
// 3. \begin{env} ... \end{env} (Environments)
// 4. $ ... $ (Inline Math)
const MATH_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\s*\{(?:equation|align|gather|alignat|flalign|multline)\*?\}[\s\S]*?\\end\s*\{(?:equation|align|gather|alignat|flalign|multline)\*?\}|\$[^\$\n]+\$)/gi;

const MathBlock: React.FC<{ content: string; displayMode: boolean }> = ({ content, displayMode }) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (spanRef.current && window.katex) {
      try {
        let cleanContent = content.trim();
        
        // Strip delimiters for KaTeX if they are standard wrappers
        // Note: We DO NOT strip \begin{...}...\end{...} as KaTeX needs them to know which environment to render.
        if (cleanContent.startsWith('$$') && cleanContent.endsWith('$$')) {
            cleanContent = cleanContent.slice(2, -2);
        } else if (cleanContent.startsWith('\\[') && cleanContent.endsWith('\\]')) {
            cleanContent = cleanContent.slice(2, -2);
        } else if (cleanContent.startsWith('$') && cleanContent.endsWith('$') && !cleanContent.startsWith('$$')) {
            cleanContent = cleanContent.slice(1, -1);
        }
        
        window.katex.render(cleanContent, spanRef.current, {
          throwOnError: true,
          displayMode: displayMode,
          trust: true,
          strict: false,
          globalGroup: true,
          macros: {
             "\\usepackage": "\\@gobble", 
             "\\documentclass": "\\@gobble",
             "\\title": "\\@gobble",
             "\\author": "\\@gobble",
             "\\date": "\\@gobble",
             "\\maketitle": "\\@gobble",
             "\\section": "\\text", 
             "\\subsection": "\\text",
             "\\label": "\\@gobble",
             "\\ref": "\\text",
             "\\cite": "\\text",
             "\\textbf": "\\mathbf",
             "\\textit": "\\mathit",
             "\\text": "\\mathrm",
          }
        });
        setError(null);
      } catch (e: any) {
        console.warn("KaTeX render warning:", e);
        setError(e.message);
      }
    }
  }, [content, displayMode]);

  if (error) {
    const isQuirksMode = error.includes("quirks mode");
    return (
        <div className="my-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mb-1">
                {isQuirksMode ? "Browser Compatibility Error" : "Rendering Error"}
            </p>
            {isQuirksMode && (
                <p className="text-[10px] text-red-500 dark:text-red-400 mb-1">
                    The document is in "Quirks Mode". Please ensure the <code>&lt;!DOCTYPE html&gt;</code> declaration is at the very top of your HTML file.
                </p>
            )}
            <code className="block text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all bg-white dark:bg-slate-800 p-1 rounded border border-slate-100 dark:border-slate-700">
                {content}
            </code>
            {!isQuirksMode && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1 font-mono">{error}</p>}
        </div>
    );
  }

  return <span ref={spanRef} />;
};

export const LatexPreview: React.FC<LatexPreviewProps> = ({ latex, id }) => {
  
  const getRenderableContent = (fullLatex: string) => {
    if (!fullLatex) return "";
    
    // Attempt to extract document body
    const bodyMatch = fullLatex.match(/\\begin\s*\{document\}([\s\S]*?)\\end\s*\{document\}/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1].trim();
    }
    
    // If no document environment, but has documentclass, try to guess where body starts
    if (fullLatex.includes("\\documentclass")) {
       if (fullLatex.match(/\\begin\s*\{document\}/i)) {
          // If match failed previously but substring exists, fallback splitting
          const split = fullLatex.split(/\\begin\s*\{document\}/i);
          if (split[1]) {
             return split[1].split(/\\end\s*\{document\}/i)[0];
          }
       }
       // Fallback: Just return full latex if we can't parse it, maybe user pasted partial
       return fullLatex; 
    }

    return fullLatex;
  };

  const content = getRenderableContent(latex);
  
  if (!content.trim()) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm p-12 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
        <span className="mb-2">No content to preview</span>
        <span className="text-xs opacity-70">Type in the Source Code tab or upload a file.</span>
      </div>
    );
  }

  // Tokenize
  const parts = content.split(MATH_REGEX);

  return (
    <div id={id} className="w-full text-lg leading-relaxed text-slate-900 dark:text-slate-100 font-serif p-4">
      {parts.map((part, index) => {
        if (!part) return null;

        // Display Math Environments
        // Check for $$...$$, \[...\], or \begin{env}...\end{env}
        if (part.match(/^(\$\$|\\\[|\\begin\s*\{)/)) {
           return <div key={index} className="my-4 overflow-x-auto text-center"><MathBlock content={part} displayMode={true} /></div>;
        } 
        // Inline Math
        else if (part.match(/^\$/)) {
           return <MathBlock key={index} content={part} displayMode={false} />;
        } 
        // Text block
        else {
           return (
             <span key={index} className="whitespace-pre-wrap break-words">
               {part}
             </span>
           );
        }
      })}
    </div>
  );
};