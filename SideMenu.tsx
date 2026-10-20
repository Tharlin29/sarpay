import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Copy,
  Check,
  Coins,
  Send,
  Clock,
  Smartphone,
  LogOut,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { User } from '../types';

interface SideMenuProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onOpenTransfer: () => void;
  onOpenBuyTime: () => void;
  onOpenTopup: () => void;
  onLogout: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  currentUser,
  isOpen,
  onClose,
  onOpenTransfer,
  onOpenBuyTime,
  onOpenTopup,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyUserId = () => {
    navigator.clipboard.writeText(currentUser.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    if (secs <= 0) return 'အချိန်ကုန်ဆုံး';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-slide-left">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold text-xl">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {currentUser.username}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Account (အသုံးပြုဆဲ)
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. User ID Card */}
            <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium">User ID (အကောင့်နံပါတ်)</span>
                <span className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded text-slate-300">
                  Firebase Sync
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-700/60">
                <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                  {currentUser.id}
                </span>
                <button
                  onClick={copyUserId}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">ကူးပြီးပါပြီ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                သူငယ်ချင်းများထံမှ Coin လက်ခံလိုပါက ဤ User ID ကို ပေးပို့နိုင်ပါသည်
              </p>
            </div>

            {/* 2. User Coin Balance Card */}
            <div className="p-4 bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-slate-900 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">User Coin Balance (လက်ကျန် Coin)</span>
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {currentUser.coins.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-amber-200/80">Coins</span>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenTopup();
                  }}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Coins className="w-3.5 h-3.5" />
                  + Coin ဖြည့်မည်
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenBuyTime();
                  }}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  အချိန်ဝယ်မည်
                </button>
              </div>
            </div>

            {/* 3. User Coin Transfer Action */}
            <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">User Coin Transfer</h4>
                    <p className="text-[11px] text-slate-400">အခြား User ထံသို့ Coin လွှဲပြောင်းရန်</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                တခြား မိတ်ဆွေ အကောင့်များ၏ User ID ကို ထည့်သွင်းပြီး မိမိ၏ Coin များကို တိုက်ရိုက် လွှဲပြောင်းပေးနိုင်ပါသည်။
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenTransfer();
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Coin လွှဲပြောင်းသည့် စနစ်ဖွင့်မည် &rarr;
              </button>
            </div>

            {/* 4. Time Remaining & Usage Timer */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  App အသုံးပြုခွင့် သက်တမ်း
                </span>
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    currentUser.remainingSeconds > 300
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {formatTime(currentUser.remainingSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                အချိန်ကုန်သွားပါက Apk/App သည် အလုပ်လုပ်တော့မည်မဟုတ်ပါ။ Coin ဖြင့် အချိန်ထပ်ဖြည့်နိုင်ပါသည်။
              </p>
            </div>

            {/* 5. Device & Registration Info */}
            <div className="p-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  ချိတ်ဆက်ထားသော ဖုန်း (Device):
                </span>
                <span className="text-slate-200 font-medium">{currentUser.deviceLabel}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ဖုန်းနံပါတ်:</span>
                <span className="text-slate-200 font-mono">{currentUser.phone}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>စတင်ဖွင့်လှစ်သည့်ရက်:</span>
                <span className="text-slate-300">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Device Limit:</span>
                <span className="text-emerald-400 font-medium">၁ ဖုန်း ၁ အကောင့် သတ်မှတ်ထားသည်</span>
              </div>
            </div>
          </div>

          {/* Footer / Logout */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/60">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              အကောင့်မှ ထွက်မည် (Log Out)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
