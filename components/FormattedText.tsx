import React from 'react';

// Helper to render KaTeX
const MathRenderer: React.FC<{ content: string, displayMode: boolean, fallback?: boolean }> = ({ content, displayMode, fallback }) => {
    if (!window.katex) return <code className="text-xs bg-slate-100 p-1 rounded">{content}</code>;

    try {
        const html = window.katex.renderToString(content, {
            throwOnError: true, // Fail fast if it's not valid math
            displayMode: displayMode,
            strict: false
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} className={displayMode ? "block my-2 text-center" : "mx-0.5"} />;
    } catch (e) {
        // If it failed and we were just guessing (fallback=true), return plain text
        if (fallback) return <span>{content}</span>;
        
        // If it was explicitly marked as math but failed, show error style
        return <code className="text-xs bg-red-50 text-red-500 px-1 rounded">{content}</code>;
    }
}

// Sub-component to try and detect math inside plain text
const TextWithImplicitMath: React.FC<{ content: string }> = ({ content }) => {
  // Advanced regex to capture math that isn't wrapped in $ signs.
  // 1. LaTeX commands: \frac{...}{...}, \sqrt{...}, \pm
  // 2. Polynomial equations: 2x^2 - 4x - 6 = 0, x^2 + y^2 = r^2
  // 3. Variable assignments: x_1 = 3, a = 2, b=-4
  // 4. Roots/Powers: x_1, x^2
  
  const implicitMathRegex = /((?:\\[a-zA-Z]+(?:\{.*?\})*(?:\s*=\s*[\d\w\.\-]+)?)|(?:[a-zA-Z][\w_]*(?:\^[\w\{\}\-]+|_[\w\{\}\-]+)(?:\s*=\s*[\d\w\.\-]+)?)|(?:\b[a-z]\s*=\s*[\d\.\-]+)|(?:(?:[\d]*[a-z]\^2[\s\+\-\d]*[a-z][\s\+\-\d]*)(?:\s*=\s*0)?)|(?:\b[\d\.]+\s*[\+\-\*\/]\s*[\d\.]+\s*=\s*[\d\.]+))/gi;

  const parts = content.split(implicitMathRegex);

  return (
    <>
      {parts.map((subPart, idx) => {
        const trimmed = subPart.trim();
        if (!trimmed) return <span key={idx}>{subPart}</span>;

        // Validation: Ensure it actually looks like math before rendering with KaTeX.
        // Must contain at least one of: \, =, ^, _, or a digit comparison
        const hasMathChar = /[\=\^_\\]/.test(trimmed);
        
        // Exclude common English words that might match loosely
        const isEnglish = /^[a-zA-Z\s\.,]+$/.test(trimmed);

        if (hasMathChar && !isEnglish && trimmed.length > 1) {
             // Heuristic: If it ends with punctuation like ".", ",", clean it for rendering but append it after
             const matchPunctuation = subPart.match(/([.,:;]+)$/);
             let cleanContent = subPart;
             let punctuation = "";
             
             if (matchPunctuation) {
                 punctuation = matchPunctuation[0];
                 cleanContent = subPart.slice(0, -punctuation.length);
             }

             return (
                <React.Fragment key={idx}>
                    <MathRenderer content={cleanContent} displayMode={false} fallback={true} />
                    {punctuation}
                </React.Fragment>
             );
        }
        return <span key={idx}>{subPart}</span>;
      })}
    </>
  );
}

// Improved FormattedText to handle mixed text and math, including robust fallback for unwrapped LaTeX
export const FormattedText: React.FC<{ text: string, className?: string }> = ({ text, className }) => {
  if (!text) return null;

  // 1. First split by explicit standard delimiters
  // Delimiters: $$...$$, \[...\], \(...\), $...$
  const delimiterRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?:\$[^\$]+\$))/g;
  const parts = text.split(delimiterRegex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if it's explicitly wrapped math
        const isDisplayMath = part.startsWith('$$') || part.startsWith('\\[');
        const isInlineMath = part.startsWith('$') || part.startsWith('\\(');

        if (isDisplayMath || isInlineMath) {
            let cleanContent = part;
            if (part.startsWith('$$')) cleanContent = part.slice(2, -2);
            else if (part.startsWith('\\[')) cleanContent = part.slice(2, -2);
            else if (part.startsWith('\\(')) cleanContent = part.slice(2, -2);
            else if (part.startsWith('$')) cleanContent = part.slice(1, -1);

            return <MathRenderer key={index} content={cleanContent} displayMode={isDisplayMath} />;
        }
        
        // If it's "text", it might still contain unwrapped math (e.g. "x = \frac{1}{2}")
        return <TextWithImplicitMath key={index} content={part} />;
      })}
    </span>
  );
};