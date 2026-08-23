/* ======================
 * تطبيق اللعبة (Vanilla JS)
 * ====================== */

/* ====== 0) ثوابت عامة وأعلام ====== */
const STORAGE_KEY = "hc_meta_v1";
const STORAGE_KEY_LEGACY = "hadith_alqulub_meta_v1";
const ACTIVE_SESSION_KEY = "hc_active_session_v1";
const THEME_STORAGE_KEY = "hc_theme_v1";
const SESSION_TTL_DAYS = 7;
const ERROR_LOG_KEY = "hc_error_log_v1";
const ERROR_LOG_MAX = 50;
const DEBUG_MODE = false; // Set to true for development debugging

const RECENT_QUESTIONS_LIMIT = 100;
const TIP_FREQUENCY = 5;
const MIN_SKELETON_MS = 350;
const CARD_FLASH_DURATION = 220;

function debugLog(type, ...args) {
  if (DEBUG_MODE) {
    console[type] ? console[type](...args) : console.log(...args);
  }
}

/* ====== 1) البيانات (تُحمّل من data.js) ====== */
const DATA = window.HC_DATA || {};
const QUESTIONS_BY_LEVEL = DATA.QUESTIONS || {};
const PUNISHMENTS = DATA.PUNISHMENTS || [];
const DAILY_TIPS = DATA.DAILY_TIPS || [];
const HADITH_EXPLANATIONS = DATA.HADITH_EXPLANATIONS || {};
const LEVEL_LABELS = DATA.LEVEL_LABELS || {};

/* ====== 2) الحالة + التخزين ====== */
const state = {
  names: { p1: "الشريك ١", p2: "الشريك ٢" },
  currentPlayer: "p1",
  questionsServed: 0,
  allQuestions: {},
  currentBatch: { questions: [], used: [] },
  sessionUsedIds: new Set(),
  meta: { 
    recentQuestions: [], 
    usedTips: [], 
    tipsHistory: [],
    usedPunishments: [],
    sessionCount: 0 
  },
  ui: {
    isOverlayOpen: false,
    isProcessingQuestion: false,
    hasShownStorageWarning: false,
    isAutoBatching: false,
    toastTimeoutId: null,
    lastFocusedEl: null
  }
};
let activeQuestion = null;

/**
 * Robust shuffle using Fisher-Yates algorithm with explicit swap.
 */
function shuffleArray(array) {
  if (!Array.isArray(array)) return [];
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * Checks if localStorage is available and writable.
 */
function checkStorageAvailability() {
  try {
    const key = "__hc_storage_test__";
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    debugLog("warn", "التخزين المحلي غير متاح.");
    return false;
  }
}

let storageAvailable = checkStorageAvailability();

/**
 * Safely parses a JSON string, returning a fallback value on error.
 */
function safeParse(json, fallback = {}) {
  try {
    return JSON.parse(json) || fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Simple HTML escape to prevent XSS from dynamic strings
 */
function escapeHTML(str) {
  if (!str) return "";
  return str.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ====== 3) DOM & UI Elements ====== */
const screens = {
  welcome: document.getElementById("screen-welcome"),
  resume: document.getElementById("screen-resume"),
  choose:  document.getElementById("screen-choose-player"),
  board:   document.getElementById("screen-board")
};
const player1Input = document.getElementById("player1Input");
const player2Input = document.getElementById("player2Input");
const player1NameDisplay = document.getElementById("player1NameDisplay");
const player2NameDisplay = document.getElementById("player2NameDisplay");
const currentPlayerLabel = document.getElementById("currentPlayerLabel");
const batchRemainingSpan = document.getElementById("batchRemaining");
const answeredCountSpan = document.getElementById("answeredCount");
const cardsGrid = document.getElementById("cardsGrid");
const questionOverlay = document.getElementById("questionOverlay");
const punishmentOverlay = document.getElementById("punishmentOverlay");
const tipOverlay = document.getElementById("tipOverlay");
const statsOverlay = document.getElementById("statsOverlay");
const helpOverlay = document.getElementById("helpOverlay");
const questionCardEl = document.getElementById("questionCard");
const cardLevelEl = document.getElementById("cardLevel");
const cardQuestionEl = document.getElementById("cardQuestion");
const punishmentTextEl = document.getElementById("punishmentText");
const tipArabicEl = document.getElementById("tipArabic");
const tipTranslationEl = document.getElementById("tipTranslation");
const tipExplanationEl = document.getElementById("tipExplanation");
const tipMetaEl = document.getElementById("tipMeta");
const statsContentEl = document.getElementById("statsContent");
const toastEl = document.getElementById("toast");
const newBatchBtn = document.getElementById("newBatchBtn");
const endSessionBtn = document.getElementById("endSessionBtn");
const batchProgressCircle = document.getElementById("batchProgress");
const progressContainer = document.querySelector(".progress-container");
const boardHeader = document.querySelector(".board-header");

const confirmOverlay = document.getElementById("confirmOverlay");
const confirmMessageEl = document.getElementById("confirmMessage");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

/* ====== 4) Storage & State Hydration ====== */
function loadMeta() {
  if (!storageAvailable) return state.meta;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!raw) return state.meta;
    const parsed = JSON.parse(raw);
    return {
      recentQuestions: Array.isArray(parsed.recentQuestions) ? parsed.recentQuestions : [],
      usedTips: Array.isArray(parsed.usedTips) ? parsed.usedTips : [],
      usedPunishments: Array.isArray(parsed.usedPunishments) ? parsed.usedPunishments : [],
      tipsHistory: Array.isArray(parsed.tipsHistory) ? parsed.tipsHistory : [],
      sessionCount: typeof parsed.sessionCount === 'number' ? parsed.sessionCount : 0,
    };
  } catch (err) {
    handleStorageError(err);
    return state.meta;
  }
}

function saveMeta() {
  if (!storageAvailable) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.meta));
  } catch (e) {
    handleStorageError(e);
  }
}

function handleStorageError(e) {
  debugLog("warn", "Storage operation failed:", e);
  if (!state.ui.hasShownStorageWarning) {
    showToast("تحذير: مساحة التخزين غير متاحة أو ممتلئة. لن يتم حفظ التقدم.", 4000, true);
    state.ui.hasShownStorageWarning = true;
  }
}

function findQuestionById(id) {
  if (!id) return null;
  const levelKey = id.split("-")[0];
  const arr = state.allQuestions[levelKey] || [];
  return arr.find(q => q.id === id) || null;
}

function loadActiveSession() {
  if (!storageAvailable) return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;

    const parsed = safeParse(raw, null);
    if (!parsed) return null;

    // Check TTL if savedAt exists
    if (parsed.savedAt) {
        const savedAt = new Date(parsed.savedAt);
        const now = new Date();
        const daysDiff = (now - savedAt) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > SESSION_TTL_DAYS) {
            debugLog("warn", "Session expired (TTL)");
            window.localStorage.removeItem(ACTIVE_SESSION_KEY);
            return null;
        }
    }

    return parsed;
  } catch (e) {
    handleStorageError(e);
    return null;
  }
}

function hydrateSession(data) {
  if (!data) return false;
  try {
    state.names = (data.names && typeof data.names === 'object') ? data.names : { p1: "الشريك ١", p2: "الشريك ٢" };
    state.currentPlayer = (data.currentPlayer === 'p1' || data.currentPlayer === 'p2') ? data.currentPlayer : 'p1';
    state.questionsServed = Number.isFinite(data.questionsServed) ? data.questionsServed : 0;
    state.sessionUsedIds = Array.isArray(data.sessionUsedIds) ? new Set(data.sessionUsedIds) : new Set();
    if (data.currentBatch && Array.isArray(data.currentBatch.questionIds)) {
        state.currentBatch.questions = data.currentBatch.questionIds.map(findQuestionById).filter(q => q !== null);
        
        // Force new session if questions were lost/removed to avoid inconsistent UI
        if (state.currentBatch.questions.length !== data.currentBatch.questionIds.length) {
            return false;
        }

        const usedArr = Array.isArray(data.currentBatch.used) ? data.currentBatch.used : [];
        state.currentBatch.used = state.currentBatch.questions.map((_, i) => usedArr[i] === true);
    } else {
        state.currentBatch = { questions: [], used: [] };
    }
    return true;
  } catch (e) {
    debugLog("error", "Hydration failed:", e);
    return false;
  }
}

function persistSession() {
    if (!storageAvailable) return;
    try {
        const sessionData = {
            dataVersion: DATA.VERSION,
            savedAt: new Date().toISOString(),
            names: state.names,
            currentPlayer: state.currentPlayer,
            questionsServed: state.questionsServed,
            sessionUsedIds: Array.from(state.sessionUsedIds),
            currentBatch: {
                questionIds: state.currentBatch.questions.map(q => q.id),
                used: state.currentBatch.used
            }
        };
        window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
    } catch(e) {
        handleStorageError(e);
    }
}

/* ====== 5) Core Game Logic ====== */
/* ====== Sound Manager (AudioContext) ====== */
const SoundManager = {
  enabled: true,
  ctx: null,
  get context() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    return this.ctx;
  },
  playTone: (freq = 440, type = 'sine', duration = 0.1) => {
    if (!SoundManager.enabled) return;
    const ctx = SoundManager.context;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      debugLog("warn", "Audio playback failed", e);
    }
  },
  playClick: () => SoundManager.playTone(600, 'sine', 0.05),
  playSuccess: () => {
    SoundManager.playTone(500, 'sine', 0.1);
    setTimeout(() => SoundManager.playTone(800, 'sine', 0.2), 100);
  },
  playFlip: () => SoundManager.playTone(300, 'triangle', 0.1),
  playError: () => SoundManager.playTone(150, 'sawtooth', 0.2)
};

function buildAllQuestions() {
  const create = (key, arr) => {
      // Create objects first
      const objects = (arr || []).map((text, i) => ({ id: `${key}-${i}`, level: key, text }));
      // Shuffle them globally once at build time to ensure initial randomness
      return shuffleArray(objects);
  };
  
  state.allQuestions = {
    hamasat: create("hamasat", QUESTIONS_BY_LEVEL.hamasat),
    nabd:    create("nabd", QUESTIONS_BY_LEVEL.nabd),
    aamaq:   create("aamaq", QUESTIONS_BY_LEVEL.aamaq),
    jawhar:  create("jawhar", QUESTIONS_BY_LEVEL.jawhar)
  };
}

function showScreen(key) {
  Object.values(screens).forEach(s => s && s.classList.remove("screen--active"));
  if (screens[key]) screens[key].classList.add("screen--active");
}

function handleStartSession() {
  triggerHaptic();
  SoundManager.playSuccess();
  const p1 = player1Input.value.trim();
  const p2 = player2Input.value.trim();
  if (!p1 || !p2) return showToast(DATA.UI_MESSAGES.enterNames);
  if (p1 === p2) return showToast(DATA.UI_MESSAGES.differentNames);
  if (p1.length > 20 || p2.length > 20) return showToast("أسماء قصيرة من فضلك (أقل من 20 حرف)");

  Object.assign(state, {
    names: { p1, p2 },
    currentPlayer: "p1",
    questionsServed: 0,
    sessionUsedIds: new Set(),
    currentBatch: { questions: [], used: [] },
    meta: { 
      ...state.meta, 
      sessionCount: (state.meta.sessionCount || 0) + 1,
      tipsHistory: [] 
    }
  });
  
  player1NameDisplay.textContent = p1;
  player2NameDisplay.textContent = p2;
  
  saveMeta();
  updateTipsHistoryCounter();
  updateCurrentPlayerLabel();
  showScreen("choose");
}

function handleResumeSession() {
    triggerHaptic();
    if (hydrateSession(loadActiveSession())) {
        player1NameDisplay.textContent = state.names.p1;
        player2NameDisplay.textContent = state.names.p2;
        updateCurrentPlayerLabel();
        updateBatchRemaining();
        renderCardsGrid();
        showScreen("board");
        showToast("تم استعادة الجلسة بنجاح");
    } else {
        if (storageAvailable) localStorage.removeItem(ACTIVE_SESSION_KEY);
        showToast("فشل استعادة الجلسة. يرجى بدء جلسة جديدة.");
        showScreen("welcome");
    }
}

function chooseFirstPlayer(method, manualChoice) {
  triggerHaptic();
  SoundManager.playClick();
  if (method === "manual") state.currentPlayer = manualChoice;
  else if (method === "random") state.currentPlayer = Math.random() < 0.5 ? "p1" : "p2";
  
  updateCurrentPlayerLabel();
  showScreen("board");
  createNewBatch();
  
  persistSession();
  showToast(DATA.UI_MESSAGES.whosTurn + state.names[state.currentPlayer], 2500, true);
}

function pickQuestionsForLevel(levelKey, count) {
  // allQuestions are already shuffled at build time
  const all = state.allQuestions[levelKey] || [];
  const recentSet = new Set(state.meta.recentQuestions);
  const sessionSet = state.sessionUsedIds;
  
  // 1. Filter out used questions to find candidates
  let candidates = all.filter(q => !sessionSet.has(q.id) && !recentSet.has(q.id));
  
  // 2. If not enough candidates, recycle recent questions (but not session used ones)
  if (candidates.length < count) {
      const recycled = all.filter(q => !sessionSet.has(q.id) && recentSet.has(q.id));
      // Shuffle recycled questions before appending to avoid deterministic repetition order
      candidates = candidates.concat(shuffleArray(recycled));
  }
  
  // 3. If still not enough, recycle session questions (emergency fallback)
  if (candidates.length < count) {
       const emergency = all.filter(q => sessionSet.has(q.id));
       candidates = candidates.concat(shuffleArray(emergency));
  }
  
  // 4. Since 'all' was pre-shuffled, and we filtered preserving order (mostly),
  // taking the first 'count' items effectively picks random unique items.
  // However, to be absolutely safe against browser sort stability quirks,
  // we shuffle the final candidate pool before slicing.
  // Wait, if we shuffle 'candidates', we lose the "least recently used" property implied by the list order?
  // Actually, 'all' is random. 'recentSet' is just a set.
  // So 'candidates' are just "unused randoms".
  
  // Let's just shuffle the candidates to be sure.
  return shuffleArray(candidates).slice(0, count);
}

function showCardsSkeleton(count = 9) {
    if (cardsGrid) {
        cardsGrid.innerHTML = Array(count).fill('<div class="card-skel skeleton"></div>').join('');
    }
}

function createNewBatch() {
  showCardsSkeleton(9);
  const start = performance.now();
  const batch = [
    ...pickQuestionsForLevel("hamasat", 3), ...pickQuestionsForLevel("nabd", 3),
    ...pickQuestionsForLevel("aamaq", 2), ...pickQuestionsForLevel("jawhar", 1)
  ];
  
  if (batch.length === 0) {
    showToast(DATA.UI_MESSAGES.questionsReset, 4000);
    state.sessionUsedIds = new Set();
    state.meta.recentQuestions = [];
    saveMeta();
    setTimeout(createNewBatch, 1000);
    return;
  }

  state.currentBatch.questions = shuffleArray(batch);
  state.currentBatch.used = new Array(batch.length).fill(false);
  persistSession();
  
  updateBatchRemaining();
  if (newBatchBtn) newBatchBtn.style.display = "none";
  
  const elapsed = performance.now() - start;
  setTimeout(renderCardsGrid, Math.max(0, MIN_SKELETON_MS - elapsed));
}

function renderCardsGrid() {
  cardsGrid.innerHTML = "";
  state.currentBatch.questions.forEach((q, index) => {
    if (state.currentBatch.used[index]) {
      const slot = document.createElement("div");
      slot.className = "card-slot-empty";
      cardsGrid.appendChild(slot);
    } else {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `card-back card-back--${q.level}`;
      card.dataset.index = index;
      card.setAttribute("aria-label", `بطاقة سؤال من مستوى ${LEVEL_LABELS[q.level] || q.level}`);
      card.innerHTML = `<div class="card-back__inner"><img src="assets/card-stamp.png" alt="شعار" class="card-stamp" /></div>`;
      card.addEventListener("click", () => openCard(index, card));
      cardsGrid.appendChild(card);
    }
  });
}

function openCard(index, cardEl) {
  if (!cardEl || cardEl.classList.contains("card-hit") || state.ui.isProcessingQuestion || state.ui.isOverlayOpen) return;
  
  state.ui.isProcessingQuestion = true; // Prevent double-click immediately
  triggerHaptic();
  SoundManager.playFlip();
  
  cardEl.classList.add("card-hit");
  cardEl.style.transform = "rotateY(180deg)"; // Simple flip
  
  // Consume question immediately but DELAY rerender to keep animation visible
  consumeQuestion(index, state.currentBatch.questions[index].id, { rerender: false });

  setTimeout(() => {
    activeQuestion = { index, question: state.currentBatch.questions[index] };
    setCardLevelAndQuestion(activeQuestion.question.level, activeQuestion.question.text);
    openOverlay(questionOverlay);
    
    // Rerender now that overlay is open and card flip is done
    renderCardsGrid();
    
    // Reset flip so it's ready for next time (visually hidden by overlay anyway)
    setTimeout(() => { cardEl.style.transform = ""; }, 300);
  }, 350);
}

function triggerFeedbackAnimation(animationClass) {
  if (!questionCardEl) return;
  questionCardEl.classList.remove(animationClass);
  void questionCardEl.offsetWidth; // Force reflow
  questionCardEl.classList.add(animationClass);
  setTimeout(() => questionCardEl.classList.remove(animationClass), 500);
}

function handleQuestionAction(nextTurn) {
  triggerHaptic();
  SoundManager.playSuccess();
  // Question was already consumed in openCard
  closeQuestionOverlay();
  maybeShowTip();
  checkAndShowNewBatchIfNeeded();
  if (nextTurn) nextTurn();
}

function consumeQuestion(index, id, opts = { rerender: true }) {
  if (index === undefined) return;
  state.currentBatch.used[index] = true;
  state.questionsServed++;
  state.sessionUsedIds.add(id);
  updateRecentQuestions(id);
  persistSession();
  
  if (opts.rerender) {
    renderCardsGrid();
  }
  updateBatchRemaining(); // Ensure counter updates instantly
}

function updateRecentQuestions(id) {
  state.meta.recentQuestions.push(id);
  if (state.meta.recentQuestions.length > RECENT_QUESTIONS_LIMIT) {
    state.meta.recentQuestions.splice(0, state.meta.recentQuestions.length - RECENT_QUESTIONS_LIMIT);
  }
  saveMeta();
}

function advanceTurn() {
  state.currentPlayer = state.currentPlayer === "p1" ? "p2" : "p1";
  updateCurrentPlayerLabel();
  showToast(DATA.UI_MESSAGES.nextTurn + state.names[state.currentPlayer]);
  persistSession();
}

/* ====== Confetti Manager ====== */
const ConfettiManager = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  
  init() {
    this.canvas = document.getElementById('confetti-canvas');
    if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
  },
  
  resize() {
    if(this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
  },
  
  createParticle() {
    const colors = ['#e29b68', '#d66d75', '#8e7cc3', '#5b7da3', '#ffd700'];
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height - this.canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    };
  },
  
  start(duration = 3000) {
    if (!this.canvas) this.init();
    if (!this.canvas) return;
    
    this.particles = Array.from({ length: 150 }, () => this.createParticle());
    
    const animate = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      let activeParticles = 0;
      
      this.particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;
        
        if (p.y < this.canvas.height) {
            activeParticles++;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();
        }
      });
      
      if (activeParticles > 0) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.stop();
      }
    };
    
    cancelAnimationFrame(this.animationId);
    animate();
  },
  
  stop() {
    cancelAnimationFrame(this.animationId);
    if(this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
};

function checkAndShowNewBatchIfNeeded() {
  if (state.currentBatch.used.every(u => u)) {
    if (state.ui.isAutoBatching) return;
    state.ui.isAutoBatching = true;
    
    SoundManager.playSuccess();
    ConfettiManager.start();
    
    showToast(DATA.UI_MESSAGES.roundCompleted, 3000);
    setTimeout(() => {
      createNewBatch();
      state.ui.isAutoBatching = false;
    }, 3500);
  }
}

function maybeShowTip() {
  if (state.questionsServed > 0 && state.questionsServed % TIP_FREQUENCY === 0) {
    showDailyTip();
  }
}

/* ====== 6) UI & Overlay Functions ====== */
function updateCurrentPlayerLabel() { currentPlayerLabel.textContent = state.names[state.currentPlayer]; }
function updateBatchRemaining() {
  const answered = state.currentBatch.used.filter(u => u).length;
  const total = state.currentBatch.questions.length;
  const remaining = total - answered;
  
  if (batchRemainingSpan) batchRemainingSpan.textContent = remaining;
  if (answeredCountSpan) answeredCountSpan.textContent = answered;

  // Update Circular Progress
  if (progressContainer) {
    progressContainer.setAttribute("aria-valuenow", answered);
    progressContainer.setAttribute("aria-valuemax", total);
  }

  if (batchProgressCircle) {
    const radius = batchProgressCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    // Set static dasharray if not set
    batchProgressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // Calculate offset:
    const offset = circumference - ((answered / total) * circumference);
    batchProgressCircle.style.strokeDashoffset = offset;
  }

  // Update Turn Indicator
  if (boardHeader) {
    boardHeader.classList.remove("turn-active-p1", "turn-active-p2");
    boardHeader.classList.add(state.currentPlayer === "p1" ? "turn-active-p1" : "turn-active-p2");
  }

  if (newBatchBtn) {
    newBatchBtn.style.display = remaining === 0 ? "inline-flex" : "none";
  }
}

function setCardLevelAndQuestion(levelKey, text) {
  questionCardEl.className = 'hc-card';
  // Remove old theme classes if any (handled by resetting className)
  if (levelKey) {
      questionCardEl.classList.add(`theme-${levelKey}`);
  }
  cardLevelEl.textContent = LEVEL_LABELS[levelKey] || "";
  cardQuestionEl.textContent = text;
}

function openOverlay(overlay) {
  if (state.ui.isOverlayOpen && overlay !== questionOverlay) return;
  state.ui.isOverlayOpen = true;
  overlay.classList.remove("overlay--hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  trapFocus(overlay);
}

function closeOverlay(overlay) {
  triggerHaptic();
  overlay.classList.add("overlay--hidden");
  overlay.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".overlay:not(.overlay--hidden)")) {
    document.body.style.overflow = "";
    state.ui.isOverlayOpen = false;
  }
  releaseFocus();
}

/**
 * Custom Confirmation Dialog replacing native confirm()
 */
function showConfirm(message, onConfirm, onCancel = null) {
  if (!confirmOverlay || !confirmMessageEl) {
    if (confirm(message)) { if (onConfirm) onConfirm(); }
    else { if (onCancel) onCancel(); }
    return;
  }
  
  confirmMessageEl.textContent = message;
  openOverlay(confirmOverlay);
  
  const cleanup = () => {
    confirmYesBtn.onclick = null;
    confirmNoBtn.onclick = null;
  };
  
  confirmYesBtn.onclick = () => {
    cleanup();
    closeOverlay(confirmOverlay);
    if (onConfirm) onConfirm();
  };
  
  confirmNoBtn.onclick = () => {
    cleanup();
    closeOverlay(confirmOverlay);
    if (onCancel) onCancel();
  };
}

function closeQuestionOverlay() {
  closeOverlay(questionOverlay);
  state.ui.isProcessingQuestion = false;
  activeQuestion = null;
}

function showRandomPunishment() {
  SoundManager.playError();
  
  // Non-repeating randomization logic
  let pool = Array.from({ length: PUNISHMENTS.length }, (_, i) => i)
              .filter(i => !state.meta.usedPunishments.includes(i));
  
  if (pool.length === 0) {
    state.meta.usedPunishments = [];
    pool = Array.from({ length: PUNISHMENTS.length }, (_, i) => i);
  }
  
  const idx = pool[Math.floor(Math.random() * pool.length)];
  state.meta.usedPunishments.push(idx);
  saveMeta();

  punishmentTextEl.textContent = PUNISHMENTS[idx];
  openOverlay(punishmentOverlay);
}

function showDailyTip() {
  if (!tipArabicEl || !tipMetaEl) return;

  // Select random tip (existing logic)
  let pool = Array.from({ length: DAILY_TIPS.length }, (_, i) => i).filter(i => !state.meta.usedTips.includes(i));
  if (pool.length === 0) {
    state.meta.usedTips = [];
    pool = Array.from({ length: DAILY_TIPS.length }, (_, i) => i);
  }
  const idx = pool[Math.floor(Math.random() * pool.length)];
  state.meta.usedTips.push(idx);
  const tip = DAILY_TIPS[idx];
  saveMeta();
  displayTipInOverlay(tip);
}

/**
 * Display a tip in the main tip overlay (extracted from showDailyTip)
 * @param {Object} tip - The tip object to display
 */
function displayTipInOverlay(tip) {
  // Reset content
  tipArabicEl.textContent = "";
  if (tipTranslationEl) {
    tipTranslationEl.textContent = "";
    tipTranslationEl.style.display = "none";
  }
  if (tipExplanationEl) {
    tipExplanationEl.textContent = "";
    tipExplanationEl.style.display = "none";
  }
  tipMetaEl.innerHTML = "";

  // Arabic Content
  const quoteDiv = document.createElement('div');
  quoteDiv.className = 'tip-quote';
  quoteDiv.textContent = tip.text;
  tipArabicEl.appendChild(quoteDiv);

  const isHadith = String(tip.category || "").trim().toLowerCase() === "hadith";
  
  // Translation
  const hasTranslation = tip.translation && tip.translation.trim().length > 0;
  if (hasTranslation && (!isHadith || tip.translation.trim() !== tip.text.trim())) {
    if (tipTranslationEl) {
      tipTranslationEl.className = 'tip-translation';
      tipTranslationEl.textContent = tip.translation;
      tipTranslationEl.style.display = 'block';
    }
  }
  
  // Explanation
  const expl = isHadith ? HADITH_EXPLANATIONS[tip.text] : null;
  if (expl && expl.summary && tipExplanationEl) {
    tipExplanationEl.className = 'tip-explanation-box';
    tipExplanationEl.textContent = expl.summary;
    tipExplanationEl.style.display = 'block';
  }
  
  const categoryLabel = isHadith ? "من أحاديث أهل البيت (ع)" : "من خبراء العلاقات";
  
  // Meta elements
  const metaCat = document.createElement('span');
  metaCat.className = "tip-meta-item";
  metaCat.textContent = categoryLabel;

  const metaSpeaker = document.createElement('span');
  metaSpeaker.className = "tip-meta-item";
  metaSpeaker.style.fontWeight = "bold";
  metaSpeaker.textContent = tip.speaker;

  const metaSource = document.createElement('span');
  metaSource.className = "tip-meta-item";
  let sourceText = tip.source;
  if (tip.reference) {
    if (tip.reference.indexOf(tip.source) !== -1) {
      sourceText = tip.reference;
    } else {
      sourceText = `${tip.source} · ${tip.reference}`;
    }
  }
  metaSource.textContent = sourceText;

  // Verify link
  const searchQuery = (tip.category === "expert" && tip.textOriginal) 
    ? tip.textOriginal 
    : tip.text;
  const verifyLink = document.createElement('a');
  verifyLink.href = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  verifyLink.target = "_blank";
  verifyLink.rel = "noopener noreferrer";
  verifyLink.className = "tip-verify-link";
  verifyLink.style.marginRight = "8px";
  verifyLink.style.textDecoration = "none";
  verifyLink.title = "تحقق من المصدر";
  verifyLink.innerHTML = "🔗";

  tipMetaEl.append(metaCat, " - ", metaSpeaker, " - ", metaSource, verifyLink);

  // Show original English text toggle (only for expert tips)
  if (tip.category === "expert" && tip.textOriginal) {
    const originalBtn = document.createElement('button');
    originalBtn.type = 'button';
    originalBtn.className = 'tip-original-toggle';
    originalBtn.innerHTML = '📖 النص الأصلي (English)';
    originalBtn.setAttribute('aria-expanded', 'false');
    originalBtn.setAttribute('aria-controls', 'tipOriginalText');
    
    const originalText = document.createElement('div');
    originalText.id = 'tipOriginalText';
    originalText.className = 'tip-original-text';
    originalText.setAttribute('hidden', '');
    originalText.setAttribute('lang', 'en');
    originalText.setAttribute('dir', 'ltr');
    originalText.textContent = tip.textOriginal;
    
    originalBtn.addEventListener('click', () => {
      const isVisible = !originalText.hasAttribute('hidden');
      if (isVisible) {
        originalText.setAttribute('hidden', '');
        originalBtn.setAttribute('aria-expanded', 'false');
        originalBtn.innerHTML = '📖 النص الأصلي (English)';
      } else {
        originalText.removeAttribute('hidden');
        originalBtn.setAttribute('aria-expanded', 'true');
        originalBtn.innerHTML = '✖ إخفاء النص الأصلي';
      }
    });
    
    tipMetaEl.appendChild(originalBtn);
    tipMetaEl.appendChild(originalText);
  }

  openOverlay(tipOverlay);
}

function getSessionStats() {
  const answered = state.currentBatch.used.filter(u => u).length;
  const levelCounts = state.currentBatch.questions.reduce((acc, q, i) => {
    if (state.currentBatch.used[i]) acc[q.level] = (acc[q.level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    sessionCount: state.meta.sessionCount,
    answered,
    remaining: state.currentBatch.questions.length - answered,
    hamasatNabd: (levelCounts.hamasat || 0) + (levelCounts.nabd || 0),
    aamaqJawhar: (levelCounts.aamaq || 0) + (levelCounts.jawhar || 0)
  };
}

function renderStats(data) {
  statsContentEl.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card stat-card--full">
        <span class="stat-card__label">جلسات مكتملة</span>
        <span class="stat-card__value">${data.sessionCount}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">تمت الإجابة</span>
        <span class="stat-card__value">${data.answered}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">متبقي</span>
        <span class="stat-card__value">${data.remaining}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">همسات/نبض</span>
        <span class="stat-card__value">${data.hamasatNabd}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">أعماق/جوهر</span>
        <span class="stat-card__value">${data.aamaqJawhar}</span>
      </div>
    </div>
  `;
}

function showStats() {
  triggerHaptic();
  SoundManager.playClick();
  renderStats(getSessionStats());
  openOverlay(statsOverlay);
}

function triggerHaptic() {
  if (navigator.vibrate) {
    try {
        navigator.vibrate(10);
    } catch(e) {
        // Safe fail
    }
  }
}

function showToast(message, duration = 2500, assertive = false) {
  if (!toastEl) return;
  toastEl.setAttribute("aria-live", assertive ? "assertive" : "polite");
  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");
  if (state.ui.toastTimeoutId) clearTimeout(state.ui.toastTimeoutId);
  state.ui.toastTimeoutId = setTimeout(() => toastEl.classList.remove("toast--visible"), duration);
}

/* ====== 7) Accessibility & Theme ====== */
function trapFocus(container) {
  state.ui.lastFocusedEl = document.activeElement;
  const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
  
  container.__trapHandler = (e) => {
    if (e.key === "Escape") {
      if (container === questionOverlay) {
        closeQuestionOverlay();
      } else {
        const closeButton = container.querySelector('button[id$="CloseBtn"]') || container.querySelector('button[id$="DoneBtn"]');
        if (closeButton) closeButton.click();
      }
      return;
    }
    if (e.key !== "Tab") return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  };
  document.addEventListener("keydown", container.__trapHandler);
}

function releaseFocus() {
  if (state.ui.lastFocusedEl && typeof state.ui.lastFocusedEl.focus === "function") state.ui.lastFocusedEl.focus();
  document.querySelectorAll(".overlay").forEach(c => {
    if (c.__trapHandler) {
      document.removeEventListener("keydown", c.__trapHandler);
      delete c.__trapHandler;
    }
  });
}

function applyTheme(theme) {
  document.body.classList.toggle('dark-mode', theme === 'dark');
  if(document.getElementById('themeToggle')) {
      document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀' : '☾';
  }
}

function toggleTheme() {
  triggerHaptic();
  const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
  applyTheme(newTheme);
  if (storageAvailable) localStorage.setItem(THEME_STORAGE_KEY, newTheme);
}

function handleKeyShortcuts(e) {
    // Question overlay shortcuts
    if (!questionOverlay.classList.contains('overlay--hidden')) {
        const key = e.key.toLowerCase();
        if (key === 'a' || key === 'enter') document.getElementById('answeredBtn').click();
        else if (key === 's') document.getElementById('skipBtn').click();
        else if (key === 'p' || key === 'n') document.getElementById('noAnswerBtn').click();
        return;
    }

    // Board shortcuts (only if no other overlay is open)
    if (!state.ui.isOverlayOpen && screens.board.classList.contains('screen--active')) {
        if (/^[1-9]$/.test(e.key)) {
            const cardIndex = parseInt(e.key, 10) - 1;
            const card = cardsGrid.querySelector(`.card-back:nth-child(${cardIndex + 1})`);
            if (card) card.click();
        }
    }
}


/* ====== 8) Initializer & Event Listeners ====== */
function initializeApp() {
  if (!DATA || !DATA.QUESTIONS) {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center;font-family:'Cairo',sans-serif;background-color:#fbe4e4;color:#8b3f40;font-size:1.2rem;">فشل تحميل بيانات اللعبة الأساسية. الرجاء التأكد من اتصالك بالإنترنت وتحديث الصفحة.</div>`;
    return;
  }
  
  state.meta = loadMeta();
  buildAllQuestions();
  const savedSession = loadActiveSession();

  if (savedSession && savedSession.dataVersion === DATA.VERSION) {
      showScreen("resume");
      const summary = document.getElementById('sessionSummary');
      if (summary) {
        const p1 = escapeHTML(savedSession.names.p1);
        const p2 = escapeHTML(savedSession.names.p2);
        const current = escapeHTML(savedSession.names[savedSession.currentPlayer]);
        summary.innerHTML = `<div class="summary-row"><span>اللاعبون:</span><span class="summary-val">${p1} و ${p2}</span></div><div class="summary-row"><span>الدور الحالي:</span><span class="summary-val">${current}</span></div>`;
      }
  } else {
      if (savedSession) showToast("تم تحديث الأسئلة، بدء جلسة جديدة");
      showScreen("welcome");
  }

  applyTheme(storageAvailable ? localStorage.getItem(THEME_STORAGE_KEY) || 'light' : 'light');
  document.querySelectorAll(".overlay.overlay--hidden").forEach(o => o.setAttribute("aria-hidden", "true"));
  
  if (!navigator.onLine) showToast("أنت غير متصل بالإنترنت. ستعمل اللعبة من النسخة المحفوظة.", 3500);
}

// Global event listeners
document.getElementById("startSessionBtn").addEventListener("click", handleStartSession);
if (document.getElementById("welcomeHelpBtn")) {
    document.getElementById("welcomeHelpBtn").addEventListener("click", () => openOverlay(helpOverlay));
}
document.getElementById("resumeSessionBtn").addEventListener("click", handleResumeSession);
document.getElementById("newSessionFromResumeBtn").addEventListener("click", () => {
    triggerHaptic();
    showConfirm("هل أنت متأكد من بدء جلسة جديدة؟ سيتم فقدان الجلسة المحفوظة.", () => {
        if(storageAvailable) localStorage.removeItem(ACTIVE_SESSION_KEY);
        showScreen("welcome");
    });
});
document.getElementById("endSessionBtn").addEventListener("click", () => {
    triggerHaptic();
    showConfirm("هل أنت متأكد من إنهاء الجلسة؟ سيتم حفظ تقدمك للمتابعة لاحقًا.", () => {
        location.reload();
    });
});
document.getElementById("resetSessionBtn").addEventListener("click", () => {
    triggerHaptic();
    SoundManager.playError();
    showConfirm("هل أنت متأكد من رغبتك في مسح الجلسة الحالية والبدء من جديد تماماً؟", () => {
        if (storageAvailable) localStorage.removeItem(ACTIVE_SESSION_KEY);
        location.reload();
    });
});
document.getElementById("backToWelcomeBtn").addEventListener("click", () => { triggerHaptic(); showScreen("welcome"); });
document.getElementById("chooseP1").addEventListener("click", () => chooseFirstPlayer("manual", "p1"));
document.getElementById("chooseP2").addEventListener("click", () => chooseFirstPlayer("manual", "p2"));
document.getElementById("randomStartBtn").addEventListener("click", () => chooseFirstPlayer("random"));
document.getElementById("answeredBtn").addEventListener("click", () => handleQuestionAction(advanceTurn));
document.getElementById("skipBtn").addEventListener("click", () => {
    triggerFeedbackAnimation("animate-shake");
    setTimeout(() => handleQuestionAction(null), 300);
});
document.getElementById("noAnswerBtn").addEventListener("click", () => { 
    triggerHaptic(); 
    triggerFeedbackAnimation("animate-shake");
    setTimeout(() => {
        closeQuestionOverlay(); 
        showRandomPunishment(); 
    }, 300);
});
document.getElementById("punishmentDoneBtn").addEventListener("click", () => { handleQuestionAction(advanceTurn); closeOverlay(punishmentOverlay); });
if(newBatchBtn) newBatchBtn.addEventListener("click", () => { triggerHaptic(); if (!state.ui.isAutoBatching) createNewBatch(); });
document.getElementById("tipCloseBtn").addEventListener("click", () => closeOverlay(tipOverlay));
document.getElementById("statsBtn").addEventListener("click", showStats);
document.getElementById("statsCloseBtn").addEventListener("click", () => closeOverlay(statsOverlay));
// Sound hooks
document.getElementById("dailyTipBtn").addEventListener("click", () => { SoundManager.playClick(); showDailyTip(); });
document.getElementById("helpBtn").addEventListener("click", () => { SoundManager.playClick(); openOverlay(helpOverlay); });
document.getElementById("helpCloseBtn").addEventListener("click", () => closeOverlay(helpOverlay));
document.getElementById('themeToggle').addEventListener("click", toggleTheme);

// Toggle Sound (Using the Game Title as a hidden toggle for now, or we can add a btn)
// Or better: Let's reuse the help button area or just enable by default.
// For now, it defaults to enabled.

[player1Input, player2Input].forEach(input => input.addEventListener("keypress", (e) => { if (e.key === "Enter") handleStartSession(); }));
window.addEventListener('online', () => showToast("تم استعادة الاتصال بالإنترنت."));
window.addEventListener('offline', () => showToast("فُقد الاتصال بالإنترنت. سيتم حفظ التقدم محليًا."));
document.addEventListener('keydown', handleKeyShortcuts);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            const updateBanner = document.getElementById("update-banner");
            const updateBtn = document.getElementById("updateBtn");
            
            if (updateBanner && updateBtn) {
                updateBanner.classList.remove("toast--hidden");
                updateBtn.onclick = () => newWorker.postMessage({ type: "SKIP_WAITING" });
            } else if (toastEl) {
                // Fallback to toast UI if banner/button missing
                toastEl.innerHTML = `<span>${DATA.UI_MESSAGES.updateAvailable || 'تحديث جديد متوفر'}</span><button id="updateBtnToast" class="btn btn--small" style="margin-right:8px; background:#fff; color:#000;">${DATA.UI_MESSAGES.updateNow || 'تحديث'}</button>`;
                toastEl.classList.add('toast--visible', 'toast--update');
                const b = document.getElementById('updateBtnToast');
                if (b) b.onclick = () => newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        });
      });
      navigator.serviceWorker.oncontrollerchange = () => { if (!state.ui.isAutoBatching) window.location.reload(); };
    }).catch(err => {
        console.warn(DATA.UI_MESSAGES.swRegisterFailed, err);
        showToast("فشل تفعيل وضع العمل بدون إنترنت");
    });
  });
}

// Start the application
/* ====== Error Logging ====== */
function appendErrorLog(entryObj) {
  if (!storageAvailable || !entryObj) return;
  const raw = window.localStorage.getItem(ERROR_LOG_KEY);
  const log = safeParse(raw, []);
  
  log.push(entryObj);
  if (log.length > ERROR_LOG_MAX) {
    log.splice(0, log.length - ERROR_LOG_MAX);
  }
  
  try {
    window.localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(log));
  } catch (e) {
    // Fail silently
  }
}

window.addEventListener("error", (event) => {
  appendErrorLog({
    type: "error",
    message: event.message,
    source: event.filename,
    line: event.lineno,
    col: event.colno,
    timeISO: new Date().toISOString()
  });
});

window.addEventListener("unhandledrejection", (event) => {
  appendErrorLog({
    type: "unhandledrejection",
    message: event.reason ? event.reason.toString() : "Unknown",
    timeISO: new Date().toISOString()
  });
});

initializeApp();
