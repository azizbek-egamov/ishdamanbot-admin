import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { formatUZS } from '../utils/formatters';

// Web Audio API Sound Generator for 0-latency physical clicks
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick(frequency = 750) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  playWinnerFanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.12);
        osc.stop(this.ctx.currentTime + idx * 0.12 + 0.7);
      });
    } catch {
      // ignore
    }
  }
}

const sfx = new SoundFX();

export default function AdminRandomizerModal({ contest, onClose, onWinnersSaved }) {
  const [loadingPool, setLoadingPool] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [selectedRank, setSelectedRank] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Drawn winners in current session
  const [drawnWinners, setDrawnWinners] = useState({});
  const [currentWinner, setCurrentWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);

  // Physical conveyor belt tape of cards
  const [tape, setTape] = useState([]);
  const [winningIndex, setWinningIndex] = useState(null);

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const animFrameRef = useRef(null);
  const isSpinningRef = useRef(false);

  const CARD_WIDTH = 136; // px
  const CARD_GAP = 14;   // px
  const STEP = CARD_WIDTH + CARD_GAP; // 150px per card

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isSpinningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Define prize tiers based on contest configuration
  const prizeTiers = [
    { rank: 1, title: "1-O'rin (Bosh Sovrin)", amount: contest.first_prize || 2500000, icon: 'military_tech', color: 'from-amber-400 to-amber-600', textGlow: 'text-amber-400' },
    { rank: 2, title: "2-O'rin", amount: contest.second_prize || 1500000, icon: 'workspace_premium', color: 'from-slate-300 to-slate-400', textGlow: 'text-slate-300' },
    { rank: 3, title: "3-O'rin", amount: contest.third_prize || 1000000, icon: 'emoji_events', color: 'from-amber-700 to-orange-800', textGlow: 'text-orange-400' },
  ];

  if (Number(contest.fourth_prize) > 0) {
    prizeTiers.push({
      rank: 4,
      title: "4-O'rin",
      amount: contest.fourth_prize,
      icon: 'stars',
      color: 'from-emerald-400 to-teal-600',
      textGlow: 'text-emerald-400'
    });
  }

  // Load existing winners from contest if any
  useEffect(() => {
    if (contest?.winners && contest.winners.length > 0) {
      const initial = {};
      contest.winners.forEach((w) => {
        initial[w.prize_rank] = {
          user_id: w.user_id,
          full_name: w.full_name,
          username: w.username,
          avatar_url: w.avatar_url,
          ticket_number: w.ticket_number,
          prize_amount: w.prize_amount
        };
      });
      setDrawnWinners(initial);
    }
  }, [contest]);

  // Generate an initial visual tape of cards
  const buildTape = (pool, targetWinner = null, targetIdx = 104) => {
    if (pool.length === 0) return [];
    const totalLength = 130;
    const result = [];
    for (let i = 0; i < totalLength; i++) {
      if (targetWinner && i === targetIdx) {
        result.push(targetWinner);
      } else {
        const randomCard = pool[Math.floor(Math.random() * pool.length)];
        result.push(randomCard);
      }
    }
    return result;
  };

  // Load participant pool for live roulette
  useEffect(() => {
    const loadPool = async () => {
      try {
        setLoadingPool(true);
        const res = await api.get(`/contests/admin/contests/${contest.id}/random-pool/`);
        const pool = res.data.participants || [];
        setParticipants(pool);
        if (pool.length > 0) {
          const initialTape = buildTape(pool);
          setTape(initialTape);
        }
      } catch (err) {
        console.error("Pool load error:", err);
      } finally {
        setLoadingPool(false);
      }
    };
    loadPool();
  }, [contest?.id]);

  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Trigger celebratory confetti
  const triggerConfetti = () => {
    try {
      const count = 250;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio, opts) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#fbbf24', '#f59e0b', '#ffd700'] });
      fire(0.2, { spread: 60, colors: ['#ffffff', '#05d59e', '#00f0ff'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#fbbf24', '#ff0055', '#a855f7'] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ffd700', '#ffffff'] });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch {
      // ignore
    }
  };

  // Start the physical continuous conveyor sliding animation
  const handleStartSpin = async () => {
    if (isSpinning || participants.length === 0 || !trackRef.current || !viewportRef.current) return;
    sfx.init();

    // Exclude users already drawn in other ranks
    const excludedIds = Object.entries(drawnWinners)
      .filter(([rankKey]) => Number(rankKey) !== Number(selectedRank))
      .map(([, w]) => w.user_id);

    const availableCandidates = participants.filter((p) => !excludedIds.includes(p.user_id));

    if (availableCandidates.length === 0) {
      alert("Tanlash uchun boshqa ishtirokchilar qolmadi!");
      return;
    }

    setIsSpinning(true);
    isSpinningRef.current = true;
    setCurrentWinner(null);
    setWinningIndex(null);

    // Pick backend random winner to ensure true fairness and cryptographic randomness
    let backendWinner = null;
    try {
      const res = await api.post(`/contests/admin/contests/${contest.id}/pick-winner/`, {
        exclude_user_ids: excludedIds
      });
      backendWinner = res.data.winner;
    } catch (e) {
      console.warn("Backend pick error, falling back to local pool:", e);
      backendWinner = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
    }

    const finalWinner = availableCandidates.find((p) => p.user_id === backendWinner.user_id) || backendWinner;

    // Target index on the conveyor tape (card 104 out of 130 cards for high-speed long run)
    const TARGET_INDEX = 104;
    const newTape = buildTape(availableCandidates, finalWinner, TARGET_INDEX);
    setTape(newTape);

    // Step 1: Reset track position to 0 instantly without transition
    const trackEl = trackRef.current;
    const viewportEl = viewportRef.current;

    trackEl.style.transition = 'none';
    trackEl.style.transform = 'translateX(0px)';

    // Force DOM reflow so transition resets
    void trackEl.offsetWidth;

    // Step 2: Calculate the exact target offset so TARGET_INDEX card centers directly under the needle
    const viewportWidth = viewportEl.offsetWidth || 600;
    const cardCenter = TARGET_INDEX * STEP + CARD_WIDTH / 2;
    
    // Natural minor jitter within the card boundary (-10px to +10px) so it stops organically
    const jitter = (Math.random() - 0.5) * 20;
    const targetOffset = cardCenter - viewportWidth / 2 + jitter;

    // Step 3: Animate smoothly to the left using pure CSS GPU-accelerated transition
    // 11.8 seconds continuous physics deceleration: ultra high-velocity initial rush -> thrilling suspense -> organic stop
    requestAnimationFrame(() => {
      trackEl.style.transition = 'transform 11800ms cubic-bezier(0.06, 0.9, 0.2, 1)';
      trackEl.style.transform = `translateX(-${targetOffset}px)`;
    });

    // Step 4: Real-time sound ticker synchronized with cards passing under the needle
    let lastTickIndex = -1;

    const trackSoundLoop = () => {
      if (!isSpinningRef.current || !trackRef.current || !viewportRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const viewportRect = viewportRef.current.getBoundingClientRect();
      const needleX = viewportRect.left + viewportRect.width / 2;
      const relativeX = needleX - trackRect.left;
      const currentIndex = Math.floor(relativeX / STEP);

      if (currentIndex !== lastTickIndex && currentIndex >= 0 && currentIndex <= TARGET_INDEX) {
        lastTickIndex = currentIndex;
        // Pitch rises as it slows down towards the finish
        sfx.playTick(550 + Math.min(650, currentIndex * 6.2));
      }

      animFrameRef.current = requestAnimationFrame(trackSoundLoop);
    };

    animFrameRef.current = requestAnimationFrame(trackSoundLoop);

    // Step 5: When the physical sliding stops exactly on the needle
    setTimeout(() => {
      isSpinningRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      setIsSpinning(false);
      setWinningIndex(TARGET_INDEX);
      setCurrentWinner(finalWinner);
      sfx.playWinnerFanfare();
      triggerConfetti();
    }, 11850);
  };

  const handleConfirmWinner = () => {
    if (!currentWinner) return;
    const tier = prizeTiers.find((t) => t.rank === selectedRank);
    setDrawnWinners((prev) => ({
      ...prev,
      [selectedRank]: {
        user_id: currentWinner.user_id,
        full_name: currentWinner.full_name,
        username: currentWinner.username,
        avatar_url: currentWinner.avatar_url,
        ticket_number: currentWinner.ticket_number,
        prize_amount: tier?.amount || 0,
      }
    }));
    setCurrentWinner(null);
    setWinningIndex(null);

    // Auto-advance to next prize rank if not done
    const nextTier = prizeTiers.find((t) => !drawnWinners[t.rank] && t.rank !== selectedRank);
    if (nextTier) {
      setSelectedRank(nextTier.rank);
    }
  };

  // Finalize winners and notify bot
  const handleFinalizeAll = async () => {
    const winnersList = Object.entries(drawnWinners).map(([rank, data]) => ({
      user_id: data.user_id,
      prize_rank: Number(rank),
      prize_amount: data.prize_amount
    }));

    if (winnersList.length === 0) {
      alert("Kamida 1 ta g'olibni tasdiqlashingiz lozim!");
      return;
    }

    if (!window.confirm(`Jami ${winnersList.length} ta g'olibni tasdiqlab, rasman e'lon qilishni va g'oliblarga Telegram orqali tabrik jo'natishni tasdiqlaysizmi?`)) {
      return;
    }

    try {
      setSavingFinal(true);
      const res = await api.post(`/contests/admin/contests/${contest.id}/finalize/`, {
        winners: winnersList,
        credit_balances: true
      });
      if (onWinnersSaved) {
        onWinnersSaved(res.data.contest);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert("G'oliblarni saqlashda xatolik yuz berdi");
    } finally {
      setSavingFinal(false);
    }
  };

  const currentTier = prizeTiers.find((t) => t.rank === selectedRank) || prizeTiers[0];
  const assignedWinnerForCurrentTier = drawnWinners[selectedRank];

  return (
    <div className="fixed inset-0 z-[12000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container - Studio Aspect Ratio (Perfect for Instagram Reels & Screen Recording) */}
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e111a] via-[#121624] to-[#0a0c13] rounded-3xl border border-amber-500/30 shadow-[0_0_80px_rgba(251,191,36,0.15)] flex flex-col overflow-hidden my-auto animate-modal-pop">
        
        {/* Studio Lighting Accents */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-400/20 blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Top Control Bar */}
        <div className="relative z-10 px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-2xl">casino</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-red-400">
                  STUDIO MODE // JONLI EFIRGA OLISH REJIMI
                </span>
              </div>
              <h3 className="font-headline font-bold text-white text-base tracking-tight">
                {contest.title} — Randomizer
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-mono font-semibold ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-white/10'
              }`}
              title="Ovozni yoqish/o'chirish"
            >
              <span className="material-symbols-outlined text-lg">
                {soundEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span className="hidden sm:inline">{soundEnabled ? 'Ovoz: ON' : 'Ovoz: OFF'}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Main Stage */}
        <div className="relative p-6 flex flex-col gap-5 items-center text-center">
          
          {/* Prize Rank Selector Tabs */}
          <div className="w-full max-w-2xl flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
            {prizeTiers.map((tier) => {
              const isSelected = selectedRank === tier.rank;
              const hasWinner = !!drawnWinners[tier.rank];

              return (
                <button
                  key={tier.rank}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => {
                    setSelectedRank(tier.rank);
                    setCurrentWinner(null);
                    setWinningIndex(null);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-0.5 relative ${
                    isSelected
                      ? `bg-gradient-to-r ${tier.color} text-black shadow-lg scale-102`
                      : hasWinner
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-on-surface-variant hover:text-white border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">{tier.icon}</span>
                    <span>{tier.rank}-O'rin</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-black/80 font-semibold' : 'text-on-surface-variant'}`}>
                    {formatUZS(tier.amount)} UZS
                  </span>
                  {hasWinner && !isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Target Banner */}
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
              O'ynalayotgan Sovrin:
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-headline text-2xl sm:text-3xl font-bold uppercase tracking-tight ${currentTier.textGlow}`}>
                {currentTier.title}
              </span>
              <span className="text-xl font-mono text-white font-semibold">
                — {formatUZS(currentTier.amount)} UZS
              </span>
            </div>
          </div>

          {/* Fairness Coverage Header Bar */}
          <div className="w-full max-w-2xl flex items-center justify-between px-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Adolatli Qamrov: 100% ({participants.length} ta ishtirokchi)</span>
            </div>
            <span className="text-amber-400 font-bold">
              {isSpinning ? "⚡ CHAPGA SURILMOQDA — CHIZIQDA TO'XTAGAN ISHTIROKCHI G'OLIB!" : `Diapazon: ${participants[0]?.ticket_number || '#0001'} — ${participants[participants.length - 1]?.ticket_number || `#${participants.length}`}`}
            </span>
          </div>

          {/* PHYSICAL CONVEYOR ROULETTE TAPE (Sliding Left across the center laser needle) */}
          <div
            ref={viewportRef}
            className="relative w-full max-w-2xl h-60 rounded-3xl bg-gradient-to-b from-black/95 via-[#10131e] to-black/95 border-2 border-amber-500/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] flex items-center overflow-hidden"
          >
            {/* Center Needles (Fixed permanently at horizontal 50%) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[18px] border-t-amber-400 filter drop-shadow-[0_0_10px_#fbbf24]"></div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[18px] border-b-amber-400 filter drop-shadow-[0_0_10px_#fbbf24]"></div>
            </div>
            {/* Center Vertical Laser Needle */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-400 pointer-events-none z-30 shadow-[0_0_15px_#fbbf24] opacity-90"></div>

            {loadingPool ? (
              <div className="w-full flex flex-col items-center justify-center gap-3 z-10">
                <span className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
                <span className="font-mono text-xs text-on-surface-variant">Ishtirokchilar bazasi yuklanmoqda...</span>
              </div>
            ) : tape.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center gap-2 text-on-surface-variant z-10">
                <span className="material-symbols-outlined text-4xl text-amber-500/50">group_off</span>
                <span className="font-headline font-semibold text-sm">Ushbu konkursda hali ishtirokchilar yo'q</span>
              </div>
            ) : (
              /* Continuous Sliding Tape Track */
              <div
                ref={trackRef}
                className="flex items-center flex-nowrap will-change-transform"
                style={{ gap: `${CARD_GAP}px` }}
              >
                {tape.map((item, idx) => {
                  const isFinalCard = winningIndex !== null && idx === winningIndex;

                  return (
                    <div
                      key={idx}
                      style={{ width: `${CARD_WIDTH}px`, height: '185px' }}
                      className={`shrink-0 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 ${
                        isFinalCard
                          ? 'bg-gradient-to-b from-amber-500/30 via-[#181d2c] to-black border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] scale-105 z-20'
                          : 'bg-[#121624] border border-white/10'
                      }`}
                    >
                      {/* Ticket Badge */}
                      <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                        isFinalCard
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-black/80 border border-amber-400/40 text-amber-400'
                      }`}>
                        {item.ticket_number}
                      </span>

                      {/* Avatar */}
                      <img
                        src={item.avatar_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                        alt={item.full_name}
                        className={`w-14 h-14 rounded-full object-cover border-2 transition-all ${
                          isFinalCard
                            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]'
                            : 'border-white/20'
                        }`}
                      />

                      {/* Name & Username */}
                      <div className="flex flex-col items-center min-w-0 w-full">
                        <span className="text-xs font-headline font-bold text-white truncate max-w-[115px]">
                          {item.full_name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400/80 truncate max-w-[115px]">
                          {item.username ? `@${item.username}` : `ID: ${item.user_id}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Area: Spin or Confirm */}
          <div className="w-full max-w-xl flex flex-col items-center gap-3">
            {currentWinner ? (
              /* Winner Celebration Action Box */
              <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-surface-container to-amber-500/20 border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-modal-pop">
                <div className="flex items-center gap-3 text-left">
                  <span className="material-symbols-outlined text-3xl text-amber-400 animate-bounce">
                    celebration
                  </span>
                  <div className="flex flex-col">
                    <span className="font-headline text-xs uppercase font-bold text-amber-400 tracking-wider">
                      G'OLIB ANIQLANDI! (Chiziqda to'xtadi)
                    </span>
                    <span className="text-xs text-white font-medium">
                      {currentTier.title}: <b>{currentWinner.full_name}</b> ({currentWinner.ticket_number})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartSpin}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 text-white font-headline text-xs font-bold uppercase transition-all"
                  >
                    Qayta (Re-roll)
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWinner}
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-headline text-xs font-bold uppercase shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Tasdiqlash</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Start Spin Button */
              <button
                type="button"
                disabled={isSpinning || participants.length === 0 || loadingPool}
                onClick={handleStartSpin}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-black font-headline text-sm font-bold uppercase tracking-wider shadow-[0_0_35px_rgba(251,191,36,0.35)] flex items-center justify-center gap-3 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSpinning ? (
                  <>
                    <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span className="tracking-widest animate-pulse">LENTA SURILMOQDA... CHIZIQNI KUZATING</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl animate-spin">autorenew</span>
                    <span>{assignedWinnerForCurrentTier ? "G'olibni Qayta Tanlash" : "🎰 RANDOMIZERNI ISHGA TUSHIRISH (SURISH)"}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Confirmed Winners Summary Table */}
          <div className="w-full max-w-2xl mt-2 flex flex-col gap-2">
            <span className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant text-left">
              Aniqlangan G'oliblar Doskasi ({Object.keys(drawnWinners).length} / {prizeTiers.length}):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prizeTiers.map((tier) => {
                const winner = drawnWinners[tier.rank];
                return (
                  <div
                    key={tier.rank}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                      winner
                        ? 'bg-surface-container border-amber-400/30'
                        : 'bg-black/30 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} text-black font-bold text-xs flex items-center justify-center shrink-0`}>
                        {tier.rank}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-headline font-bold text-white truncate max-w-[130px]">
                          {winner ? winner.full_name : "Kutilmoqda..."}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {winner ? `${winner.ticket_number} • @${winner.username || 'user'}` : `${formatUZS(tier.amount)} UZS`}
                        </span>
                      </div>
                    </div>

                    {winner ? (
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {formatUZS(tier.amount)} UZS
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-on-surface-variant uppercase">
                        Aniqlanmagan
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 px-6 py-4 border-t border-white/10 bg-black/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-on-surface-variant text-center sm:text-left">
            Tasdiqlangach, g'oliblar balansi avtomatik to'ldiriladi va ularga <b>Telegram Bot</b> orqali tabriknoma yuboriladi.
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSpinning || savingFinal}
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-white/10 text-white font-headline text-xs font-bold uppercase transition-all"
            >
              Yopish
            </button>

            <button
              type="button"
              disabled={isSpinning || savingFinal || Object.keys(drawnWinners).length === 0}
              onClick={handleFinalizeAll}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-headline text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {savingFinal ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">publish</span>
                  <span>G'oliblarni E'lon Qilish ({Object.keys(drawnWinners).length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
