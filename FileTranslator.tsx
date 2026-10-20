import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  FileCheck2,
  BookOpen,
  Layers,
  FileDown,
  Loader2,
  CheckCircle2,
  X,
  ArrowRight,
  BookMarked,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { User, TranslationRecord } from '../types';
import { saveTranslationRecord } from '../services/firebase';
import { soundFx } from '../utils/sound';
import {
  extractDocumentContent,
  chunkText,
  splitInto20PageSegments,
  DocumentSegment,
} from '../utils/fileExtractor';

interface FileTranslatorProps {
  currentUser: User;
  onOpenBuyTime: () => void;
  onOpenLargeDocStudio: (data: {
    fileName: string;
    originalText: string;
    charCount: number;
    segments: DocumentSegment[];
  }) => void;
}

export const FileTranslator: React.FC<FileTranslatorProps> = ({
  currentUser,
  onOpenBuyTime,
  onOpenLargeDocStudio,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [charCount, setCharCount] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState('');

  // 20+ Pages Large Document Notification Modal state
  const [showLargeDocModal, setShowLargeDocModal] = useState(false);
  const [largeDocDetails, setLargeDocDetails] = useState<{
    fileName: string;
    originalText: string;
    charCount: number;
    segments: DocumentSegment[];
  } | null>(null);

  // Translation states
  const [translating, setTranslating] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [translatedResult, setTranslatedResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'standard' | 'formal' | 'literary'>('formal');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process selected file with robust extraction
  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setTranslatedResult('');
    setExtracting(true);
    setExtractMsg('ဖိုင်ကို စတင်စစ်ဆေးနေပါသည်...');

    try {
      const extracted = await extractDocumentContent(selectedFile, (msg) => {
        setExtractMsg(msg);
      });

      setExtractedText(extracted.text);
      setCharCount(extracted.charCount);
      setPageCount(extracted.pageCount || 0);
      setFileBase64(extracted.fileBase64 || null);

      // Play upload complete chime sound
      soundFx.playUploadComplete();

      // Check if file is > 18,000 characters or > 20 pages
      if (extracted.charCount > 18000 || (extracted.pageCount && extracted.pageCount > 20)) {
        const segments = splitInto20PageSegments(extracted.text, extracted.pageCount);
        setLargeDocDetails({
          fileName: selectedFile.name,
          originalText: extracted.text,
          charCount: extracted.charCount,
          segments,
        });
        setShowLargeDocModal(true);
      }
    } catch (err: any) {
      console.error('File extraction failed:', err);
      setError(`ဖိုင်ဖတ်ရှုရာတွင် ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့သည်: ${err.message || 'မသိရှိရသေးသော အမှား'}`);
    } finally {
      setExtracting(false);
      setExtractMsg('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Reset file state
  const handleClear = () => {
    setFile(null);
    setFileBase64(null);
    setExtractedText('');
    setTranslatedResult('');
    setCharCount(0);
    setPageCount(0);
    setError(null);
    setProgressPercent(0);
    setShowLargeDocModal(false);
    setLargeDocDetails(null);
  };

  // Sample Documents for immediate test
  const loadSampleDoc = (type: 'contract' | 'tech' | 'story' | 'largeBook') => {
    let title = '';
    let content = '';

    if (type === 'contract') {
      title = 'Sample_Service_Agreement.docx';
      content = `SERVICE AND COOPERATION AGREEMENT

1. PURPOSE OF AGREEMENT
This Agreement is entered into by and between the Service Provider and the Client for the provision of professional translation and document processing services.

2. RESPONSIBILITIES AND DELIVERABLES
The Service Provider agrees to translate, format, and deliver all requested files within the agreed timeline with maximum accuracy and linguistic quality.

3. CONFIDENTIALITY AND DATA PROTECTION
All materials, documents, and business information provided by the Client shall remain strictly confidential and shall not be disclosed to any third party.

4. PAYMENT AND COIN SETTLEMENT
Services rendered shall be settled using the official platform coins as agreed in the subscription terms.`;
    } else if (type === 'tech') {
      title = 'Artificial_Intelligence_Overview.pdf';
      content = `ARTIFICIAL INTELLIGENCE AND MODERN TECHNOLOGY

Section 1: The Evolution of Machine Learning
Artificial intelligence (AI) has transformed how modern society processes documents, communicates across languages, and accesses knowledge worldwide.
Machine learning algorithms and large language models (LLMs) analyze syntax, context, and semantic meaning to provide fluent, natural translations.
With modern natural language processing, complex technical manuals, medical journals, and legal files can be translated into Myanmar language accurately while preserving formatting and technical clarity.`;
    } else if (type === 'story') {
      title = 'Literature_and_Life_Essay.docx';
      content = `THE VALUE OF READING AND LIFELONG LEARNING

Reading is the cornerstone of human wisdom and personal growth. Books and written documents preserve the heritage of generations, allowing us to learn from the past and innovate for the future.
Through literature and knowledge exchange across diverse languages, communities foster deeper understanding, compassion, and progress.`;
    } else {
      // 20+ Pages / 25,000+ characters sample book to test the exact 20-page chunking studio!
      title = 'Complete_Business_Management_Handbook.pdf';
      const chapters = [];
      for (let ch = 1; ch <= 12; ch++) {
        chapters.push(`CHAPTER ${ch}: STRATEGIC ORGANIZATIONAL LEADERSHIP AND GLOBAL TRADE

Section 1: Principles of Modern Corporate Governance
Effective leadership in modern international enterprise requires an in-depth understanding of corporate governance, organizational design, financial risk controls, and supply chain integrity. Decision-makers must formulate adaptable strategies capable of navigating fluctuating economic cycles while maintaining operational stability.

Section 2: Digital Transformation and Automated Systems
Companies investing in artificial intelligence, digital workflow automation, and localized linguistic models achieve substantial productivity gains. Translating foreign technical materials, operating manuals, and legal contracts into localized vernaculars such as Myanmar language empowers workforce development and accelerates technological adoption across Southeast Asian markets.

Section 3: Talent Development and Human Resource Sustainability
Nurturing human capital through continuous professional training and technical education ensures long-term institutional resilience. Cross-cultural collaboration thrives when documentation, corporate policies, and compliance procedures are accessible in native languages.`);
      }
      content = chapters.join('\n\n' + '='.repeat(60) + '\n\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const sampleFile = new File([blob], title, { type: 'text/plain' });
    setFile(sampleFile);
    setExtractedText(content);
    setCharCount(content.length);
    setPageCount(Math.ceil(content.length / 900));
    setFileBase64(btoa(unescape(encodeURIComponent(content))));
    setTranslatedResult('');
    setError(null);

    // Play upload chime sound
    soundFx.playUploadComplete();

    // If large book sample, trigger notification immediately
    if (content.length > 18000) {
      const segments = splitInto20PageSegments(content, Math.ceil(content.length / 900));
      setLargeDocDetails({
        fileName: title,
        originalText: content,
        charCount: content.length,
        segments,
      });
      setShowLargeDocModal(true);
    }
  };

  // Perform translation
  const handleTranslate = async () => {
    if (!file && !extractedText.trim()) {
      setError('ကျေးဇူးပြု၍ ဘာသာပြန်လိုသော PDF သို့မဟုတ် Word ဖိုင်ကို Upload တင်ပါ သို့မဟုတ် စာသားရိုက်ထည့်ပါ။');
      return;
    }

    if (currentUser.remainingSeconds <= 0) {
      setError('သင်၏ App အသုံးပြုချိန် ကုန်ဆုံးနေပါသည်။ Coin ဖြင့် အချိန်အရင်ဝယ်ယူပါ။');
      onOpenBuyTime();
      return;
    }

    // CHECK IF DOCUMENT IS > 18,000 CHARACTERS OR > 20 PAGES
    if (charCount > 18000 || pageCount > 20) {
      const segments = splitInto20PageSegments(extractedText, pageCount);
      setLargeDocDetails({
        fileName: file?.name || 'Large Document',
        originalText: extractedText,
        charCount,
        segments,
      });
      setShowLargeDocModal(true);
      return;
    }

    setTranslating(true);
    setError(null);
    setTranslatedResult('');
    setProgressPercent(30);
    setProgressStatus('Gemini AI မှ မြန်မာစာသို့ ကျွမ်းကျင်စွာ ပြန်ဆိုနေပါသည်...');

    const customInstructions =
      tone === 'formal'
        ? 'Use formal, professional, and grammatically precise Myanmar prose (ရုံးသုံး/စာပေစကားပြေ).'
        : tone === 'literary'
        ? 'Use rich, elegant, and poetic literary Myanmar phrasing.'
        : 'Use clear, direct, and conversational Myanmar language.';

    try {
      const textToTranslate = extractedText.trim();

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          fileBase64: fileBase64 || undefined,
          mimeType: file?.type || 'text/plain',
          filename: file?.name || 'document',
          customInstructions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ဘာသာပြန်ဆိုရာတွင် ချို့ယွင်းချက် ဖြစ်ပေါ်ခဲ့ပါသည်။');
      }

      setProgressPercent(100);
      setTranslatedResult(data.translatedText);
      setProgressStatus('အောင်မြင်စွာ ဘာသာပြန်ပြီးပါပြီ!');

      // Play translation complete notification sound
      soundFx.playTranslationComplete();

      // Save translation record under small documents category
      saveTranslationRecord({
        id: `TR-${Date.now()}`,
        userId: currentUser.id,
        filename: file?.name || 'Document',
        fileType: file?.type || 'document',
        docCategory: 'small',
        charCount: data.translatedText.length,
        pageCount: pageCount || Math.ceil(data.translatedText.length / 900) || 1,
        translatedAt: new Date().toISOString(),
        originalTextPreview: textToTranslate.slice(0, 150),
        translatedText: data.translatedText,
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || 'AI ဘာသာပြန်ခြင်း မအောင်မြင်ပါ။ စက္ကန့်အနည်းငယ်အကြာတွင် ထပ်မံကြိုးစားပါ။');
    } finally {
      setTranslating(false);
    }
  };

  // Multi-page PDF Download
  const handleDownloadPdf = () => {
    if (!translatedResult) return;
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const maxLineWidth = pageWidth - margin * 2;

      doc.setFontSize(16);
      doc.text('SarPay AI - Myanmar Translation Document', margin, 20);

      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(
        `Original: ${file?.name || 'document'} | Date: ${new Date().toLocaleDateString()} | Length: ${translatedResult.length} chars`,
        margin,
        27
      );
      doc.setDrawColor(200);
      doc.line(margin, 30, pageWidth - margin, 30);

      doc.setFontSize(11);
      doc.setTextColor(30);

      const splitLines = doc.splitTextToSize(translatedResult, maxLineWidth);
      let cursorY = 38;
      const lineHeight = 6.5;

      for (let i = 0; i < splitLines.length; i++) {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(splitLines[i], margin, cursorY);
        cursorY += lineHeight;
      }

      const downloadName = `${(file?.name || 'translated_document').replace(/\.[^/.]+$/, '')}_Myanmar.pdf`;
      doc.save(downloadName);
    } catch (e) {
      console.error(e);
      handleDownloadText();
    }
  };

  // Word / Text Download with UTF-8 BOM
  const handleDownloadText = () => {
    if (!translatedResult) return;
    const blob = new Blob(['\uFEFF' + translatedResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(file?.name || 'translated_document').replace(/\.[^/.]+$/, '')}_Myanmar.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!translatedResult) return;
    navigator.clipboard.writeText(translatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 20+ PAGES LARGE DOCUMENT NOTIFICATION MODAL (AS REQUESTED) */}
      {showLargeDocModal && largeDocDetails && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden">
            {/* Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <BookMarked className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    Large Document Notice
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    စာမျက်နှာ ၂၀ (စာလုံးရေ ၁၈,၀၀၀) ထက် ပိုမိုများပြားသော ဖိုင်ဖြစ်ပါသည်
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowLargeDocModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <p>
                သင်တင်ထားသော <strong className="text-white">{largeDocDetails.fileName}</strong> တွင်
                စာလုံးရေ{' '}
                <strong className="text-amber-400 font-mono">
                  {largeDocDetails.charCount.toLocaleString()}
                </strong>{' '}
                စာလုံး (စာမျက်နှာ {Math.ceil(largeDocDetails.charCount / 900)} မျက်နှာခန့်) ပါဝင်နေပါသည်။
              </p>

              <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>စနစ်တကျ ဘာသာပြန်ပေးမည့် အစီအစဉ်:</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  <li>
                    စာရွက်စာတမ်းအားလုံးကို <strong>စာမျက်နှာ ၂၀ စီ (အပိုင်း {largeDocDetails.segments.length} ပိုင်း)</strong> ခွဲခြားပေးမည်ဖြစ်ပါသည်။
                  </li>
                  <li>
                    သီးသန့် <strong>Large Document Studio စာမျက်နှာသစ်</strong> တွင် အပိုင်းတစ်ခုချင်းစီကို အဆင့်ဆင့် ဘာသာပြန်ပေးပါမည်။
                  </li>
                  <li>
                    အပိုင်းအားလုံး ဘာသာပြန်ပြီးပါက စာရွက်စာတမ်းတစ်ခုလုံးကို <strong>ပြန်လည်ပေါင်းစပ်ပြီး PDF သို့မဟုတ် Word ဖိုင်အဖြစ် ဒေါင်းလုဒ်ဆွဲနိုင်မည်ဖြစ်ပါသည်</strong>။
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLargeDocModal(false)}
                className="w-1/3 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs sm:text-sm font-semibold transition-colors"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLargeDocModal(false);
                  onOpenLargeDocStudio(largeDocDetails);
                }}
                className="w-2/3 py-3 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>သဘောတူပါသည်၊ စာမျက်နှာသစ်တွင် စတင်မည်</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Powered Myanmar Document Translation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            PDF & Word ဖိုင်များကို <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-300">
              မြန်မာစာသို့ AI ဖြင့် ဘာသာပြန်ခြင်း
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            စာမျက်နှာ ၂၀ ကျော် (စာလုံးရေ ၁၈,၀၀၀ ကျော်) ဖိုင်ကြီးများအတွက် စာမျက်နှာ ၂၀ စီ အပိုင်းခွဲ၍ သီးသန့် Studio စာမျက်နှာတွင် စနစ်တကျ ပြန်ဆိုကာ ပြန်လည်ပေါင်းစပ် ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်။
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-red-300 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <span className="font-semibold text-white">သတိပေးချက်:</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Grid: Upload & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Original Content */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ဖိုင် Upload တင်ရန် နေရာ</h3>
                  <p className="text-[11px] text-slate-400">PDF, Word (.docx), TXT ဖိုင်များ</p>
                </div>
              </div>
              {file && (
                <button
                  onClick={handleClear}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ရှင်းလင်းမည်
                </button>
              )}
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !extracting && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                extracting
                  ? 'border-amber-500/50 bg-amber-500/5 cursor-wait'
                  : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-indigo-500/60 bg-slate-800/40 hover:bg-slate-800/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.rtf,.md"
                onChange={handleFileChange}
                className="hidden"
                disabled={extracting}
              />

              {extracting ? (
                <div className="py-4 space-y-3">
                  <Loader2 className="w-9 h-9 mx-auto text-amber-400 animate-spin" />
                  <div className="text-sm font-bold text-white">{extractMsg}</div>
                  <p className="text-xs text-slate-400">ဖိုင်ကြီးမားပါက စက္ကန့်အနည်းငယ် ကြာနိုင်ပါသည်...</p>
                </div>
              ) : file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-white text-sm">{file.name}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-center gap-3">
                    <span>အရွယ်အစား: {(file.size / 1024).toFixed(1)} KB</span>
                    {pageCount > 0 && <span>စာမျက်နှာ: {pageCount} မျက်နှာ</span>}
                    <span>စာလုံး: {charCount.toLocaleString()} လုံး</span>
                  </div>
                  {charCount > 18000 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      ★ စာမျက်နှာ ၂၀ ကျော် ဖိုင် (Studio စာမျက်နှာသစ် အသုံးပြုနိုင်သည်)
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    PDF သို့မဟုတ် Word ဖိုင်ကို ဤနေရာတွင် ဆွဲထည့်ပါ
                  </div>
                  <p className="text-xs text-slate-400">သို့မဟုတ် ဖုန်း/ကွန်ပျူတာထဲမှ ဖိုင်ရွေးချယ်ရန် နှိပ်ပါ</p>
                  <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">.PDF</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">.DOCX</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">.TXT</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Selector */}
            <div className="pt-1">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                စမ်းသပ်ရန် နမူနာဖိုင်များ:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSampleDoc('contract')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  စာချုပ်နမူနာ
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleDoc('tech')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  AI နည်းပညာ ဆောင်းပါး
                </button>
                {/* 20+ Pages Book Sample Button */}
                <button
                  type="button"
                  onClick={() => loadSampleDoc('largeBook')}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors flex items-center gap-1.5"
                >
                  <BookMarked className="w-3.5 h-3.5 text-amber-400" />
                  စာမျက်နှာ ၂၀ ကျော် စာအုပ်နမူနာ (25,000 Chars)
                </button>
              </div>
            </div>

            {/* Original Text Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  မူရင်းဖိုင်မှ စာသား (Extracted Text)
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {charCount.toLocaleString()} စာလုံး
                </span>
              </div>
              <textarea
                rows={6}
                value={extractedText}
                onChange={(e) => {
                  setExtractedText(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                placeholder="ဖိုင်တင်ပြီးပါက ထုတ်ယူရရှိသော စာသားများကို ဤနေရာတွင် ကြည့်ရှုတည်းဖြတ်နိုင်ပါသည်..."
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-sans leading-relaxed"
              />
            </div>

            {/* Translation Tone */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">မြန်မာစာ စတိုင်လ်:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTone('formal')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    tone === 'formal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ရုံးသုံး / ပုံမှန်
                </button>
                <button
                  type="button"
                  onClick={() => setTone('literary')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    tone === 'literary' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  စာပေဆန်သော
                </button>
                <button
                  type="button"
                  onClick={() => setTone('standard')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    tone === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ရိုးရှင်းသော
                </button>
              </div>
            </div>

            {/* BIG ACTION BUTTON */}
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating || extracting || (!file && !extractedText.trim())}
              className={`w-full py-4 px-6 rounded-2xl text-sm sm:text-base font-extrabold shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                translating || extracting
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : !file && !extractedText.trim()
                  ? 'bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01]'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${translating ? 'animate-spin text-amber-400' : ''}`} />
              <span>
                {translating
                  ? 'မြန်မာစာသို့ AI ဖြင့် ဘာသာပြန်နေပါသည်...'
                  : charCount > 18000
                  ? 'စာမျက်နှာ ၂၀ စီ အပိုင်းခွဲ၍ Studio တွင် စတင်မည် &rarr;'
                  : 'Upload တင်ပေးတဲ့ file ကို Myanmar စာ translation လုပ်ပေးရန်'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Translated Result */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col h-full min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">မြန်မာစာ ဘာသာပြန်ရလဒ်</h3>
                  <p className="text-[11px] text-slate-400">
                    {translatedResult
                      ? `${translatedResult.length.toLocaleString()} စာလုံး ပြန်ဆိုပြီးပါပြီ`
                      : 'ဘာသာပြန်ထားသော စာသားကို ဤနေရာတွင် ပြသပါမည်'}
                  </p>
                </div>
              </div>

              {translatedResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="စာသားကူးယူရန်"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Translation Display */}
            <div className="flex-1 my-4 flex flex-col justify-center">
              {translating ? (
                <div className="py-12 px-4 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-amber-400 animate-pulse" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="text-sm font-bold text-white">{progressStatus}</div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : translatedResult ? (
                <div className="h-full flex flex-col">
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex-1 overflow-y-auto max-h-[460px] text-slate-100 font-sans text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-amber-500 selection:text-slate-950">
                    {translatedResult}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-3 text-slate-500">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-600">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-medium text-slate-400">
                    ဘာသာပြန်ထားသော စာသားမရှိသေးပါ
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    ဘယ်ဘက်တွင် PDF သို့မဟုတ် Word ဖိုင်ကို Upload တင်ပြီး အဝါရောင် Button ကိုနှိပ်၍ စတင်ပါ
                  </p>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            {translatedResult && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  ဘာသာပြန်ပြီး ဖိုင်ကို ဒေါင်းလုဒ်ဆွဲရန်:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>PDF ဖိုင်အဖြစ် Download ဆွဲမည်</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadText}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4 text-sky-400" />
                    <span>Word/Text အဖြစ် Download ဆွဲမည်</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
