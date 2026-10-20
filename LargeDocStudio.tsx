import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Download,
  Copy,
  Check,
  Clock,
  Coins,
  FileText,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  FileDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { User, TranslationRecord, LargeDocSegmentRecord } from '../types';
import { DocumentSegment } from '../utils/fileExtractor';
import { saveTranslationRecord } from '../services/firebase';
import { soundFx } from '../utils/sound';

interface LargeDocStudioProps {
  currentUser: User;
  fileName: string;
  originalText: string;
  charCount: number;
  segments: DocumentSegment[];
  onBack: () => void;
  onOpenBuyTime: () => void;
}

interface SegmentStatus {
  partIndex: number;
  status: 'pending' | 'translating' | 'completed' | 'error';
  translatedText?: string;
  error?: string;
  progress: number;
}

export const LargeDocStudio: React.FC<LargeDocStudioProps> = ({
  currentUser,
  fileName,
  originalText,
  charCount,
  segments,
  onBack,
  onOpenBuyTime,
}) => {
  const [segmentStatuses, setSegmentStatuses] = useState<SegmentStatus[]>(() =>
    segments.map((seg) => ({
      partIndex: seg.partIndex,
      status: 'pending',
      progress: 0,
    }))
  );

  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [tone, setTone] = useState<'formal' | 'literary' | 'standard'>('formal');
  const [copied, setCopied] = useState(false);
  const [copiedPartIndex, setCopiedPartIndex] = useState<number | null>(null);
  const [recordId] = useState<string>(() => `TR-LARGE-${Date.now()}`);
  const [expandedParts, setExpandedParts] = useState<{ [key: number]: boolean }>({ 1: true });

  const toggleExpand = (partIndex: number) => {
    setExpandedParts((prev) => ({ ...prev, [partIndex]: !prev[partIndex] }));
  };

  const handleCopySegment = (partIndex: number, textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPartIndex(partIndex);
    setTimeout(() => {
      setCopiedPartIndex((prev) => (prev === partIndex ? null : prev));
    }, 2000);
  };

  const saveLargeDocProgress = (statuses: SegmentStatus[]) => {
    const segmentRecords: LargeDocSegmentRecord[] = segments.map((seg) => {
      const s = statuses.find((item) => item.partIndex === seg.partIndex);
      return {
        partIndex: seg.partIndex,
        title: seg.title,
        startPage: seg.startPage,
        endPage: seg.endPage,
        translatedText: s?.translatedText || '',
        charCount: s?.translatedText?.length || 0,
      };
    });

    const fullTranslation = segmentRecords
      .map((seg) => (seg.translatedText ? `=== ${seg.title} ===\n\n${seg.translatedText}` : ''))
      .filter(Boolean)
      .join('\n\n\n');

    saveTranslationRecord({
      id: recordId,
      userId: currentUser.id,
      filename: fileName,
      fileType: 'large-document',
      docCategory: 'large',
      charCount: fullTranslation.length,
      pageCount: segments.length * 20,
      translatedAt: new Date().toISOString(),
      originalTextPreview: originalText.slice(0, 200),
      translatedText: fullTranslation,
      segments: segmentRecords,
    });
  };

  // Check how many parts are completed
  const completedCount = segmentStatuses.filter((s) => s.status === 'completed').length;
  const isAllCompleted = completedCount === segments.length && segments.length > 0;
  const overallPercent = Math.round((completedCount / segments.length) * 100);

  // Combine all completed translations into single document
  const combinedTranslation = segments
    .map((seg) => {
      const s = segmentStatuses.find((item) => item.partIndex === seg.partIndex);
      if (s?.translatedText) {
        return `=== ${seg.title} ===\n\n${s.translatedText}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n\n');

  // Translate a single segment
  const translateSingleSegment = async (partIndex: number): Promise<boolean> => {
    const seg = segments.find((s) => s.partIndex === partIndex);
    if (!seg) return false;

    if (currentUser.remainingSeconds <= 0) {
      alert('သင်၏ App အသုံးပြုချိန် ကုန်ဆုံးနေပါသည်။ Coin ဖြင့် အချိန်အရင်ဖြည့်ပါ။');
      onOpenBuyTime();
      return false;
    }

    setSegmentStatuses((prev) =>
      prev.map((s) =>
        s.partIndex === partIndex ? { ...s, status: 'translating', progress: 30 } : s
      )
    );

    const customInstructions =
      tone === 'formal'
        ? 'Use formal, dignified, and grammatically precise Myanmar prose (ရုံးသုံး/စာပေစကားပြေ).'
        : tone === 'literary'
        ? 'Use rich, poetic, and classic literary Myanmar phrasing.'
        : 'Use direct, natural, and conversational Myanmar language.';

    try {
      const res = await fetch('/api/translate-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkText: seg.text,
          chunkIndex: partIndex - 1,
          totalChunks: segments.length,
          customInstructions,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.translatedText) {
        throw new Error(data.error || 'အပိုင်း ဘာသာပြန်ခြင်း မအောင်မြင်ပါ။');
      }

      const updatedStatuses = segmentStatuses.map((s) =>
        s.partIndex === partIndex
          ? { ...s, status: 'completed' as const, translatedText: data.translatedText, progress: 100 }
          : s
      );
      setSegmentStatuses(updatedStatuses);

      // Play translation notification sound for this segment
      soundFx.playTranslationComplete();

      // Save large document progress into history
      saveLargeDocProgress(updatedStatuses);

      // Auto expand completed part
      setExpandedParts((prev) => ({ ...prev, [partIndex]: true }));
      return true;
    } catch (err: any) {
      setSegmentStatuses((prev) =>
        prev.map((s) =>
          s.partIndex === partIndex
            ? { ...s, status: 'error', error: err.message || 'Error occurred' }
            : s
        )
      );
      return false;
    }
  };

  // Start translating all 20-page segments in orderly succession
  const handleTranslateAll = async () => {
    setIsTranslatingAll(true);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const statusObj = segmentStatuses.find((s) => s.partIndex === seg.partIndex);

      if (statusObj?.status !== 'completed') {
        const ok = await translateSingleSegment(seg.partIndex);
        if (!ok) {
          setIsTranslatingAll(false);
          return;
        }
        // Small interval between large 20-page parts
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setIsTranslatingAll(false);

    // Confetti & notification chime on full completion!
    soundFx.playTranslationComplete();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });

    // Save final combined translation record with all segment records
    saveLargeDocProgress(segmentStatuses);
  };

  // Download entire combined document as PDF
  const handleDownloadCombinedPdf = () => {
    if (!combinedTranslation) return;
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

      // Cover / Header
      doc.setFontSize(18);
      doc.text('SarPay AI - Complete Myanmar Document Translation', margin, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Original File: ${fileName}`, margin, 28);
      doc.text(
        `Total Segments: ${segments.length} (20 pages each) | Date: ${new Date().toLocaleDateString()}`,
        margin,
        34
      );
      doc.setDrawColor(200);
      doc.line(margin, 38, pageWidth - margin, 38);

      doc.setFontSize(11);
      doc.setTextColor(30);

      const splitLines = doc.splitTextToSize(combinedTranslation, maxLineWidth);
      let cursorY = 46;
      const lineHeight = 6.5;

      for (let i = 0; i < splitLines.length; i++) {
        if (cursorY + lineHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(splitLines[i], margin, cursorY);
        cursorY += lineHeight;
      }

      const downloadName = `${fileName.replace(/\.[^/.]+$/, '')}_Complete_Myanmar.pdf`;
      doc.save(downloadName);
    } catch (e) {
      console.error(e);
      handleDownloadCombinedText();
    }
  };

  // Download combined text/word with UTF-8 BOM
  const handleDownloadCombinedText = () => {
    if (!combinedTranslation) return;
    const blob = new Blob(['\uFEFF' + combinedTranslation], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_Complete_Myanmar.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    if (!combinedTranslation) return;
    navigator.clipboard.writeText(combinedTranslation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Studio Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">မူလစာမျက်နှာသို့ ပြန်သွားမည်</span>
          </button>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm">
              စာ
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                Large Document Translation Studio
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  စာမျက်နှာ ၂၀ စီ ခွဲခြားထားသည်
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* User Balance & Time indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentUser.coins.toLocaleString()} Coins</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {Math.floor(currentUser.remainingSeconds / 3600)}h{' '}
              {Math.floor((currentUser.remainingSeconds % 3600) / 60)}m
            </span>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Document Overview Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold">
              <BookOpen className="w-4 h-4" />
              <span>စာမျက်နှာ ၂၀ (စာလုံးရေ ၁၈,၀၀၀) ထက်ပိုသော ဖိုင်ကြီး ဘာသာပြန်ခြင်း</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{fileName}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                စုစုပေါင်း: <strong className="text-amber-400 font-mono">{charCount.toLocaleString()}</strong> စာလုံး
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                ခွဲခြမ်းမှု: စာမျက်နှာ ၂၀ စီဖြင့် <strong className="text-white font-mono">{segments.length}</strong> ပိုင်း
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                ပြီးစီးမှု: <strong className="font-mono">{completedCount}</strong> / {segments.length} ပိုင်း
              </span>
            </div>
          </div>

          {/* Action Button & Tone */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={tone}
              onChange={(e: any) => setTone(e.target.value)}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="formal">ရုံးသုံး / ပုံမှန် မြန်မာစာ</option>
              <option value="literary">စာပေဆန်သော မြန်မာစကားပြေ</option>
              <option value="standard">ရိုးရှင်းသော မြန်မာစကားပြေ</option>
            </select>

            <button
              onClick={handleTranslateAll}
              disabled={isTranslatingAll || isAllCompleted}
              className={`py-3 px-6 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 ${
                isAllCompleted
                  ? 'bg-emerald-600 text-white cursor-default'
                  : isTranslatingAll
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
              }`}
            >
              {isAllCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>အပိုင်းအားလုံး ဘာသာပြန်ပြီးပါပြီ</span>
                </>
              ) : isTranslatingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>အစဉ်လိုက် ဘာသာပြန်နေသည်...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>အပိုင်းအားလုံး ဆက်တိုက် ဘာသာပြန်မည်</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">
              စုစုပေါင်း ဘာသာပြန်ပြီးစီးမှုနှုန်း:
            </span>
            <span className="font-bold text-amber-400 font-mono">{overallPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>

        {/* Segments Breakdown Cards (20 Pages Each) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              စာမျက်နှာ ၂၀ အပိုင်းလိုက် ခွဲခြားထားသော စာရင်းများ ({segments.length} Parts)
            </h3>
            <span className="text-xs text-slate-400">
              အပိုင်းတစ်ခုချင်းစီ သီးခြား ဘာသာပြန်နိုင်သလို အားလုံးကို ဆက်တိုက် ပြန်ဆိုနိုင်ပါသည်
            </span>
          </div>

          <div className="space-y-3">
            {segments.map((seg) => {
              const statusObj = segmentStatuses.find((s) => s.partIndex === seg.partIndex);
              const isExpanded = !!expandedParts[seg.partIndex];

              return (
                <div
                  key={seg.partIndex}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    statusObj?.status === 'completed'
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                      : statusObj?.status === 'translating'
                      ? 'bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  {/* Part Header Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          statusObj?.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : statusObj?.status === 'translating'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {statusObj?.status === 'completed' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : statusObj?.status === 'translating' ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          `#${seg.partIndex}`
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{seg.title}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              statusObj?.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : statusObj?.status === 'translating'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {statusObj?.status === 'completed'
                              ? 'ပြီးစီးပါပြီ (Done)'
                              : statusObj?.status === 'translating'
                              ? 'ဘာသာပြန်နေသည်...'
                              : 'စောင့်ဆိုင်းဆဲ (Pending)'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          စာလုံးရေ: {seg.charCount.toLocaleString()} စာလုံး
                        </span>
                      </div>
                    </div>

                    {/* Part Action Button */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Copy button for each 20-page segment */}
                      <button
                        onClick={() =>
                          handleCopySegment(
                            seg.partIndex,
                            statusObj?.translatedText || seg.text
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                          copiedPartIndex === seg.partIndex
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                        title={
                          statusObj?.translatedText
                            ? 'ဤအပိုင်း၏ ဘာသာပြန်စာသားကို ကူးယူမည်'
                            : 'ဤအပိုင်း၏ မူရင်းစာသားကို ကူးယူမည်'
                        }
                      >
                        {copiedPartIndex === seg.partIndex ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">ကူးပြီးပါပြီ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {statusObj?.status !== 'completed' && (
                        <button
                          onClick={() => translateSingleSegment(seg.partIndex)}
                          disabled={statusObj?.status === 'translating' || isTranslatingAll}
                          className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          {statusObj?.status === 'translating' ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>ပြန်ဆိုနေသည်...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>ဤအပိုင်းကို ပြန်မည်</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => toggleExpand(seg.partIndex)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title={isExpanded ? 'ခေါက်သိမ်းမည်' : 'ဖွင့်ကြည့်မည်'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Preview Area */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Original Excerpt */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400 block">
                            မူရင်း စာသား အစမ်းကြည့်ရှုမှု (Original Segment):
                          </span>
                          <button
                            onClick={() => handleCopySegment(seg.partIndex, seg.text)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy မူရင်း</span>
                          </button>
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                          {seg.text.slice(0, 1000)}...
                        </div>
                      </div>

                      {/* Right: Translated Myanmar Result */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-amber-400 block">
                            မြန်မာစာ ဘာသာပြန်ရလဒ် (Myanmar Translated Part):
                          </span>
                          {statusObj?.translatedText && (
                            <button
                              onClick={() => handleCopySegment(seg.partIndex, statusObj.translatedText!)}
                              className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
                            >
                              {copiedPartIndex === seg.partIndex ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">ကူးပြီးပါပြီ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-amber-400" />
                                  <span>မြန်မာစာ Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
                          {statusObj?.translatedText ? (
                            statusObj.translatedText
                          ) : (
                            <span className="text-slate-500 italic">
                              ဤအပိုင်းကို ဘာသာမပြန်ရသေးပါ။ 'ဤအပိုင်းကို ပြန်မည်' သို့မဟုတ် 'အားလုံး ပြန်မည်' ကို နှိပ်ပါ။
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Combined Document Reassembly & Download Section */}
        {combinedTranslation && (
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    အပိုင်းများ အားလုံးကို ပြန်လည်ပေါင်းစပ်ထားသော စာတမ်းအပြည့်အစုံ
                  </h3>
                  <p className="text-xs text-slate-400">
                    စာမျက်နှာ ၂၀ စီ ဘာသာပြန်ဆိုထားသော အပိုင်းအားလုံးကို စာအုပ်/စာတမ်း တစ်ခုတည်းအဖြစ် ပေါင်းစပ်ပြီးပါပြီ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'ကူးပြီးပါပြီ' : 'စာသားအားလုံး Copy'}</span>
                </button>
              </div>
            </div>

            {/* Combined View */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl max-h-96 overflow-y-auto text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans selection:bg-amber-500 selection:text-slate-950">
              {combinedTranslation}
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownloadCombinedPdf}
                className="w-full sm:w-1/2 py-3.5 px-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>ပေါင်းစပ်ထားသော စာတမ်း တစ်ခုလုံးကို PDF အဖြစ် ဒေါင်းလုဒ်ဆွဲမည်</span>
              </button>

              <button
                onClick={handleDownloadCombinedText}
                className="w-full sm:w-1/2 py-3.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4 text-sky-400" />
                <span>Word / Text (.docx/.txt) အဖြစ် ဒေါင်းလုဒ်ဆွဲမည်</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
