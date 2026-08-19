import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  GameCard,
  CommunityGameContent,
  GameTip,
  LEVEL_LABELS,
  choosePenalty,
  chooseTip,
  createGameCatalog,
  generateRound,
  roundSizeForViewport,
  searchUrlForTip,
} from "@/lib/game";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  HeartHandshake,
  Lightbulb,
  LogIn,
  Moon,
  PartyPopper,
  RotateCw,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Sun,
  Users,
  X,
} from "lucide-react";
import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type Screen = "welcome" | "starter" | "game";
type ActionOutcome = "answered" | "skipped" | "penalty";

type GameSession = {
  players: [string, string];
  currentPlayer: 0 | 1;
  round: GameCard[];
  recentPrompts: string[];
  served: number;
  tipHistory: GameTip[];
  startedSessions: number;
};

const STORAGE_KEY = "hadith-alqulub-platform-session-v1";

function loadSession(): GameSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: GameSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
  return (
    <div className={`dialog-backdrop ${variant === "question" ? "question-dialog-backdrop" : ""}`} role="presentation">
      <section className={`dialog-panel ${variant === "question" ? "question-overlay-panel" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
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
  const { user, isAuthenticated, loading, logout } = useAuth();
  const publicContentQuery = trpc.content.listPublished.useQuery();
  const mySuggestionsQuery = trpc.content.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [screen, setScreen] = useState<Screen>("welcome");
  const [playerOne, setPlayerOne] = useState("");
  const [playerTwo, setPlayerTwo] = useState("");
  const [session, setSession] = useState<GameSession | null>(null);
  const [restorableSession, setRestorableSession] = useState<GameSession | null>(null);
  const [activeCard, setActiveCard] = useState<GameCard | null>(null);
  const [penalty, setPenalty] = useState<string | null>(null);
  const [tip, setTip] = useState<GameTip | null>(null);
  const [showTipHistory, setShowTipHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showEndSession, setShowEndSession] = useState(false);
  const [completedRound, setCompletedRound] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notice, setNotice] = useState("");

  const gameCatalog = useMemo(() => {
    const publicContent = (publicContentQuery.data ?? []) as CommunityGameContent[];
    const privateContent = (mySuggestionsQuery.data ?? [])
      .filter(item => item.status === "pending" || item.status === "rejected")
      .map(item => ({
        kind: item.kind,
        level: item.level,
        body: item.body,
        summary: item.summary,
        narrator: item.narrator,
        source: item.source,
        sourceUrl: item.sourceUrl,
      })) as CommunityGameContent[];
    return createGameCatalog([...publicContent, ...privateContent]);
  }, [publicContentQuery.data, mySuggestionsQuery.data]);

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const stored = loadSession();
    if (stored?.players?.[0] && stored?.players?.[1] && Array.isArray(stored.round)) {
      setRestorableSession(stored);
    }
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  useEffect(() => {
    if (!completedRound || activeCard || penalty || tip) return;
    const timer = window.setTimeout(() => createNextRound(), 2400);
    return () => window.clearTimeout(timer);
  }, [completedRound, activeCard, penalty, tip]);

  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if (!session || activeCard || penalty || tip || showHelp || showStats || showTipHistory) return;
      const cardIndex = event.key === "0" ? 9 : Number(event.key) - 1;
      if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= session.round.length) return;
      event.preventDefault();
      openCard(session.round[cardIndex]!);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session, activeCard, penalty, tip, showHelp, showStats, showTipHistory]);

  const currentPlayerName = session ? session.players[session.currentPlayer] : "";
  const roundProgress = session ? Math.min(100, Math.round((session.round.length / 10) * 100)) : 0;

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function showScreen(next: Screen) {
    setScreen(next);
    window.setTimeout(() => document.querySelector<HTMLElement>("[data-screen-title]")?.focus(), 0);
  }

  function startSession(starter: 0 | 1) {
    const one = playerOne.trim();
    const two = playerTwo.trim();
    if (!one || !two) {
      notify("الرجاء إدخال الاسمين للمتابعة");
      return;
    }
    if (one === two) {
      notify("الرجاء إدخال اسمين مختلفين");
      return;
    }
    const count = roundSizeForViewport();
    setSession({
      players: [one, two],
      currentPlayer: starter,
      round: generateRound(count, [], gameCatalog.questions),
      recentPrompts: [],
      served: 0,
      tipHistory: [],
      startedSessions: 1,
    });
    setCompletedRound(false);
    showScreen("game");
    notify("تم بدء جولة أسئلة جديدة");
  }

  function resumeSession() {
    if (!restorableSession) return;
    setSession(restorableSession);
    setPlayerOne(restorableSession.players[0]);
    setPlayerTwo(restorableSession.players[1]);
    setRestorableSession(null);
    showScreen("game");
    notify("تم استعادة الجلسة بنجاح");
  }

  function openCard(card: GameCard) {
    if (!session) return;
    setSession(current =>
      current
        ? {
            ...current,
            round: current.round.filter(item => item.id !== card.id),
            recentPrompts: [...current.recentPrompts, card.prompt].slice(-24),
          }
        : current,
    );
    setActiveCard(card);
  }

  function resolveAction(outcome: ActionOutcome) {
    if (!session) return;
    const served = session.served + 1;
    const isLastCard = session.round.length === 0;
    setSession(current =>
      current
        ? {
            ...current,
            served,
            currentPlayer: outcome === "skipped" ? current.currentPlayer : current.currentPlayer === 0 ? 1 : 0,
          }
        : current,
    );
    setActiveCard(null);
    if (served % 5 === 0) {
      const newTip = chooseTip(gameCatalog.tips);
      setTip(newTip);
      setSession(current => (current ? { ...current, tipHistory: [...current.tipHistory, newTip].slice(-30) } : current));
    }
    if (isLastCard) {
      setCompletedRound(true);
      notify("أحسنتم! أكملتم الجولة");
    } else if (outcome === "skipped") {
      notify("تخطي السؤال");
    } else {
      notify("انتقل الدور للاعب التالي");
    }
  }

  function handlePenalty() {
    setActiveCard(null);
    setPenalty(choosePenalty(gameCatalog.penalties));
  }

  function finishPenalty() {
    setPenalty(null);
    resolveAction("penalty");
  }

  function createNextRound() {
    setSession(current => {
      if (!current) return current;
      const count = roundSizeForViewport();
      return { ...current, round: generateRound(count, current.recentPrompts, gameCatalog.questions) };
    });
    setCompletedRound(false);
    notify("تم بدء جولة أسئلة جديدة");
  }

  function resetSession() {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setRestorableSession(null);
    setActiveCard(null);
    setPenalty(null);
    setTip(null);
    setCompletedRound(false);
    showScreen("welcome");
    notify("يمكنكم بدء جلسة جديدة الآن");
  }

  function endWithSave() {
    if (session) setRestorableSession(session);
    setShowEndSession(false);
    showScreen("welcome");
    notify("تم حفظ الجلسة ويمكن استئنافها لاحقاً");
  }

  return (
    <main className="game-shell">
      <div className="ornament ornament-top" aria-hidden="true" />
      <header className="topbar" aria-label="شريط الأدوات">
        <a className="brand" href="#top" aria-label="حديث القلوب">
          <HeartHandshake size={25} aria-hidden="true" />
          <span>حديث القلوب</span>
        </a>
        <div className="topbar-actions">
          {screen === "game" ? (
            <>
              <button className="text-button" onClick={() => setTip(chooseTip(gameCatalog.tips))}><Lightbulb size={16} /> نصيحة</button>
              <button className="text-button" onClick={() => setShowHelp(true)}><CircleHelp size={16} /> تعليمات</button>
              <button className="text-button" onClick={resetSession}><RotateCw size={16} /> جديد</button>
              <button className="text-button" onClick={() => setShowEndSession(true)}><X size={16} /> إنهاء</button>
            </>
          ) : null}
          <button className="icon-button" aria-label={darkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"} onClick={() => setDarkMode(value => !value)}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {!loading && (isAuthenticated ? (
            <>
              <Link className="text-button account-login" href="/اقتراحاتي"><Lightbulb size={16} /> اقتراحاتي</Link>
              {user?.role === "admin" ? <Link className="text-button account-login" href="/admin"><ShieldCheck size={16} /> الإدارة</Link> : null}
              <button className="account-chip" onClick={logout} title="تسجيل الخروج">
                <span className="account-avatar">{user?.name?.slice(0, 1) || "م"}</span>
                <span>{user?.name || "حسابي"}</span>
              </button>
            </>
          ) : (
            <button className="text-button account-login" onClick={() => startLogin()}><LogIn size={16} /> دخول</button>
          ))}
        </div>
      </header>

      {screen === "welcome" ? (
        <section className="welcome-panel" id="top" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <span className="eyebrow">لعبة حوارية لطيفة</span>
            <h1 id="welcome-title" data-screen-title tabIndex={-1}>قَرِّبوا القلوب<br /><em>خطوة بخطوة</em></h1>
            <p>اختاروا بطاقات الأسئلة، واصنعوا مساحة صادقة للتواصل والابتسام والإنصات.</p>
            <div className="level-pills" aria-label="مستويات اللعبة">
              {Object.values(LEVEL_LABELS).map(level => <span key={level}>{level}</span>)}
            </div>
          </div>
          <div className="welcome-card">
            <div className="card-knot" aria-hidden="true"><HeartHandshake size={42} /></div>
            <div className="form-heading"><Users size={22} /><div><h2>أسماء اللاعبين</h2><p>يمكن تعديل ترتيب الأدوار لاحقاً.</p></div></div>
            <label>اسم اللاعب الأول<input value={playerOne} onChange={event => setPlayerOne(event.target.value)} placeholder="مثال: علي" maxLength={32} /></label>
            <label>اسم اللاعب الثاني<input value={playerTwo} onChange={event => setPlayerTwo(event.target.value)} placeholder="مثال: فاطمة" maxLength={32} /></label>
            <button className="primary-button" onClick={() => showScreen("starter")}>بدء الجلسة <ArrowLeft size={18} /></button>
            {restorableSession ? <button className="secondary-button" onClick={resumeSession}>استئناف جلسة سابقة</button> : null}
          </div>
        </section>
      ) : null}

      {screen === "starter" ? (
        <section className="choice-panel" aria-labelledby="starter-title">
          <span className="eyebrow">بداية الجولة</span>
          <h1 id="starter-title" data-screen-title tabIndex={-1}>من يبدأ الحديث؟</h1>
          <p>يمكنكم الاختيار يدوياً أو ترك البداية للصدفة.</p>
          <div className="starter-grid">
            <button className="starter-card" onClick={() => startSession(0)}><span>يبدأ أولاً</span><strong>{playerOne || "اللاعب الأول"}</strong></button>
            <button className="starter-card" onClick={() => startSession(1)}><span>يبدأ أولاً</span><strong>{playerTwo || "اللاعب الثاني"}</strong></button>
          </div>
          <button className="random-button" onClick={() => startSession(Math.random() > 0.5 ? 0 : 1)}><Sparkles size={17} /> اختيار عشوائي</button>
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

          <div className={`cards-grid cards-${session.round.length}`} aria-label="بطاقات الأسئلة">
            {session.round.map((card, index) => (
              <button className={`question-card card-tone-${index % 3}`} key={card.id} onClick={() => openCard(card)} aria-label={`بطاقة ${index + 1} من ${session.round.length}`}>
                <span className="card-number">{index === 9 ? "0" : index + 1}</span>
                <img src="/manus-storage/hadith-alqulub-card-stamp_bad7c2b8.png" alt="" className="card-stamp" />
              </button>
            ))}
          </div>

          <div className="board-footer">
            <div className="footer-stat"><span className="progress-line"><i style={{ width: `${roundProgress}%` }} /></span><span>{session.round.length} متبقية في هذه الجولة</span></div>
            <div className="footer-actions">
              <button className="footer-button" onClick={() => setShowTipHistory(true)}><BookOpen size={17} /> سجل النصائح <b>{session.tipHistory.length}</b></button>
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
              <div className="legacy-question-card__mark" aria-hidden="true">♡</div>
            </article>
            <div className="question-actions" aria-label="خيارات السؤال">
              <button className="primary-button" onClick={() => resolveAction("answered")}><Check size={18} /> أجبت على السؤال</button>
              <button className="secondary-button" onClick={() => resolveAction("skipped")}><SkipForward size={18} /> تخطي السؤال</button>
              <button className="subtle-button" onClick={handlePenalty}>لم أستطع الإجابة</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      {penalty ? <Dialog title="عقوبة لطيفة"><div className="penalty-dialog"><PartyPopper size={35} /><p>{penalty}</p><button className="primary-button" onClick={finishPenalty}>تم</button></div></Dialog> : null}

      {tip ? (
        <Dialog title="نصيحة اليوم" onClose={() => setTip(null)}>
          <article className="tip-dialog">
            <blockquote>{tip.text}</blockquote>
            {tip.summary ? <p>{tip.summary}</p> : null}
            <small>{tip.narrator}{tip.source ? ` — ${tip.source}` : ""}</small>
            <a href={tip.sourceUrl || searchUrlForTip(tip)} target="_blank" rel="noreferrer">{tip.sourceUrl ? "تحقق من المصدر" : "ابحث عن النص"}</a>
          </article>
        </Dialog>
      ) : null}

      {showTipHistory ? (
        <Dialog title="سجل النصائح المعروضة" onClose={() => setShowTipHistory(false)}>
          <div className="history-list">
            {session?.tipHistory.length ? session.tipHistory.slice().reverse().map(item => <button key={`${item.id}-${item.text}`} onClick={() => setTip(item)}><Lightbulb size={18} /><span><b>{item.narrator}</b><small>{item.text}</small></span><ChevronLeft size={18} /></button>) : <p className="empty-copy">لم تظهر نصيحة بعد في هذه الجلسة.</p>}
          </div>
        </Dialog>
      ) : null}

      {showStats ? (
        <Dialog title="إحصائيات الجلسة" onClose={() => setShowStats(false)}>
          <div className="stats-grid"><div><span>جلسات بدأت</span><strong>{session?.startedSessions || 0}</strong></div><div><span>بطاقات كُشفت</span><strong>{session?.served || 0}</strong></div><div><span>نصائح معروضة</span><strong>{session?.tipHistory.length || 0}</strong></div></div>
        </Dialog>
      ) : null}

      {showHelp ? (
        <Dialog title="تعليمات اللعبة" onClose={() => setShowHelp(false)}>
          <div className="help-copy"><p>اختاروا بطاقة ثم أجيبوا عنها أو تخطوها أو انتقلوا إلى عقوبة لطيفة. ينتقل الدور بعد الإجابة أو العقوبة، ويبقى مع اللاعب نفسه عند التخطي.</p><p>يمكن فتح البطاقات من لوحة المفاتيح بالأرقام <kbd>1</kbd> إلى <kbd>9</kbd>، ويُستخدم <kbd>0</kbd> للبطاقة العاشرة في الجولة الأفقية.</p></div>
        </Dialog>
      ) : null}

      {showEndSession ? (
        <Dialog title="إنهاء الجلسة" onClose={() => setShowEndSession(false)}>
          <div className="help-copy"><p>يمكنكم حفظ هذه الجلسة والعودة إليها لاحقاً، أو حذفها نهائياً والبدء من جديد.</p></div>
          <button className="primary-button" onClick={endWithSave}>حفظ وإنهاء</button>
          <button className="secondary-button" onClick={() => { setShowEndSession(false); resetSession(); }}>إنهاء وحذف الجلسة</button>
        </Dialog>
      ) : null}

      {notice ? <div className="toast" role="status">{notice}</div> : null}
    </main>
  );
}
