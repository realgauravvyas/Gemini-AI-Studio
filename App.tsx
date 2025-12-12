import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { GradingPanel } from './components/GradingPanel';
import { QuestionSetup } from './components/QuestionSetup';
import { LatexEditor } from './components/LatexEditor';
import { LatexPreview } from './components/LatexPreview';
import { convertImageToLatex, gradeLatexSubmission } from './services/geminiService';
import { GradingResult, ProcessingState, QuestionContext } from './types';
import { useDebounce } from './hooks/useDebounce';
import { BrainCircuit, Eraser, Download, FileCode, Moon, Sun, Eye, FileText, ExternalLink } from 'lucide-react';

export default function App() {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // App State
  const [activeQuestion, setActiveQuestion] = useState<QuestionContext>({
    id: 'custom',
    title: 'New Assignment',
    // Updated default description based on user request to be helpful
    description: 'Solve the equation $2x^2 - 4x - 6 = 0$ by using the quadratic formula.',
    totalMarks: 100
  });

  const [latexSource, setLatexSource] = useState<string>('');
  const [answerFile, setAnswerFile] = useState<{data: string, mimeType: string} | null>(null);
  const [editorTab, setEditorTab] = useState<'source' | 'preview'>('source');
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isConverting: false,
    isGrading: false,
    error: null
  });
  
  const debouncedLatex = useDebounce(latexSource, 1500);

  // Toggle Theme
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Generate a Blob URL for the PDF preview to ensure browser compatibility
  const pdfUrl = useMemo(() => {
    if (answerFile && answerFile.mimeType === 'application/pdf') {
      try {
        const byteCharacters = atob(answerFile.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error("Failed to create PDF blob", e);
        return null;
      }
    }
    return null;
  }, [answerFile]);

  // Clean up Blob URL
  useEffect(() => {
      return () => {
          if (pdfUrl) {
              URL.revokeObjectURL(pdfUrl);
          }
      }
  }, [pdfUrl]);

  const handleImageUpload = async (base64: string, mimeType: string) => {
    setProcessing(prev => ({ ...prev, isConverting: true, error: null }));
    setAnswerFile({ data: base64, mimeType }); // Store original file for preview
    
    try {
      const generatedLatex = await convertImageToLatex(base64, mimeType);
      setLatexSource(generatedLatex);
      // We stay on source tab so user can verify the LaTeX generation against the preview (if they switch)
      // or we could switch to preview. Let's keep it on source so they see the code.
    } catch (err: any) {
      setProcessing(prev => ({ ...prev, error: err.message }));
    } finally {
      setProcessing(prev => ({ ...prev, isConverting: false }));
    }
  };

  const handleClear = () => {
      setLatexSource('');
      setAnswerFile(null);
      setGradingResult(null);
  };

  const handleGrading = useCallback(async (latex: string, context: QuestionContext) => {
    if (!latex.trim()) return;
    setProcessing(prev => ({ ...prev, isGrading: true, error: null }));
    try {
      const result = await gradeLatexSubmission(latex, context);
      setGradingResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessing(prev => ({ ...prev, isGrading: false }));
    }
  }, []);

  const handleDownloadTex = () => {
    if (!latexSource) return;
    const blob = new Blob([latexSource], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeQuestion.title.replace(/\s+/g, '_').toLowerCase()}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (debouncedLatex) {
      handleGrading(debouncedLatex, activeQuestion);
    } else {
        setGradingResult(null);
    }
  }, [debouncedLatex, activeQuestion, handleGrading]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                AutoGrade AI
              </h1>
            </div>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              
            {/* Left Column: Input & Editor */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <QuestionSetup 
                  question={activeQuestion} 
                  onUpdate={setActiveQuestion} 
              />

              <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Submit Student Answer</h3>
                  <FileUpload 
                      onFileSelect={handleImageUpload} 
                      isLoading={processing.isConverting} 
                  />
              </div>

              {processing.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-200 dark:border-red-800">
                      {processing.error}
                  </div>
              )}

              {/* LaTeX Editor & Preview */}
              <div className="flex-1 min-h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors duration-300">
                  <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="flex bg-slate-200/50 dark:bg-slate-700/50 p-1 rounded-lg border border-slate-200 dark:border-slate-600/50">
                              <button
                                  onClick={() => setEditorTab('source')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                      editorTab === 'source'
                                          ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                  }`}
                              >
                                  <FileCode className="w-3.5 h-3.5" />
                                  Source
                              </button>
                              <button
                                  onClick={() => setEditorTab('preview')}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                      editorTab === 'preview'
                                          ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                  }`}
                              >
                                  {answerFile ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  {answerFile ? "Original" : "Preview"}
                              </button>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {latexSource && (
                          <>
                            <button 
                              onClick={handleDownloadTex}
                              className="text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md font-medium"
                              title="Download .tex file"
                            >
                              <Download className="w-3 h-3" /> Source
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>
                            <button 
                                onClick={handleClear}
                                className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <Eraser className="w-3 h-3" /> Clear
                            </button>
                          </>
                        )}
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden relative">
                      {editorTab === 'source' ? (
                          <div className="h-full">
                               <LatexEditor 
                                 value={latexSource}
                                 onChange={setLatexSource}
                               />
                               {!latexSource && (
                                 <div className="absolute top-32 left-8 text-slate-300 dark:text-slate-600 pointer-events-none text-sm font-mono italic">
                                   % Upload a file or type your LaTeX code here...
                                 </div>
                               )}
                          </div>
                      ) : (
                          <div className="h-full overflow-hidden flex flex-col bg-white dark:bg-slate-800">
                               {answerFile ? (
                                   <div className="flex-1 relative w-full h-full p-4 overflow-auto flex items-center justify-center bg-slate-100 dark:bg-slate-900/50">
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-800/80 text-white text-[10px] uppercase font-bold tracking-wide px-3 py-1 rounded-full pointer-events-none z-10 backdrop-blur-sm shadow-sm">
                                            Viewing Original Upload
                                        </div>
                                        
                                        {answerFile.mimeType === 'application/pdf' ? (
                                            pdfUrl ? (
                                              <object
                                                  data={pdfUrl}
                                                  type="application/pdf"
                                                  className="w-full h-full rounded-lg shadow-sm bg-white"
                                              >
                                                   <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                                                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                                                        <p className="mb-3 text-sm font-medium">Preview not supported in this view.</p>
                                                        <a 
                                                          href={pdfUrl} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                                                        >
                                                           <ExternalLink className="w-4 h-4" /> Open PDF
                                                        </a>
                                                    </div>
                                              </object>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                                  <p className="mb-2">Preview not available for this PDF.</p>
                                              </div>
                                            )
                                        ) : (
                                            <img
                                                src={`data:${answerFile.mimeType};base64,${answerFile.data}`}
                                                alt="Original Answer"
                                                className="max-w-full max-h-full object-contain rounded-lg shadow-md bg-white dark:bg-slate-800"
                                            />
                                        )}
                                   </div>
                               ) : (
                                   <div className="h-full overflow-y-auto custom-scrollbar">
                                        <LatexPreview latex={latexSource} />
                                   </div>
                               )}
                          </div>
                      )}
                  </div>
              </div>
            </div>

            {/* Right Column: Grading Panel (Sticky) */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                  <GradingPanel 
                      result={gradingResult} 
                      isLoading={processing.isGrading}
                      isStale={latexSource !== debouncedLatex && latexSource.length > 0} 
                  />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}