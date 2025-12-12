import React, { useState, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-latex';
import { SymbolPalette } from './SymbolPalette';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_COMMANDS = [
  '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\theta', '\\lambda', '\\pi', '\\sigma', '\\phi', '\\omega',
  '\\Delta', '\\Gamma', '\\Lambda', '\\Pi', '\\Sigma', '\\Phi', '\\Omega',
  '\\frac', '\\sqrt', '\\sum', '\\prod', '\\int', '\\infty', '\\lim',
  '\\sin', '\\cos', '\\tan', '\\log', '\\ln',
  '\\begin', '\\end', '\\section', '\\subsection', '\\subsubsection', '\\paragraph',
  '\\textbf', '\\textit', '\\underline', '\\emph',
  '\\usepackage', '\\documentclass', '\\title', '\\author', '\\date', '\\maketitle',
  '\\label', '\\ref', '\\cite', '\\item'
];

export const LatexEditor: React.FC<LatexEditorProps> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // We need an ID to find the textarea for insertion logic
  const textareaId = "latex-editor-textarea";
  
  // Ref to container to calculate popup position
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate line numbers
  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Ensure Prism highlighting works
  const highlight = (code: string) => {
    // Fallback to text if latex grammar not loaded for some reason
    if (Prism.languages.latex) {
      return Prism.highlight(code, Prism.languages.latex, 'latex');
    }
    return code; // plain text fallback
  };

  // Insert text at cursor position
  const insertText = (text: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.substring(0, start) + text + value.substring(end);
    onChange(newValue);

    // Restore focus and move cursor
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Handle autocomplete trigger
  const handleKeyUp = (e: React.KeyboardEvent) => {
    const textarea = e.target as HTMLTextAreaElement;
    const { selectionStart } = textarea;
    const textBeforeCursor = value.slice(0, selectionStart);
    
    // Check if we are typing a command
    const match = textBeforeCursor.match(/\\[a-zA-Z]*$/);
    
    if (match) {
        const query = match[0];
        // Filter commands
        const filtered = COMMON_COMMANDS.filter(cmd => cmd.startsWith(query) && cmd !== query);
        
        if (filtered.length > 0) {
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    } else {
        setShowSuggestions(false);
    }
  };

  const applySuggestion = (cmd: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    // Find the backslash before cursor
    const textBefore = value.slice(0, start);
    const lastBackslash = textBefore.lastIndexOf('\\');
    
    if (lastBackslash !== -1) {
        const newValue = value.slice(0, lastBackslash) + cmd + value.slice(start);
        onChange(newValue);
        setShowSuggestions(false);
        setTimeout(() => {
            textarea.focus();
            const newCursor = lastBackslash + cmd.length;
            textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-b-xl" ref={containerRef}>
      <SymbolPalette onInsert={insertText} />
      
      <div className="relative flex-1 overflow-hidden">
        {/* Scrollable Container */}
        <div className="absolute inset-0 custom-scrollbar overflow-auto flex">
            
            {/* Line Numbers Gutter */}
            <div 
                className="flex-none bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-right select-none sticky left-0 z-10"
                style={{
                    minHeight: '100%',
                    paddingTop: 16, // Match Editor padding
                    paddingBottom: 16,
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    lineHeight: '1.5', // Explicit line height
                    minWidth: '3.5rem'
                }}
            >
                {lines.map(n => (
                    <div key={n} className="px-3">{n}</div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 min-w-0">
                <Editor
                    value={value}
                    onValueChange={onChange}
                    highlight={highlight}
                    padding={16}
                    textareaId={textareaId}
                    className="font-mono text-sm min-h-full"
                    style={{
                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                        fontSize: 14,
                        lineHeight: '1.5',
                        backgroundColor: 'transparent',
                        color: 'inherit' // Inherits from tailwind classes
                    }}
                    textareaClassName="focus:outline-none bg-transparent text-transparent caret-indigo-500 z-0"
                    onKeyUp={handleKeyUp}
                />
            </div>
        </div>

        {/* Autocomplete Popup */}
        {showSuggestions && (
            <div className="absolute bottom-2 left-16 z-20 w-48 max-h-48 overflow-y-auto bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                <div className="px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-600 sticky top-0">
                    Suggestions
                </div>
                {suggestions.map(cmd => (
                    <button
                        key={cmd}
                        className="w-full text-left px-3 py-1.5 text-sm font-mono text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 focus:bg-indigo-50 focus:outline-none transition-colors"
                        onClick={() => applySuggestion(cmd)}
                    >
                        {cmd}
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};