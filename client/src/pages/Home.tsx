import { FAVORITE_TIPS_KEY, FAVORITE_QUESTIONS_KEY, READING_KEY, loadFavoriteTips, loadFavoriteQuestions, toggleFavoriteTip, toggleFavoriteQuestion, tipIdentity } from "@/lib/localPreferences";
import { Heart } from "lucide-react";
import { SESSION_MODE_LEVELS, type SessionMode } from "@/lib/game";
import { AppUpdateSettings } from "@/components/AppUpdateSettings";
import { localStore, STORAGE_WARNING_EVENT } from "@/lib/localStore";
import { useTheme } from "@/contexts/ThemeContext";
import { GameSession, STORAGE_KEY, loadSession, saveSession } from "@/lib/sessionStorage";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  GameCard,
  GameTip,
  RoundOutcome,
  RoundSummary,
  LEVEL_LABELS,
  choosePenalty,
  chooseTip,
  createEmptyRoundOutcomeCounts,
  createGameCatalog,
  createRoundSummary,
  getRoundCardStates,
  generateRound,
  recordOpenedTip,
  roundSummaryReflection,
  roundSizeForViewport,
  searchUrlForTip,
} from "@/lib/game";
import { DEFAULT_TIP_FILTER, filterTipsBySelection, normalizeTipFilter, TIP_FILTER_OPTIONS, TipFilterState } from "@/lib/tipFilters";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Download,
  Lightbulb,
  LogIn,
  Moon,
  PartyPopper,
  RotateCw,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { nextTurnNotice } from "@/lib/uiCopy";
import { completionState, DEFAULT_ONBOARDING_STATE, normalizeOnboardingState, ONBOARDING_STORAGE_KEY, shouldStartOnboarding, type OnboardingState } from "@/lib/onboarding";
import { firstOnboardingStepForScreen } from "@/lib/onboardingSteps";
import { LATEST_VERSION } from "@/lib/changelog";
import { canShowWhatsNew, LAST_SEEN_VERSION_STORAGE_KEY, shouldShowWhatsNew, unseenChangelogEntries } from "@/lib/whatsNew";
import { PWA_OFFLINE_READY_EVENT, canOfferPWAInstall, hasPWAInstallPrompt, isPWAInstalled, PWA_INSTALL_AVAILABLE_EVENT, PWA_INSTALLED_EVENT, promptToInstallPWA, PWA_UPDATE_READY_EVENT } from "@/lib/pwa";

type Screen = "welcome" | "starter" | "game";
type ActionOutcome = RoundOutcome;

const TIP_FILTER_STORAGE_KEY = "hadith-alqulub-platform-tip-filter-v1";

function loadTipFilter(): TipFilterState {
  try {
    return normalizeTipFilter(JSON.parse(localStore.getItem(TIP_FILTER_STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_TIP_FILTER };
  }
}

function loadOnboarding(): OnboardingState {
  try {
    return normalizeOnboardingState(JSON.parse(localStore.getItem(ONBOARDING_STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

function Dialog({
  title,
  children,
  onClose,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  variant?: "default" | "question";
}) {
  const titleId = `dialog-${title.replace(/\s+/g, "-")}`;
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInitialControl = () => panelRef.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")?.focus();
    const frame = window.requestAnimationFrame(focusInitialControl);
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const controls = Array.from(panel.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const first = controls[0]!;
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className={`dialog-backdrop ${variant === "question" ? "question-dialog-backdrop" : ""}`} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section ref={panelRef} className={`dialog-panel ${variant === "question" ? "question-overlay-panel" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {variant === "question" ? children : <>
          <div className="dialog-heading">
            <h2 id={titleId}>{title}</h2>
            {onClose ? (
              <button className="icon-button quiet" aria-label="إغلاق" onClick={onClose}>
                <X size={19} />
              </button>
            ) : null}
          </div>
          {children}
        </>}
      </section>
    </div>
  );
}

export default function Home() {
  const [favoriteTips, setFavoriteTips] = useState(loadFavoriteTips);
  const [favoriteQuestions, setFavoriteQuestions] = useState(loadFavoriteQuestions);
  const [readingComfort, setReadingComfort] = useState(() => localStore.getItem(READING_KEY) === "comfort");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showClosingCard, setShowClosingCard] = useState(false);
  const [turnNotice, setTurnNotice] = useState<string | null>(null);
  useEffect(() => { localStore.setItem(FAVORITE_TIPS_KEY, JSON.stringify(favoriteTips)); }, [favoriteTips]);
  useEffect(() => { localStore.setItem(FAVORITE_QUESTIONS_KEY, JSON.stringify(favoriteQuestions)); }, [favoriteQuestions]);
  useEffect(() => { localStore.setItem(READING_KEY, readingComfort ? "comfort" : "standard"); }, [readingComfort]);
  useEffect(() => { if (!turnNotice) return; const timer = setTimeout(() => setTurnNotice(null), 1600); return () => clearTimeout(timer); }, [turnNotice]);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [playerOne, setPlayerOne] = useState("");
  const [playerTwo, setPlayerTwo] = useState("");
  const [session, setSession] = useState<GameSession | null>(null);
  const [restorableSession, setRestorableSession] = useState<GameSession | null>(null);
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [penalty, setPenalty] = useState<string | null>(null);
  const [tip, setTip] = useState<GameTip | null>(null);
  const [showTipHistory, setShowTipHistory] = useState(false);
  const [showTipFilter, setShowTipFilter] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEndSession, setShowEndSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [sessionMode, setSessionMode] = useState<SessionMode>("mixed");
  const [pwaUpdateReady, setPwaUpdateReady] = useState(false);
  const [pwaInstallAvailable, setPwaInstallAvailable] = useState(() => canOfferPWAInstall(hasPWAInstallPrompt(), isPWAInstalled()));
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [storageWarning, setStorageWarning] = useState(false);
  const [tipFilter, setTipFilter] = useState<TipFilterState>(loadTipFilter);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(loadOnboarding);
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [lastSeenVersion, setLastSeenVersion] = useState<string | null>(() => localStore.getItem(LAST_SEEN_VERSION_STORAGE_KEY));

  const gameCatalog = useMemo(() => createGameCatalog([]), []);

  const filteredTips = useMemo(
    () => filterTipsBySelection(gameCatalog.tips, tipFilter),
    [gameCatalog.tips, tipFilter],
  );
  const canManageTipLibrary = false;

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";

  }, []);

  useEffect(() => {
    const stored = loadSession();
    if (stored?.players?.[0] && stored?.players?.[1] && Array.isArray(stored.round)) {
      setPlayerOne(stored.players[0]); setPlayerTwo(stored.players[1]);
      if (stored.isPaused) setRestorableSession(stored);
      else {
        setSession(stored); setActiveCard(stored.activeCard); setPenalty(stored.penalty); setTip(stored.tip); setScreen("game");
      }
    }
    setOnboardingReady(true);
  }, []);

  useEffect(() => {
    if (!onboardingReady || onboardingActive) return;
    if (!session && shouldStartOnboarding(onboardingState, Boolean(restorableSession))) {
      setOnboardingStep(firstOnboardingStepForScreen("welcome"));
      setOnboardingActive(true);
    }
  }, [onboardingReady, onboardingState, restorableSession, onboardingActive, session]);



  useEffect(() => {
    const onReady = () => setOfflineReady(true);
    window.addEventListener(PWA_OFFLINE_READY_EVENT, onReady);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.getRegistration().then(r => { if (r?.active) setOfflineReady(true); }).catch(() => {});
    const onUpdateReady = () => setPwaUpdateReady(true);
    window.addEventListener(PWA_UPDATE_READY_EVENT, onUpdateReady);
    return () => { window.removeEventListener(PWA_UPDATE_READY_EVENT, onUpdateReady); window.removeEventListener(PWA_OFFLINE_READY_EVENT, onReady); };
  }, []);

  useEffect(() => {
    const syncInstallAvailability = () => setPwaInstallAvailable(canOfferPWAInstall(hasPWAInstallPrompt(), isPWAInstalled()));
    const markInstalled = () => {
      setPwaInstallAvailable(false);
      notify("تم تثبيت حديث القلوب على هذا الجهاز.");
    };
    syncInstallAvailability();
    window.addEventListener(PWA_INSTALL_AVAILABLE_EVENT, syncInstallAvailability);
    window.addEventListener(PWA_INSTALLED_EVENT, markInstalled);
    return () => {
      window.removeEventListener(PWA_INSTALL_AVAILABLE_EVENT, syncInstallAvailability);
      window.removeEventListener(PWA_INSTALLED_EVENT, markInstalled);
    };
  }, []);

  useEffect(() => {
    if (session && !saveSession({ ...session, activeCard, penalty, tip })) setStorageWarning(true);
  }, [session, activeCard, penalty, tip]);

  useEffect(() => {
    const warn = () => setStorageWarning(true);
    window.addEventListener(STORAGE_WARNING_EVENT, warn);
    return () => window.removeEventListener(STORAGE_WARNING_EVENT, warn);
  }, []);

  useEffect(() => {
    if (!localStore.setItem(TIP_FILTER_STORAGE_KEY, JSON.stringify(tipFilter))) setStorageWarning(true);
  }, [tipFilter]);

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (screen !== "game" || event.ctrlKey || event.altKey || event.metaKey || event.repeat || (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable=true]")) || showEndSession || showTipFilter || showFavorites || !session || session.roundSummary || activeCard || penalty || tip || showHelp || showStats || showTipHistory || showSettings || showWhatsNew || onboardingActive) return;
      const cardIndex = event.key === "0" ? 9 : Number(event.key) - 1;
      if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= session.round.length) return;
      event.preventDefault();
      openCard(session.round[cardIndex]!);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, session, activeCard, penalty, tip, showFavorites, showEndSession, showTipFilter, showHelp, showStats, showTipHistory, showSettings, showWhatsNew, onboardingActive, filteredTips]);

  const currentPlayerName = session ? session.players[session.currentPlayer] : "";
  const roundProgress = session ? Math.min(100, Math.round((session.round.length / Math.max(1, session.roundDeck.length)) * 100)) : 0;
  const boardCards = session ? getRoundCardStates(session.roundDeck, session.round) : [];

  function notify(message: string) {
    toast(message);
  }

  function completeOnboarding(skipped: boolean) {
    const nextState = completionState(skipped);
    localStore.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState));
    localStore.setItem(LAST_SEEN_VERSION_STORAGE_KEY, LATEST_VERSION);
    setOnboardingState(nextState);
    setLastSeenVersion(LATEST_VERSION);
    setOnboardingActive(false);
  }

  function dismissWhatsNew() {
    localStore.setItem(LAST_SEEN_VERSION_STORAGE_KEY, LATEST_VERSION);
    setLastSeenVersion(LATEST_VERSION);
    setShowWhatsNew(false);
  }

  function persistBeforeUpdate() {
    const saved = !session || saveSession({ ...session, activeCard, penalty, tip });
    return saved && localStore.flush();
  }

  async function installPWA() {
    const outcome = await promptToInstallPWA();
    setPwaInstallAvailable(canOfferPWAInstall(hasPWAInstallPrompt(), isPWAInstalled()));
    if (outcome === "accepted") notify("بدأ تثبيت حديث القلوب. ستجدونه ضمن تطبيقات الجهاز عند اكتماله.");
    else if (outcome === "dismissed") notify("يمكنكما تثبيت التطبيق لاحقاً من الإعدادات عندما يعرض المتصفح الخيار.");
    else notify("خيار التثبيت غير متاح الآن في هذا المتصفح.");
  }

  function restartOnboarding() {
    const nextState = { ...DEFAULT_ONBOARDING_STATE };
    localStore.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(nextState));
    setOnboardingState(nextState);
    setOnboardingStep(firstOnboardingStepForScreen(screen));
    setShowHelp(false);
    setShowSettings(false);
    setOnboardingActive(true);
  }

  function showScreen(next: Screen) {
    setScreen(next);
    window.setTimeout(() => document.querySelector<HTMLElement>("[data-screen-title]")?.focus(), 0);
  }

function startSession(starter: 0 | 1) {
    const one = playerOne.trim() || "اللاعب الأول";
    const two = playerTwo.trim() || "اللاعب الثاني";
    if (!one || !two) {
      notify("الرجاء إدخال الاسمين للمتابعة");
      return;
    }
    if (one === two) {
      notify("الرجاء إدخال اسمين مختلفين");
      return;
    }
    const count = roundSizeForViewport();
    const round = generateRound(count, [], gameCatalog.questions, SESSION_MODE_LEVELS[sessionMode]);
    setSession({
      sessionMode, isPaused: false, version: 2, activeCard: null, penalty: null, tip: null, roundTips: [], totalTipsShown: 0,
      players: [one, two],
      currentPlayer: starter,
      round,
      roundDeck: round,
      recentPrompts: round.map(card => card.prompt),
      recentPenalties: [],
      served: 0,
      tipHistory: [],
      startedSessions: 1,
      roundNumber: 1,
      roundOutcomes: createEmptyRoundOutcomeCounts(),
      roundPlayerTurns: [0, 0],
      roundTipStartIndex: 0,
    });
    showScreen("game");
    notify("بدأت جولة أسئلة جديدة.");
  }

  function resumeSession() {
    if (!restorableSession) return;
    setSession({ ...restorableSession, isPaused: false });
    setActiveCard(restorableSession.activeCard);
    setPenalty(restorableSession.penalty);
    setTip(restorableSession.tip);
    setPlayerOne(restorableSession.players[0]);
    setPlayerTwo(restorableSession.players[1]);
    setRestorableSession(null);
    showScreen("game");
    notify("استُعيدت الجلسة بنجاح.");
  }

  function openCard(card: GameCard) {
    if (!session) return;
    setSession(current =>
      current
        ? {
            ...current,
            round: current.round.filter(item => item.id !== card.id),
          }
        : current,
    );
    setActiveCard(card);
  }

  function resolveAction(outcome: ActionOutcome) {
    if (!session) return;
    const served = session.served + 1;
    const isLastCard = session.round.length === 0;
    const nextTip = served % 5 === 0 && filteredTips.length ? chooseTip(filteredTips, session.tipHistory.slice(-8).map(item => item.text)) : null;
    const openedAt = Date.now();
    const historyEntry = nextTip ? { ...nextTip, id: `${nextTip.id}-shown-${openedAt}` } : null;
    setSession(current =>
      {
        if (!current) return current;
        const roundOutcomes = {
          ...current.roundOutcomes,
          [outcome]: current.roundOutcomes[outcome] + 1,
        };
        const roundPlayerTurns = [...current.roundPlayerTurns] as [number, number];
        roundPlayerTurns[current.currentPlayer] += 1;
        const tipHistory = nextTip ? recordOpenedTip(current.tipHistory, nextTip, openedAt) : current.tipHistory;
        const nextSession = {
          ...current,
          served,
          currentPlayer: outcome === "skipped" ? current.currentPlayer : current.currentPlayer === 0 ? 1 : 0,
          roundOutcomes,
          roundPlayerTurns,
          tipHistory,
          activeCard: null, penalty: null,
          roundTips: historyEntry ? [...current.roundTips, historyEntry] : current.roundTips,
          totalTipsShown: current.totalTipsShown + (nextTip ? 1 : 0),
        };
        return isLastCard
          ? {
              ...nextSession,
              roundSummary: createRoundSummary({
                roundNumber: current.roundNumber,
                totalCards: current.roundDeck.length,
                outcomes: roundOutcomes,
                playerTurns: roundPlayerTurns,
                tipHistory,
                tipStartIndex: current.roundTipStartIndex,
                roundTips: nextSession.roundTips,
                totalTipsShown: nextSession.totalTipsShown,
                sessionCardsOpened: served,
              }),
            }
          : nextSession;
      },
    );
    setActiveCard(null);
    if (historyEntry) setTip(historyEntry);
    if (isLastCard) {
      notify("أحسنتم! أكملتم الجولة");
    } else if (outcome === "skipped") {
      notify("تخطي السؤال");
    } else {
      const nextPlayerIndex = session.currentPlayer === 0 ? 1 : 0;
      setTurnNotice(nextTurnNotice(session.players[nextPlayerIndex]));
    }
  }

  function handlePenalty() {
    if (!session) return;
    const nextPenalty = choosePenalty(gameCatalog.penalties, session.recentPenalties);
    setActiveCard(null);
    setPenalty(nextPenalty);
    setSession(current => current ? { ...current, recentPenalties: [...current.recentPenalties, nextPenalty].slice(-8) } : current);
  }

  function openTip(nextTip: GameTip) {
    const openedAt = Date.now();
    const historyEntry = { ...nextTip, id: `${nextTip.id}-shown-${openedAt}` };
    setTip(historyEntry);
    setSession(current => (current ? { ...current, tipHistory: recordOpenedTip(current.tipHistory, nextTip, openedAt), roundTips: [...current.roundTips, historyEntry], totalTipsShown: current.totalTipsShown + 1 } : current));
  }

  function openRandomTip() {
    if (!filteredTips.length) {
      notify("لا توجد نصائح تطابق الفلترة الحالية؛ عدّلا الاختيارات أو أعيدا العرض المختلط.");
      return;
    }
    openTip(chooseTip(filteredTips, session?.tipHistory.slice(-8).map(item => item.text)));
  }

  function updateTipFilter(mode: "include" | "exclude", values: string[]) {
    const nextKeys = values.filter((value): value is typeof TIP_FILTER_OPTIONS[number]["key"] => TIP_FILTER_OPTIONS.some(option => option.key === value));
    setTipFilter(current => {
      const otherMode = mode === "include" ? "exclude" : "include";
      return normalizeTipFilter({
        ...current,
        [mode]: nextKeys,
        [otherMode]: current[otherMode].filter(key => !nextKeys.includes(key)),
      });
    });
  }

  function finishPenalty() {
    setPenalty(null);
    resolveAction("penalty");
  }

  function createNextRound() {
    setShowClosingCard(false);
    setSession(current => {
      if (!current) return current;
      const count = roundSizeForViewport();
      const round = generateRound(count, current.recentPrompts, gameCatalog.questions, SESSION_MODE_LEVELS[current.sessionMode]);
      return {
        ...current,
        round,
        roundDeck: round,
        recentPrompts: [...current.recentPrompts.filter(prompt => !round.some(card => card.prompt === prompt)), ...round.map(card => card.prompt)].slice(-72),
        roundNumber: current.roundNumber + 1,
        roundOutcomes: createEmptyRoundOutcomeCounts(),
        roundPlayerTurns: [0, 0],
        roundTipStartIndex: current.tipHistory.length,
        roundSummary: undefined,
        roundTips: [],
      };
    });
    notify("بدأت جولة أسئلة جديدة.");
  }

  function resetSession() {
    localStore.removeItem(STORAGE_KEY);
    setSession(null);
    setRestorableSession(null);
    setActiveCard(null);
    setPenalty(null);
    setTip(null);
    showScreen("welcome");
    notify("يمكنكما بدء جلسة جديدة الآن.");
  }

  function endWithSave() {
    if (session) {
      const saved = { ...session, isPaused: true, activeCard, penalty, tip };
      saveSession(saved);
      setRestorableSession(saved);
    }
    setSession(null);
    setActiveCard(null);
    setPenalty(null);
    setTip(null);
    setShowEndSession(false);
    showScreen("welcome");
    notify("حُفظت الجلسة، ويمكنكما استئنافها لاحقاً.");
  }

  return (
    <main className={`game-shell ${readingComfort ? "reading-comfort" : ""}`}>
      {turnNotice ? <div className="turn-notice" role="status">{turnNotice}</div> : null}
      {storageWarning ? <p role="status" className="storage-warning">تعذّر الحفظ على الجهاز. يمكن متابعة اللعب، لكن التغييرات قد تضيع بعد إغلاق الصفحة.</p> : null}
      <div className="ornament ornament-top" aria-hidden="true" />
      <header className="topbar" aria-label="شريط الأدوات">
        <Link className="brand" href="/" aria-label="حديث القلوب">
          <img src={`${import.meta.env.BASE_URL}icons/heart-ribbon-v1.webp`} className="brand-logo" alt="" width={32} height={32} />
          <span>حديث القلوب</span>
        </Link>
        <div className="topbar-actions">
          {screen === "game" ? (
            <>
              <button className="text-button" data-tour="help" onClick={() => setShowHelp(true)}><CircleHelp size={16} /> تعليمات</button>
              <button className="text-button" onClick={() => setShowEndSession(true)}><RotateCw size={16} /> جديد</button>
              <button className="text-button" onClick={() => setShowEndSession(true)}><X size={16} /> إنهاء</button>
            </>
          ) : null}
          <button className="text-button tip-trigger" data-tour="tip" aria-label="عرض نصيحة" onClick={openRandomTip}><Lightbulb size={16} /> نصيحة</button>
          <button className="icon-button" data-tour="settings" aria-label="الإعدادات" onClick={() => setShowSettings(true)}><Settings size={18} /></button>
          <button className="icon-button" aria-label={darkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"} onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

        </div>
      </header>

      {screen === "welcome" ? (
        <section className="welcome-panel" id="top" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <span className="eyebrow">لعبة حوارية للزوجين</span>
            <h1 id="welcome-title" data-screen-title tabIndex={-1}>قَرِّبوا القلوب<br /><em>خطوة بخطوة</em></h1>
            <p>اختارا بطاقات الأسئلة، واصنعا مساحة صادقة للتواصل والابتسام والإنصات.</p>
            <div className="level-pills" aria-label="مستويات اللعبة">
              {Object.values(LEVEL_LABELS).map(level => <span key={level}>{level}</span>)}
            </div>
          </div>
          <div className="welcome-card" data-tour="players">
            <div className="card-knot" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}icons/heart-ribbon-v1.webp`} alt="" width={42} height={42} /></div>
            <div className="form-heading"><Users size={22} /><div><h2>اسما اللاعبين <small>اختياريان</small></h2><p>اكتبا الاسمين إن رغبتما؛ وإلا تبدأ اللعبة باللاعب الأول واللاعب الثاني.</p></div></div>
            <label>اسم اللاعب الأول (اختياري)<input value={playerOne} onChange={event => setPlayerOne(event.target.value)} placeholder="مثال: علي" maxLength={32} /></label>
            <label>اسم اللاعب الثاني (اختياري)<input value={playerTwo} onChange={event => setPlayerTwo(event.target.value)} placeholder="مثال: فاطمة" maxLength={32} /></label>
            <button className="primary-button" data-tour="start-session" onClick={() => showScreen("starter")}>بدء الجلسة <ArrowLeft size={18} /></button>
            {restorableSession ? <button className="secondary-button" onClick={resumeSession}>استئناف جلسة سابقة</button> : null}
          </div>
        </section>
      ) : null}

      {screen === "starter" ? (
        <section className="choice-panel" aria-labelledby="starter-title">
          <span className="eyebrow">بداية الجولة</span>
          <h1 id="starter-title" data-screen-title tabIndex={-1}>من يبدأ الحديث؟</h1>
          <p>يمكنكما الاختيار يدوياً أو ترك البداية للصدفة.</p>
          <fieldset className="session-mode-picker">
            <legend>اختيار عمق الجولة</legend>
            {([ ["mixed", "مختلط", "كل المستويات"], ["light", "خفيف", "همسات ونبض فقط"], ["deep", "عميق", "يشمل كل المستويات"] ] as const).map(([mode, label, description]) => (
              <label key={mode}>
                <input type="radio" name="session-mode" checked={sessionMode === mode} onChange={() => setSessionMode(mode)} />
                <span>{label}<small>{description}</small></span>
              </label>
            ))}
          </fieldset>
          <div className="starter-grid" data-tour="starter-choice">
            <button className="starter-card" onClick={() => startSession(0)}><span>يبدأ الجولة</span><strong>{playerOne || "اللاعب الأول"}</strong></button>
            <button className="starter-card" onClick={() => startSession(1)}><span>يبدأ الجولة</span><strong>{playerTwo || "اللاعب الثاني"}</strong></button>
          </div>
          <button className="random-button" onClick={() => startSession(Math.random() > 0.5 ? 0 : 1)}><Sparkles size={17} /> اختيار عشوائي للبداية</button>
          <button className="back-button" onClick={() => showScreen("welcome")}><ChevronLeft size={17} /> رجوع</button>
        </section>
      ) : null}

      {screen === "game" && session ? (
        <section className="board-page" aria-labelledby="game-title">
          <div className="turn-banner">
            <div><span>الدور الحالي</span><strong>{currentPlayerName}</strong></div>
            <div className="round-indicator"><span>{session.round.length}</span><small>بطاقة متاحة</small></div>
          </div>
          <h1 id="game-title" className="sr-only" data-screen-title tabIndex={-1}>بطاقات حديث القلوب</h1>

          <div className={`cards-grid cards-${session.round.length}`} aria-label="بطاقات الأسئلة" data-card-count={session.round.length} data-tour="cards">
            {boardCards.map(({ card, state }, index) => {
              const isAvailable = state === "available";
              const availableIndex = boardCards.slice(0, index).filter(item => item.state === "available").length;
              const shortcut = availableIndex < 9 ? String(availableIndex + 1) : undefined;
              return (
              <button className={`question-card card-tone-${index % 3}${isAvailable ? "" : " question-card--consumed"}`} key={card.id} onClick={() => openCard(card)} disabled={!isAvailable} aria-label={isAvailable ? `بطاقة ${availableIndex + 1} من ${session.round.length}` : `بطاقة ${index + 1} مستهلكة`} aria-keyshortcuts={isAvailable ? shortcut : undefined}>
                <span className="card-number">{index === 9 ? "0" : index + 1}</span>
                <img src={`${import.meta.env.BASE_URL}icons/heart-ribbon-v1.webp`} alt="" className="card-stamp" />
                {!isAvailable ? <span className="card-consumed-mark" aria-hidden="true">تم الكشف</span> : null}
              </button>
              );
            })}
          </div>

          <div className="board-footer">
            <div className="footer-stat"><span className="progress-line"><i style={{ width: `${roundProgress}%` }} /></span><span>{session.round.length} متبقية في هذه الجولة</span></div>
            <div className="footer-actions" data-tour="session-tools">
              <button className="footer-button" onClick={() => setShowTipHistory(true)}><BookOpen size={17} /> ما فُتح في الجلسة <b>{session.totalTipsShown}</b></button>
              <button className="footer-button" onClick={() => setShowFavorites(true)}><Heart size={17} /> المفضلة الخاصة <b>{favoriteTips.length + favoriteQuestions.length}</b></button>
              {canManageTipLibrary ? <>
                <button className="footer-button" onClick={() => setShowTipHistory(true)}><BookOpen size={17} /> سجل النصائح <b>{session.tipHistory.length}</b></button>
                <button className="footer-button" onClick={() => setShowTipFilter(true)}><SlidersHorizontal size={17} /> فلترة النصائح</button>
              </> : null}
              <button className="footer-button" onClick={() => setShowStats(true)}><ClipboardList size={17} /> إحصائيات الجلسة</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeCard ? (
        <Dialog title="حديث القلوب" variant="question">
          <div className="question-overlay-layout">
            <article className={`legacy-question-card hc-card theme-${activeCard.level}`}>
              <header className="legacy-question-card__header hc-card__header">
                <h2 id="dialog-حديث-القلوب">حديث القلوب</h2>
                <span className="legacy-question-card__level hc-card__level">{LEVEL_LABELS[activeCard.level]}</span>
              </header>
              <div className="legacy-question-card__level-strip" aria-hidden="true" />
              <div className="legacy-question-card__rule" aria-hidden="true" />
              <p className="legacy-question-card__copy">{activeCard.prompt}</p>
              <button type="button" className="legacy-question-card__favorite" aria-pressed={favoriteQuestions.some(q => q.id === activeCard.id)} aria-label={favoriteQuestions.some(q => q.id === activeCard.id) ? "إزالة السؤال من المفضلة" : "إضافة السؤال إلى المفضلة"} onClick={() => setFavoriteQuestions(items => toggleFavoriteQuestion(items, activeCard))}><Heart size={27} fill={favoriteQuestions.some(q => q.id === activeCard.id) ? "currentColor" : "none"} /></button>
            </article>
            <div className="question-actions" data-tour="question-actions" aria-label="خيارات السؤال">
              <button className="primary-button" onClick={() => resolveAction("answered")}><Check size={18} /> أجبتُ عن السؤال</button>
              <button className="secondary-button" onClick={() => resolveAction("skipped")}><SkipForward size={18} /> تخطِّي السؤال</button>
              <button className="subtle-button" onClick={handlePenalty}>لم أستطع الإجابة</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {penalty ? <Dialog title="نشاط لطيف اختياري" onClose={() => { setPenalty(null); resolveAction("skipped"); }}><div className="penalty-dialog"><PartyPopper size={35} /><p>{penalty}</p><small>نفذاه فقط إذا كان مريحاً لكليكما. يمكنكما تخطي النشاط دون شرح.</small><button className="primary-button" onClick={finishPenalty}>نفذناه</button><button className="secondary-button" onClick={() => { setPenalty(null); resolveAction("skipped"); }}>تخطي النشاط</button></div></Dialog> : null}

      {tip ? (
        <Dialog title="نصيحة اليوم" onClose={() => setTip(null)}>
          <article className="tip-dialog">
            <p className={`tip-dialog__kind tip-dialog__kind--${tip.category || "hadith"}`}>{tip.category === "expert" ? "نصيحة من مرجع أسري متخصص" : tip.category === "community" ? "محتوى مقترح من المجتمع" : "رواية من أهل البيت (ع)"}</p>
            <blockquote>{tip.text}</blockquote>
            {tip.summary ? <section className="tip-dialog__insight"><b>خلاصة</b><p>{tip.summary}</p></section> : null}
            {tip.translation ? <section className="tip-dialog__practice"><b>تطبيق مقترح</b><p>{tip.translation}</p></section> : null}
            <footer className="tip-dialog__source">
              <strong>{tip.narrator}</strong>
              {tip.source ? <span>{tip.source}{tip.reference ? ` · ${tip.reference}` : ""}</span> : null}
              {tip.textOriginal ? <details><summary>النص الأصلي بالإنجليزية</summary><p dir="ltr">{tip.textOriginal}</p></details> : null}
              {tip.sourceUrl ? <a href={tip.sourceUrl} target="_blank" rel="noreferrer">فتح المصدر</a> : tip.source || tip.reference ? <a href={searchUrlForTip(tip)} target="_blank" rel="noreferrer">ابحث في المرجع</a> : null}
            </footer>
            <button className="secondary-button" aria-pressed={favoriteTips.some(t => t.id === tipIdentity(tip))} onClick={() => setFavoriteTips(items => toggleFavoriteTip(items, tip))}><Heart size={18} /> {favoriteTips.some(t => t.id === tipIdentity(tip)) ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}</button>
            <button className="primary-button tip-dialog__close" onClick={() => setTip(null)}>إغلاق</button>
          </article>
        </Dialog>
      ) : null}

      {screen === "game" && session?.roundSummary && !activeCard && !penalty && !tip ? (
        <Dialog title="ملخص الجولة">
          <article className="round-summary">
            <header className="round-summary__intro">
              <span>الجولة {session.roundSummary.roundNumber}</span>
              <h3>أحسنتما يا {session.players[0]} و{session.players[1]}</h3>
              <p>لمحة موجزة عمّا حدث في هذه الجولة؛ لا يظهر فيها إلا ما فُتح فعلاً على هذا الجهاز.</p>
            </header>
            <section className="round-summary__metrics"><div><span>بطاقات فُتحت</span><strong>{session.roundSummary.totalCards}</strong></div><div><span>نصيحة ظهرت</span><strong>{session.roundSummary.tips.length}</strong></div></section>
            <details className="round-summary__details"><summary>عرض تفاصيل هذه الجولة</summary><div className="round-summary__details-content">
            <section className="round-summary__metrics" aria-label="نتائج الجولة التفصيلية">
              <div><span>بطاقات فُتحت</span><strong>{session.roundSummary.totalCards}</strong></div>
              <div><span>إجابات</span><strong>{session.roundSummary.outcomes.answered}</strong></div>
              <div><span>بطاقات تم تخطيها</span><strong>{session.roundSummary.outcomes.skipped}</strong></div>
              <div><span>عقوبات نُفِّذت</span><strong>{session.roundSummary.outcomes.penalty}</strong></div>
            </section>
            <section className="round-summary__players" aria-label="مشاركة اللاعبين">
              <div><span>{session.players[0]}</span><b>{session.roundSummary.playerTurns[0]} بطاقة</b></div>
              <div><span>{session.players[1]}</span><b>{session.roundSummary.playerTurns[1]} بطاقة</b></div>
            </section>
            <section className="round-summary__session">
              <span>في الجلسة الحالية</span>
              <b>{session.roundSummary.sessionCardsOpened} بطاقة فُتحت · {session.roundSummary.sessionTipsShown} نصيحة ظهرت</b>
            </section>
            <section className="round-summary__reflection" aria-label="وقفة ختامية">
              <Sparkles size={19} aria-hidden="true" />
              <div><span>وقفة لطيفة</span><p>{roundSummaryReflection(session.roundSummary)}</p></div>
            </section>
            <section className="round-summary__tips" aria-labelledby="round-summary-tips-title">
              <h4 id="round-summary-tips-title">النصيحة التي رافقتكما في هذه الجولة</h4>
              {session.roundSummary.tips.length ? (
                <div>{session.roundSummary.tips.map(item => <button key={item.id} onClick={() => setTip(item)}><Lightbulb size={16} /><span><b>{item.narrator}</b><small>{item.text}</small></span><ChevronLeft size={16} /></button>)}</div>
              ) : <p>لم تُعرض نصيحة جديدة في هذه الجولة؛ ويمكنكما عرض واحدة من زر «نصيحة» في الجولة التالية.</p>}
            </section>
            {showClosingCard ? <section className="round-summary__closing" aria-label="بطاقة ختام اختيارية"><b>بطاقة ختام</b><small>اختيارية ولا تُحفظ</small><p>{session.roundSummary.tips.length ? "إن رغبتما، اختارا فكرة واحدة من النصيحة التي ظهرت وخذاها معكما." : session.roundSummary.outcomes.answered ? "إن رغبتما، ما السؤال أو اللحظة التي كان فيها الحديث ألطف لكما اليوم؟" : "إن رغبتما، ما التغيير الصغير الذي يجعل الجولة التالية أهدأ وألطف؟"}</p><button onClick={() => setShowClosingCard(false)}>إخفاء البطاقة</button></section> : <button className="secondary-button round-summary__closing-trigger" onClick={() => setShowClosingCard(true)}>فتح بطاقة ختام اختيارية</button>}
            </div></details>
            <footer className="round-summary__actions">
              <button className="primary-button" onClick={createNextRound}>جولة جديدة</button>
              <button className="secondary-button" onClick={() => setShowEndSession(true)}>إنهاء الجلسة وحفظها</button>
            </footer>
          </article>
        </Dialog>
      ) : null}

      {showTipHistory ? (
        <Dialog title="نصائح شاهدتماها في هذه الجلسة" onClose={() => setShowTipHistory(false)}>
          <div className="history-list">
            {session?.tipHistory.length ? session.tipHistory.slice().reverse().map(item => <button key={item.id} onClick={() => { setShowTipHistory(false); setTip(item); }}><Lightbulb size={18} /><span><b>{item.narrator}</b><small>{item.text}</small></span><ChevronLeft size={18} /></button>) : <p className="empty-copy">لم تظهر نصيحة بعد في هذه الجلسة.</p>}
          </div>
        </Dialog>
      ) : null}

      {showFavorites ? <Dialog title="المفضلة الخاصة" onClose={() => setShowFavorites(false)}><div className="favorite-list"><p>تُحفظ هذه العناصر على هذا الجهاز فقط، ولا تضم إلا نصيحة أو سؤالاً فُتح فعلاً ثم اخترتما الاحتفاظ به.</p>
        {favoriteTips.length ? <section className="favorite-list__section"><h3>النصائح المحفوظة</h3>{favoriteTips.map(item => <div className="favorite-list__item" key={item.id}><button onClick={() => { setShowFavorites(false); setTip(item); }}><span><b>{item.narrator}</b><small>{item.text}</small></span></button><button className="favorite-list__remove" aria-label={`إزالة ${item.text} من المفضلة`} onClick={() => setFavoriteTips(items => toggleFavoriteTip(items, item))}>إزالة</button></div>)}</section> : null}
        {favoriteQuestions.length ? <section className="favorite-list__section"><h3>الأسئلة المحفوظة</h3>{favoriteQuestions.map(item => <div className="favorite-list__item favorite-list__item--question" key={item.id}><div><span><b>سؤال محفوظ</b><small>{item.prompt}</small></span></div><button className="favorite-list__remove" aria-label={`إزالة السؤال ${item.prompt} من المفضلة`} onClick={() => setFavoriteQuestions(items => toggleFavoriteQuestion(items, item))}>إزالة</button></div>)}</section> : null}
        {!favoriteTips.length && !favoriteQuestions.length ? <p>لم تحفظا شيئاً بعد. افتحا نصيحة أو سؤالاً ثم اختارا القلب إن رغبتما.</p> : null}
      </div></Dialog> : null}

      {canManageTipLibrary && showTipFilter ? (
        <Dialog title="فلترة النصائح" onClose={() => setShowTipFilter(false)}>
          <div className="tip-filter-dialog">
            <p>تبقى النصائح مختلطة افتراضياً. اختارا محاور للعرض الحصري أو استبعدا محاور لا تريدان ظهورها؛ يُحفظ التفضيل على هذا الجهاز.</p>
            <section className="tip-filter-dialog__section" aria-labelledby="tip-filter-include">
              <h3 id="tip-filter-include">أظهر هذه المحاور</h3>
              <ToggleGroup type="multiple" value={tipFilter.include} onValueChange={values => updateTipFilter("include", values)} aria-label="محاور العرض الحصري" className="tip-filter-toggle">
                {TIP_FILTER_OPTIONS.map(option => <ToggleGroupItem key={option.key} value={option.key} aria-label={option.label}>{option.label}</ToggleGroupItem>)}
              </ToggleGroup>
            </section>
            <section className="tip-filter-dialog__section" aria-labelledby="tip-filter-exclude">
              <h3 id="tip-filter-exclude">استبعد هذه المحاور</h3>
              <ToggleGroup type="multiple" value={tipFilter.exclude} onValueChange={values => updateTipFilter("exclude", values)} aria-label="محاور الاستبعاد" className="tip-filter-toggle tip-filter-toggle--exclude">
                {TIP_FILTER_OPTIONS.map(option => <ToggleGroupItem key={option.key} value={option.key} aria-label={`استبعاد ${option.label}`}>{option.label}</ToggleGroupItem>)}
              </ToggleGroup>
            </section>
            <p className="tip-filter-dialog__count">المتاح الآن: <b>{filteredTips.length}</b> من {gameCatalog.tips.length} نصيحة.</p>
            <div className="tip-filter-dialog__actions">
              <button className="secondary-button" onClick={() => setTipFilter({ ...DEFAULT_TIP_FILTER })}>إعادة العرض المختلط</button>
              <button className="primary-button" onClick={() => setShowTipFilter(false)}>تم</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {showStats ? (
        <Dialog title="إحصائيات الجلسة" onClose={() => setShowStats(false)}>
          <div className="stats-grid"><div><span>جلسات بدأت</span><strong>{session?.startedSessions || 0}</strong></div><div><span>بطاقات فُتحت</span><strong>{session?.served || 0}</strong></div><div><span>نصائح ظهرت</span><strong>{session?.totalTipsShown || 0}</strong></div></div>
        </Dialog>
      ) : null}

      {showHelp ? (
        <Dialog title="تعليمات اللعبة" onClose={() => setShowHelp(false)}>
          <div className="help-copy"><p>بعد فتح البطاقة، يمكن لمن عليه الدور أن يجيب عنها أو يتخطاها أو يختار عقوبة لطيفة. ينتقل الدور بعد الإجابة أو العقوبة، ويبقى مع اللاعب نفسه عند التخطي.</p><p>يمكنكما فتح البطاقات من لوحة المفاتيح بالأرقام <kbd>1</kbd> إلى <kbd>9</kbd>، ويُستخدم <kbd>0</kbd> لفتح البطاقة العاشرة في الجولة الأفقية.</p><button className="secondary-button" onClick={restartOnboarding}>إعادة عرض الجولة التعريفية</button></div>
        </Dialog>
      ) : null}

      {showSettings ? (
        <Dialog title="الإعدادات" onClose={() => setShowSettings(false)}>
          <div className="settings-dialog">
            <p role="status">{offlineReady ? "اللعبة جاهزة للعمل دون اتصال على هذا الجهاز." : "يتطلب تجهيز اللعب دون اتصال زيارة متصلة في متصفح يدعم هذه الميزة."}</p>
            <p className="settings-dialog__intro">خيارات تُحفظ على هذا الجهاز وتساعدكما على تخصيص التجربة من دون التأثير في محتوى اللعبة المشترك.</p>
            <section className="settings-dialog__section" aria-labelledby="settings-appearance-title">
              <div><h3 id="settings-appearance-title">المظهر</h3><p>اختارا الواجهة الأنسب للضوء المحيط بكما.</p></div>
              <button className="secondary-button settings-dialog__control" aria-pressed={darkMode} onClick={toggleTheme}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}{darkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}</button>
            </section>
            <section className="settings-dialog__section"><div><h3>راحة القراءة</h3><p>يزيد تباعد نص السؤال زيادة محدودة فقط.</p></div><button className="secondary-button settings-dialog__control" aria-pressed={readingComfort} onClick={() => setReadingComfort(value => !value)}>{readingComfort ? "العودة للقراءة القياسية" : "تفعيل قراءة مريحة"}</button></section>
            {shouldShowWhatsNew(lastSeenVersion) ? <section className="settings-dialog__section"><div><h3>ما الجديد</h3><p>راجعا التحسينات عندما يناسبكما، من دون مقاطعة بدء الجلسة.</p></div><button className="secondary-button settings-dialog__control" onClick={() => { setShowSettings(false); setShowWhatsNew(true); }}>عرض التحديثات</button></section> : null}
            <section className="settings-dialog__section" aria-labelledby="settings-guide-title">
              <div><h3 id="settings-guide-title">الجولة التعريفية</h3><p>أعيدوا الشرح التفاعلي في أي وقت؛ سيصاحبكم بحسب الشاشة المفتوحة الآن.</p></div>
              <button className="secondary-button settings-dialog__control" onClick={restartOnboarding}><RotateCw size={17} /> إعادة عرض الجولة</button>
            </section>
            <section className="settings-dialog__section" aria-labelledby="settings-help-title">
              <div><h3 id="settings-help-title">مساعدة اللعبة</h3><p>راجعا قواعد الجلسة واختصارات البطاقات من نافذة مختصرة.</p></div>
              <button className="secondary-button settings-dialog__control" onClick={() => { setShowSettings(false); setShowHelp(true); }}><CircleHelp size={17} /> فتح التعليمات</button>
            </section>
            {pwaInstallAvailable ? <section className="settings-dialog__section settings-dialog__section--install" aria-labelledby="settings-install-title">
              <div><h3 id="settings-install-title">تثبيت حديث القلوب</h3><p>ثبّتا اللعبة كتطبيق مستقل للوصول الأسرع من شاشة الجهاز.</p></div>
              <button className="primary-button settings-dialog__control" onClick={() => void installPWA()}><Download size={17} /> تثبيت التطبيق</button>
            </section> : null}
            <AppUpdateSettings available={pwaUpdateReady} beforeUpdate={persistBeforeUpdate} />
          </div>
        </Dialog>
      ) : null}

      {showWhatsNew ? (
        <Dialog title="الجديد في حديث القلوب">
          <div className="whats-new-dialog">
            <p className="whats-new-dialog__intro">أضفنا ما فاتك منذ آخر زيارة. هذه النافذة تظهر بعد إتمام الجولة التعريفية حتى تبدأ التجربة بوضوح.</p>
            <div className="changelog-list">
              {unseenChangelogEntries(lastSeenVersion).map(entry => (
                <section className="changelog-entry" key={entry.version} aria-labelledby={`changelog-${entry.version}`}>
                  <header><h3 id={`changelog-${entry.version}`}>الإصدار {entry.version}</h3><time dateTime={entry.date}>{entry.date}</time></header>
                  <ul>{entry.items.map(item => <li key={`${entry.version}-${item.text}`}><span className={`changelog-item__badge changelog-item__badge--${item.type}`}>{item.type === "feature" ? "ميزة" : item.type === "fix" ? "تحسين" : "محتوى"}</span><span>{item.text}</span></li>)}</ul>
                </section>
              ))}
            </div>
            <button className="primary-button whats-new-dialog__done" onClick={dismissWhatsNew}>تم</button>
          </div>
        </Dialog>
      ) : null}

      {showEndSession ? (
        <Dialog title="إنهاء الجلسة" onClose={() => setShowEndSession(false)}>
          <div className="help-copy"><p>يمكنكما حفظ هذه الجلسة والعودة إليها لاحقاً، أو حذفها نهائياً والبدء من جديد.</p></div>
          <button className="primary-button" onClick={endWithSave}>حفظ الجلسة وإنهاؤها</button>
          <button className="secondary-button" onClick={() => { setShowEndSession(false); resetSession(); }}>حذف الجلسة وإنهاؤها</button>
        </Dialog>
      ) : null}

      <OnboardingTour open={onboardingActive} screen={screen} activeCardOpen={Boolean(activeCard)} stepIndex={onboardingStep} onStepChange={setOnboardingStep} onComplete={completeOnboarding} />
    </main>
  );
}
