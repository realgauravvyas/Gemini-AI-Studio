import React, { useState, useRef } from 'react';
import { QuestionContext } from '../types';
import { Settings2, ScanLine, KeyRound, FileUp, Wand2, Eye, FileText, Trash2 } from 'lucide-react';
import { extractQuestionFromImage, transcribeSolutionImage, refineTextToLatex } from '../services/geminiService';
import { FormattedText } from './FormattedText';

interface QuestionSetupProps {
  question: QuestionContext;
  onUpdate: (q: QuestionContext) => void;
}

type Tab = 'problem' | 'solution';

export const QuestionSetup: React.FC<QuestionSetupProps> = ({ question, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('problem');
  const [isScanning, setIsScanning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  
  const questionInputRef = useRef<HTMLInputElement>(null);
  const solutionInputRef = useRef<HTMLInputElement>(null);

  const handleScanQuestion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert("Please select an image or PDF file.");
        return;
    }

    setIsScanning(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            // Update state with image immediately so user knows it's attached
            const updatedQuestion = { 
                ...question, 
                questionImage: { 
                    data: base64, 
                    mimeType: file.type,
                    fileName: file.name
                } 
            };
            
            // Extract details from the image using AI
            const extracted = await extractQuestionFromImage(base64, file.type);
            
            // Merge extracted text details
            onUpdate({ 
                ...updatedQuestion,
                title: extracted.title || updatedQuestion.title,
                description: extracted.description || updatedQuestion.description,
                totalMarks: extracted.totalMarks || updatedQuestion.totalMarks
            }); 
            
            setIsExpanded(true);
            setActiveTab('problem');
        };
        reader.readAsDataURL(file);
    } catch (err) {
        alert("Failed to extract question from file.");
    } finally {
        setIsScanning(false);
    }
  };

  const handleRemoveQuestionFile = () => {
      const { questionImage, ...rest } = question;
      onUpdate(rest);
  };

  const handleScanSolution = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert("Please select an image or PDF file.");
        return;
    }
    
    setIsScanning(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            const solutionText = await transcribeSolutionImage(base64, file.type);
            onUpdate({ ...question, idealSolution: solutionText });
            setIsExpanded(true);
            setActiveTab('solution');
        };
        reader.readAsDataURL(file);
    } catch (err) {
        alert("Failed to transcribe solution key.");
    } finally {
        setIsScanning(false);
    }
  };

  const handleMagicFormat = async (field: 'description' | 'solution') => {
    const text = field === 'description' ? question.description : question.idealSolution;
    if (!text || !text.trim()) return;

    setIsFormatting(true);
    try {
      const formatted = await refineTextToLatex(text);
      if (field === 'description') {
        onUpdate({ ...question, description: formatted });
      } else {
        onUpdate({ ...question, idealSolution: formatted });
      }
    } catch (err) {
      console.error("Format failed", err);
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 transition-colors duration-300">
      <div 
        className="px-5 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">Instructor's Configuration</h2>
        </div>
        <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            {isExpanded ? "Hide" : "Edit"}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-5">
                <button 
                    onClick={() => setActiveTab('problem')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'problem' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Problem Details
                </button>
                <button 
                    onClick={() => setActiveTab('solution')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'solution' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Ideal Solution (Key)
                </button>
            </div>

            {activeTab === 'problem' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                     <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                           {question.questionImage ? (
                               <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                   <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                   <span className="font-medium text-indigo-700 dark:text-indigo-300 truncate max-w-[200px]" title={question.questionImage.fileName}>
                                       {question.questionImage.fileName || "Question Paper Attached"}
                                   </span>
                                   <button onClick={handleRemoveQuestionFile} className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-red-500 transition-colors" title="Remove file">
                                       <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                               </div>
                           ) : (
                               <span>Upload a question paper to auto-extract text and use diagrams for grading.</span>
                           )}
                        </div>
                        
                        <div className="flex">
                            <input 
                                type="file" 
                                ref={questionInputRef} 
                                className="hidden" 
                                accept="image/*,application/pdf" 
                                onChange={handleScanQuestion}
                            />
                            <button 
                                onClick={() => questionInputRef.current?.click()}
                                disabled={isScanning}
                                className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
                            >
                                {isScanning ? (
                                    <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <ScanLine className="w-4 h-4" />
                                )}
                                {isScanning ? "Processing..." : "Upload Question Paper (PDF/Image)"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Question Title</label>
                            <input 
                                type="text"
                                value={question.title}
                                onChange={(e) => onUpdate({...question, title: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm placeholder-slate-400 dark:placeholder-slate-500"
                                placeholder="e.g. Calculus Final - Problem 3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Max Marks</label>
                            <input 
                                type="number"
                                value={question.totalMarks}
                                onChange={(e) => onUpdate({...question, totalMarks: Number(e.target.value)})}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Question Description</label>
                            <button
                                onClick={() => handleMagicFormat('description')}
                                disabled={isFormatting || !question.description}
                                className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                                title="Auto-format plain math to LaTeX"
                            >
                                <Wand2 className={`w-3 h-3 ${isFormatting ? 'animate-spin' : ''}`} />
                                {isFormatting ? 'Formatting...' : 'Format Math'}
                            </button>
                        </div>
                        <textarea 
                            value={question.description}
                            onChange={(e) => onUpdate({...question, description: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm h-24 custom-scrollbar resize-none placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Type plain text e.g., 'Solve 2x^2 + 4' and click Format Math..."
                        />
                        {/* Live Preview of formatted math in description */}
                        {question.description && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Preview
                                </span>
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                    <FormattedText text={question.description} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Provide the correct answer/key. This will be used as the ground truth for grading.
                        </p>
                        <div className="flex gap-2">
                             <input 
                                type="file" 
                                ref={solutionInputRef} 
                                className="hidden" 
                                accept="image/*,application/pdf" 
                                onChange={handleScanSolution}
                            />
                            <button 
                                onClick={() => solutionInputRef.current?.click()}
                                disabled={isScanning}
                                className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                                <KeyRound className="w-4 h-4" />
                                {isScanning ? "Processing..." : "Upload Key (PDF/Image)"}
                            </button>
                        </div>
                    </div>
                     <div>
                        <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ideal Solution</label>
                            <button
                                onClick={() => handleMagicFormat('solution')}
                                disabled={isFormatting || !question.idealSolution}
                                className="text-xs flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 disabled:opacity-50"
                                title="Auto-format plain math to LaTeX"
                            >
                                <Wand2 className={`w-3 h-3 ${isFormatting ? 'animate-spin' : ''}`} />
                                {isFormatting ? 'Formatting...' : 'Format Math'}
                            </button>
                        </div>
                        <textarea 
                            value={question.idealSolution || ''}
                            onChange={(e) => onUpdate({...question, idealSolution: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm h-48 custom-scrollbar resize-none placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                            placeholder="Type plain solution e.g. 'The integral is infty' and click Format Math..."
                        />
                         {/* Live Preview of formatted math in solution */}
                         {question.idealSolution && (
                            <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Preview
                                </span>
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                    <FormattedText text={question.idealSolution} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};