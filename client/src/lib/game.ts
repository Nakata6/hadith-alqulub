import { ORIGINAL_GAME_DATA } from "@shared/originalGameData";
import { approvedShiaHadithPresentation, CURATED_SHIA_HADITH_TIPS, formatHadithVerification, isApprovedShiaHadith, sourceUrlForApprovedShiaHadith, verificationForCuratedShiaHadith } from "@shared/hadithPublicationReview";

export const LEVELS = ["hamasat", "nabd", "aamaq", "jawhar"] as const;
export type LevelKey = (typeof LEVELS)[number];

export type GameCard = {
  id: string;
  level: LevelKey;
  prompt: string;
};

export type RoundCardState = "available" | "consumed";

export type GameTip = {
  id: string;
  text: string;
  summary: string;
  translation?: string;
  textOriginal?: string;
  narrator: string;
  source: string;
  reference?: string;
  category?: "hadith" | "expert" | "community";
  sourceUrl?: string;
};

export type RoundOutcome = "answered" | "skipped" | "penalty";

export type RoundOutcomeCounts = Record<RoundOutcome, number>;

export type RoundSummary = {
  roundNumber: number;
  totalCards: number;
  outcomes: RoundOutcomeCounts;
  playerTurns: [number, number];
  tips: GameTip[];
  sessionCardsOpened: number;
  sessionTipsShown: number;
};

export type CommunityGameContent = {
  kind: "question" | "penalty" | "tip";
  level?: LevelKey | null;
  body: string;
  summary?: string | null;
  narrator?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
};

export type GameCatalog = {
  questions: Record<LevelKey, string[]>;
  penalties: string[];
  tips: GameTip[];
};

type RawGameData = {
  QUESTIONS: Record<LevelKey, readonly string[]>;
  DAILY_TIPS?: readonly unknown[];
  PENALTIES?: readonly unknown[];
  PUNISHMENTS?: readonly unknown[];
  LEVEL_LABELS: Record<LevelKey, string>;
  EXPLANATIONS?: Record<string, { summary?: string }>;
  HADITH_EXPLANATIONS?: Record<string, { summary?: string }>;
};

const gameData = ORIGINAL_GAME_DATA as unknown as RawGameData;

export const LEVEL_LABELS = gameData.LEVEL_LABELS;
export const QUESTION_BANK = gameData.QUESTIONS;
export const ROUND_LEVEL_LIMITS = { minimum: 1, maximum: 3 } as const;

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
  }
  return copy;
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return ["text", "content", "penalty", "challenge", "title", "hadith", "quote"]
    .map(key => record[key])
    .find((candidate): candidate is string => typeof candidate === "string") ?? "";
}

function field(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  return keys
    .map(key => record[key])
    .find((candidate): candidate is string => typeof candidate === "string") ?? "";
}

const rawPenalties = gameData.PENALTIES ?? gameData.PUNISHMENTS ?? [];
export const PENALTIES = rawPenalties.map(textFromUnknown).filter(Boolean);

function sourceUrlForExpert(source: string, reference: string) {
  const label = `${source} ${reference}`;
  if (label.includes("Turn Towards")) return "https://www.gottman.com/blog/turn-toward-instead-of-away/";
  if (label.includes("Love Maps")) return "https://www.gottman.com/blog/build-love-maps/";
  if (label.includes("5:1 Ratio")) return "https://www.gottman.com/blog/the-magic-ratio-the-key-to-relationship-satisfaction/";
  if (label.includes("Soft Start-up")) return "https://www.gottman.com/blog/softening-startup/";
  if (label.includes("Accept Influence")) return "https://www.gottman.com/blog/accepting-influence-find-ways-to-say-yes/";
  if (label.includes("Created for Connection")) return "https://drsuejohnson.com/books/";
  if (label.includes("Sue Johnson")) return "https://www.hachettebookgroup.com/titles/dr-sue-johnson/hold-me-tight/9780316113007/";
  if (label.includes("Chapman")) return "https://www.moodypublishers.com/the-5-love-languagesreg";
  if (label.includes("Love 2.0")) return "https://positivityresonance.com/";
  if (label.includes("Positivity")) return "https://peplab.web.unc.edu/research/";
  if (label.includes("Gable")) return "https://psycnet.apa.org/record/2012-22248-012";
  if (label.includes("Finkel")) return "https://elifinkel.com/allornothingmarriage";
  return undefined;
}

// نصائح خبراء منتقاة مستقلة عن بنك النسخة الأصلية. كل عنصر يحتفظ برابطه المباشر
// حتى تبقى النصيحة قابلة للمراجعة ولا تتحول الصياغة العربية إلى نسبة غير موثقة.
export const CURATED_EXPERT_TIPS: readonly GameTip[] = [
  {
    id: "expert-repair-attempts",
    text: "عندما يحتدم الخلاف، اتفقا على محاولة إصلاح تعيد الحوار إلى مساره من دون إنكار المشكلة.",
    summary: "محاولة الإصلاح قد تكون عبارة لطيفة أو إشارة متفقاً عليها تخفف التصعيد وتذكّر الطرفين بأن العلاقة أهم من كسب النقاش.",
    translation: "تطبيق: قولا «أحتاج أن نهدأ، ومهم عندي أن نكمل حديثنا باحترام» ثم عودا إلى أصل الموضوع.",
    narrator: "معهد غوتمان",
    source: "Gottman Institute",
    reference: "R is for Repair (Gottman)",
    category: "expert",
    sourceUrl: "https://www.gottman.com/blog/r-is-for-repair/",
  },
  {
    id: "expert-stress-reducing-conversation",
    text: "اجعلا للضغط الخارجي محادثة خاصة: استمعا بالتبادل، ولا تقدما حلولاً قبل أن يطلبها الطرف المتحدث.",
    summary: "محادثة تخفيف الضغط تتيح للشريك أن يشعر بأنه مسموع ومفهوم عندما يكون مصدر التوتر خارج العلاقة، كالعمل أو مسؤوليات الحياة.",
    translation: "تطبيق: اسأل «هل تريد أن أسمعك فقط، أم نبحث معاً عن خطوة عملية؟».",
    narrator: "معهد غوتمان",
    source: "Gottman Institute",
    reference: "Stress-Reducing Conversation (Gottman)",
    category: "expert",
    sourceUrl: "https://www.gottman.com/blog/how-to-stress-reducing-conversation/",
  },
  {
    id: "expert-dyadic-coping",
    text: "واجها الضغط كفريق: حددا ما هو ضغطكما المشترك ثم اختارا مساندة عاطفية أو عملية تناسب الحاجة.",
    summary: "تشير الدراسة الطولية إلى ارتباط التأقلم الداعم والمشترك برضا العلاقة، خصوصاً حين يُدرك كل طرف أن الآخر يسانده وقت الضغوط.",
    translation: "تطبيق: اسأل «ما الجزء الذي تحتاج مني أن أحمله معك هذا الأسبوع؟».",
    narrator: "Rusu وزملاؤه",
    source: "PLOS ONE",
    reference: "Stress, Dyadic Coping, and Relationship Satisfaction (2020)",
    category: "expert",
    sourceUrl: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0231133",
  },
  {
    id: "expert-shared-rituals",
    text: "اصنعا طقس اتصال يناسبكما: عادة صغيرة متفقاً عليها عند العودة إلى البيت أو الطعام أو الاحتفال.",
    summary: "تساعد الطقوس المشتركة على بناء معنى متبادل وشعور بالاستمرارية، وهي أوسع من مجرد قضاء وقت طويل معاً.",
    translation: "تطبيق: خصصا عشر دقائق بعد العودة من العمل من دون هاتفين، أو اصنعا طريقة خاصة للاحتفال بإنجاز صغير.",
    narrator: "معهد غوتمان",
    source: "Gottman Institute",
    reference: "Create Shared Meaning: Examining Your Rituals (Gottman)",
    category: "expert",
    sourceUrl: "https://www.gottman.com/blog/create-shared-meaning-examining-rituals/",
  },
  {
    id: "expert-self-soothing",
    text: "عند الغمر العاطفي، أوقفا الحوار بإشارة متفق عليها، واهدآ جسدياً، ثم عودا إليه في وقت معلوم.",
    summary: "الاستراحة المقصودة لتنظيم الانفعال ليست عقاباً صامتاً أو هروباً؛ هدفها أن يعود الطرفان قادرين على العمل كفريق لا كخصمين.",
    translation: "تطبيق: اتفقا على إشارة توقف، وخذا استراحة قصيرة للتنفس أو المشي، ثم حددا وقت العودة للحوار.",
    narrator: "معهد غوتمان",
    source: "Gottman Institute",
    reference: "How to Practice Self-Soothing (Gottman)",
    category: "expert",
    sourceUrl: "https://www.gottman.com/blog/how-to-practice-self-soothing/",
  },
  {
    id: "expert-shared-novelty",
    text: "اختارا بانتظام نشاطاً جديداً ومناسباً لكليكما، فيه فضول أو تحدٍّ معتدل.",
    summary: "تراجع أدبيات التوسع المشترك يربط الأنشطة الجديدة والمثيرة التي يؤديها الشريكان معاً بجودة العلاقة؛ وهو اقتراح عملي لا وعد بنتيجة مضمونة.",
    translation: "تطبيق: جربا وصفة جديدة، أو لغزاً مشتركاً، أو مكاناً قريباً لم تذهبا إليه من قبل.",
    narrator: "Arthur Aron وJennifer Tomlinson",
    source: "Behavioral Sciences",
    reference: "Self-Expansion Activities with a Partner (2026)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13203665/",
  },
  {
    id: "expert-specific-gratitude",
    text: "عبّرا عن امتنان محدد: سَمِّ فعلاً أو جهداً ملموساً، ثم قل ما الأثر الذي تركه فيك.",
    summary: "الامتنان المحدد يختلف عن المجاملة العامة لأنه يلفت الانتباه إلى الجهد الذي بذله الشريك ويقوي الراحة في التعبير عن الاحتياجات.",
    translation: "تطبيق: قل «شكراً لأنك رتبت هذا الأمر اليوم؛ خففت عني كثيراً».",
    narrator: "Lambert وFincham",
    source: "Emotion",
    reference: "Expressing Gratitude to a Partner (2011)",
    category: "expert",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/21401225/",
  },
  {
    id: "expert-autonomy-support",
    text: "ساند هدف شريكك من دون إدارة حياته: اسأله عن نوع المساندة الذي يريده وقدّم خيارات وتشجيعاً لا أوامر.",
    summary: "وجدت الدراسة ارتباط دعم الاستقلال، عند تقديمه وتلقيه، برضا العلاقة؛ بينما قد يرتد الدعم التوجيهي سلباً في بعض الحالات.",
    translation: "تطبيق: اسأل «هل تفضل أن أذكّرك، أو أساعدك في التخطيط، أو أترك لك المساحة؟».",
    narrator: "Carbonneau وزملاؤه",
    source: "Motivation and Emotion",
    reference: "Autonomy Support and Relationship Satisfaction (2019)",
    category: "expert",
    sourceUrl: "https://link.springer.com/article/10.1007/s11031-019-09792-8",
  },
  {
    id: "expert-goal-coordination",
    text: "نسّقا أهدافكما: ناقشا هدفاً شخصياً لكل طرف وحددا أين يلزم التواصل أو الدعم العاطفي أو التعاون العملي.",
    summary: "تربط الدراسة الطولية تنسيق الأهداف بين التواصل والدعم والتعاون، وبين التقدم في الأهداف بعد عام؛ لذا فالمقصود مرافقة الهدف لا مصادرته.",
    translation: "تطبيق: اكتبا هدفاً لكل طرف وخطوة أسبوعية يمكن للآخر دعمها بصورة مناسبة.",
    narrator: "Rosta-Filep وزملاؤها",
    source: "International Journal of Applied Positive Psychology",
    reference: "Goal Coordination in Romantic Relationships (2023)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9999318/",
  },
  {
    id: "expert-parent-emotion-coaching",
    text: "ابدآ بملاحظة شعور الطفل وتسميته، ثم استمعا بتعاطف قبل الانتقال إلى حل المشكلة ووضع حد للسلوك المؤذي.",
    summary: "تدريب الوالد على التعامل مع المشاعر لا يعني التساهل مع كل سلوك؛ بل يفرّق بين قبول الشعور ومساعدة الطفل على التعبير والتصرف بأمان.",
    translation: "تطبيق: قولا «أرى أنك غاضب؛ أنا معك. لا نضرب، فهل نأخذ نفساً ثم نفكر بما نفعله؟».",
    narrator: "Burkhardt وRöösli وMüller",
    source: "Scientific Reports",
    reference: "Tuning in to Kids parenting program RCT (2024)",
    category: "expert",
    sourceUrl: "https://www.nature.com/articles/s41598-024-55689-z",
  },
  {
    id: "expert-family-routines",
    text: "اصنعا روتيناً أسرياً صغيراً ومتوقعاً للطعام أو النوم أو العودة إلى البيت، ثم عدّلاه بحسب عمر الطفل وظروفكما.",
    summary: "تربط مراجعة منهجية واسعة الروتين اليومي بنتائج نمائية متعددة، لكن العلاقة ليست وعداً بنتيجة واحدة ولا بديلاً عن المرونة عند المرض أو الضغط.",
    translation: "تطبيق: اختارا خطوة ثابتة واحدة لمدة أسبوع، مثل عشر دقائق هادئة قبل النوم، واسألا الطفل ما الذي يجعله أكثر راحة فيها.",
    narrator: "Selman وDilworth-Bart",
    source: "Journal of Family Theory & Review",
    reference: "Routines and child development: systematic review (2024)",
    category: "expert",
    sourceUrl: "https://onlinelibrary.wiley.com/doi/10.1111/jftr.12549",
  },
  {
    id: "expert-coparenting-check-in",
    text: "خصصا اجتماعاً قصيراً لتنسيق المسؤوليات وقواعد الطفل، وناقشا الخلاف بعيداً عن الطفل لا أمامه.",
    summary: "تشير مراجعة لتدخلات التعاون الوالدي إلى آثار متفاوتة، لذلك هذه أداة تنظيم وتجربة مشتركة وليست ضماناً لنتيجة أو بديلاً عن دعم مختص عند الحاجة.",
    translation: "تطبيق: اختارا موضوعاً واحداً فقط، مثل النوم أو الأجهزة، واكتبا قاعدة مشتركة وطريقة مراجعتها بعد أسبوع.",
    narrator: "Pilkington وزملاؤه",
    source: "Journal of Advanced Nursing",
    reference: "Coparenting interventions systematic review (2019)",
    category: "expert",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/30066488/",
  },
  {
    id: "expert-support-coparent-privately",
    text: "ادعما القرار التربوي الجيد أمام الطفل، وناقشا اختلافكما بينكما بهدوء بدلاً من السخرية أو نقض أحدكما الآخر أمامه.",
    summary: "تتابع الدراسة العلاقة بين جودة الشراكة والتعاون الوالدي عبر السنوات الأولى من الأبوة؛ وهي ارتباطات طولية لا قاعدة حتمية لكل أسرة.",
    translation: "تطبيق: إن اختلفتما أمام الطفل، قولا «سنتحدث معاً ثم نعود إليك بقرار واضح»، ثم ناقشا الأمر على انفراد.",
    narrator: "Le وMcDaniel وLeavitt وFeinberg",
    source: "Journal of Family Psychology",
    reference: "Relationship Quality and Coparenting longitudinal study (2016)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5112151/",
  },
  {
    id: "expert-share-mental-load",
    text: "وزعا التخطيط والتنفيذ معاً: من يلاحظ الحاجة، ومن يرتبها، ومن ينجزها، بدلاً من افتراض أن التذكير والتنظيم مسؤولية شخص واحد.",
    summary: "تدرس الورقة العمل الذهني المنزلي مثل التخطيط والتوقع والتنظيم، وتربط زيادة حصة الأم منه بمؤشرات ضغط وجودة علاقة أقل في عينتها؛ لا تثبت سببية عامة.",
    translation: "تطبيق: اختارا مهمة كالمواعيد أو الطعام، ثم اتفقا صراحةً على من يخطط ومن ينفذ ومن يراجعها ذلك الأسبوع.",
    narrator: "Aviv وزملاؤها",
    source: "Archives of Women’s Mental Health",
    reference: "Cognitive household labor study (2024)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11761833/",
  },
  {
    id: "expert-child-led-play",
    text: "خصصا وقت لعب قصيراً يقوده الطفل: تابعاه في اختياره، وصِفا ما يفعل، وامدحا جهده بعبارة محددة.",
    summary: "تُظهر تجربة عشوائية لبرنامج تفاعل الوالد والطفل تحسناً في ممارسات والدية إيجابية ضمن عينة خدمات حماية الطفل؛ لا يعني ذلك أن كل أسرة تحتاج البرنامج العلاجي نفسه.",
    translation: "تطبيق: لخمس دقائق، اتركا للطفل اختيار اللعبة، وقولا مثلاً «أعجبني أنك حاولت مرة أخرى» بدلاً من قيادة اللعب عنه.",
    narrator: "Skowron وزملاؤها",
    source: "Journal of Consulting and Clinical Psychology",
    reference: "Parent–Child Interaction Therapy randomized trial (2023)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10894622/",
  },
  {
    id: "expert-calm-clear-limits",
    text: "عند الحاجة إلى حد، اطلبيه بوضوح وبجملة واحدة، ثم اتبعيه بهدوء وارجعي إلى التواصل الإيجابي بعد انتهاء الموقف.",
    summary: "تميّز برامج التفاعل الوالدي بين الدفء والحدود: المطلوب وضوح وثبات من دون صراخ أو إهانة، لا التساهل ولا العقاب القاسي.",
    translation: "تطبيق: بدلاً من «لا تُزعجني»، قولي «ضع المكعبات في الصندوق الآن»، ثم اشكري التعاون عند حدوثه.",
    narrator: "Skowron وزملاؤها",
    source: "Journal of Consulting and Clinical Psychology",
    reference: "Parent–Child Interaction Therapy randomized trial (2023)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10894622/",
  },
  {
    id: "expert-financial-check-in",
    text: "خصصا وقتاً قصيراً ومنتظماً لمراجعة نفقة أو هدف مالي واحد: حددا الأولوية والقرار ومن يتابع الخطوة التالية.",
    summary: "تعامل برنامج بحثي مع التواصل وإدارة الضغط والمال معاً، لكن الجلسة المنزلية المقترحة أداة تنظيم وليست وعداً بنتيجة أو بديلاً عن مشورة مالية متخصصة.",
    translation: "تطبيق: اختارا موضوعاً واحداً لمدة 15 دقيقة، مثل مصروف البيت أو ادخار قريب، وانهيا الحديث بخطوة يتفق عليها الطرفان.",
    narrator: "Falconier وKim وLachowicz",
    source: "Journal of Social and Personal Relationships",
    reference: "TOGETHER couples program randomized controlled trial (2023)",
    category: "expert",
    sourceUrl: "https://journals.sagepub.com/doi/10.1177/02654075221118816",
  },
  {
    id: "expert-parent-accountable-apology",
    text: "إذا أخطأ أحد الوالدين، فليعتذر بوضوح: يعترف بالأذى ويتحمل مسؤوليته ويذكر ما سيحاول تغييره، من دون لوم الطفل أو طلب مسامحته فوراً.",
    summary: "بحثت الدراسة الاعتذار بين الوالد والمراهق؛ فرّقت بين الاعتذار الذي يركز على الأذى والاعتذار الدفاعي، فلا يلزم الطفل بالمسامحة ولا يعالج الاعتذار وحده الأذى المتكرر أو الخطر.",
    translation: "تطبيق: قل «رفعت صوتي عليك، وهذا لم يكن منصفاً. أعتذر، وسأعود إليك بهدوء بعد أن أهدأ».",
    narrator: "Robichaud وزملاؤه",
    source: "Journal of Research on Adolescence",
    reference: "Parental apologies and parent–adolescent relationship (2025)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12000636/",
  },
  {
    id: "expert-collaborative-child-plan",
    text: "عند تكرار مشكلة يومية مع طفل أكبر، اختارا وقتاً هادئاً لتسمية المشكلة والاستماع لصعوبة الطفل، ثم اتفقا على حل صغير قابل للتجربة والمراجعة.",
    summary: "جاء الدليل من عينة علاجية لأطفال ذوي سلوك معارض؛ لذا فهذه أداة حوار أولية، وليست بديلاً عن تقييم مختص عند السلوك المؤذي أو الشديد أو المستمر.",
    translation: "تطبيق: في مشكلة الواجب اسألا «ما أصعب جزء؟» ثم اتفقا على بداية مدتها عشر دقائق وراجعا ما نفع.",
    narrator: "Ollendick وزملاؤه",
    source: "Journal of Clinical Child & Adolescent Psychology",
    reference: "Collaborative & Proactive Solutions randomized trial (2015)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4564364/",
  },
  {
    id: "expert-dialogic-book-sharing",
    text: "اجعلا القراءة مع الطفل حواراً قصيراً: اتبعا ما يلفت انتباهه، سمّيا ما يراه، واسألا سؤالاً مناسباً لعمره ثم اتركا وقتاً للرد.",
    summary: "تبحث الدراسة مشاركة الكتب مع الرضع والأطفال الصغار؛ المقصود تواصل دافئ يتبع اهتمام الطفل، لا تحويل القراءة إلى اختبار أو إلزام.",
    translation: "تطبيق: لخمس دقائق، اختارا صورة واحدة في القصة: «أين القطة؟ ماذا تفعل؟ كيف تشعر؟».",
    narrator: "Salley وزميلاتها",
    source: "Journal of Early Childhood Research",
    reference: "Shared Book Reading Intervention randomized trial (2022)",
    category: "expert",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9455889/",
  },
];

// الأحاديث المؤرشفة لا تُعرض حتى تكتمل مراجعة سندية متخصصة لكل نص؛ نصائح الخبراء تبقى بعد تحقق المرجع والنسبة.
export const TIPS: GameTip[] = (gameData.DAILY_TIPS ?? [])
  .filter(raw => field(raw, ["category"]) === "expert" || isApprovedShiaHadith(field(raw, ["text", "hadith", "content", "quote"])))
  .map((raw, index) => {
    const originalText = field(raw, ["text", "hadith", "content", "quote"]);
    const hadithPresentation = field(raw, ["category"]) === "hadith" ? approvedShiaHadithPresentation(originalText) : undefined;
    const text = hadithPresentation?.text ?? originalText;
    const explanation = gameData.HADITH_EXPLANATIONS?.[text]?.summary ?? gameData.EXPLANATIONS?.[text]?.summary ?? field(raw, ["summary", "explanation", "description"]);
    return {
      id: `tip-${index}`,
      text,
      summary: explanation,
      translation: field(raw, ["translation"]),
      textOriginal: field(raw, ["textOriginal"]),
      narrator: hadithPresentation?.narrator || field(raw, ["narrator", "speaker", "author", "imam"]) || "من أحاديث أهل البيت (ع)",
      source: hadithPresentation?.source || field(raw, ["source", "reference", "book"]),
      reference: hadithPresentation?.reference || field(raw, ["reference"]),
      category: field(raw, ["category"]) === "hadith" ? "hadith" as const : "expert" as const,
      sourceUrl: field(raw, ["category"]) === "hadith"
        ? hadithPresentation?.sourceUrl || sourceUrlForApprovedShiaHadith(originalText)
        : field(raw, ["sourceUrl", "url"]) || sourceUrlForExpert(field(raw, ["source"]), field(raw, ["reference"])),
    };
  })
  .filter(tip => Boolean(tip.text))
  .concat(CURATED_EXPERT_TIPS.map(tip => ({
    ...tip,
    translation: tip.translation ?? "",
    textOriginal: tip.textOriginal ?? "",
    reference: tip.reference ?? "",
    category: "expert" as const,
    sourceUrl: tip.sourceUrl ?? undefined,
  })))
  .concat(CURATED_SHIA_HADITH_TIPS.map(tip => ({
    id: tip.id,
    text: tip.text,
    summary: tip.summary,
    translation: tip.application ?? "",
    textOriginal: "",
    narrator: tip.narrator,
    source: tip.source,
    reference: `${tip.reference} — ${formatHadithVerification(verificationForCuratedShiaHadith(tip))}`,
    category: "hadith" as const,
    sourceUrl: tip.sourceUrl,
  })));

export function createGameCatalog(additionalContent: CommunityGameContent[] = []): GameCatalog {
  const questions = Object.fromEntries(LEVELS.map(level => [level, [...QUESTION_BANK[level]]])) as Record<LevelKey, string[]>;
  const penalties = [...PENALTIES];
  const tips = [...TIPS];

  additionalContent.forEach(item => {
    const body = item.body.trim();
    if (!body) return;
    if (item.kind === "question" && item.level && !questions[item.level].includes(body)) questions[item.level].push(body);
    if (item.kind === "penalty" && !penalties.includes(body)) penalties.push(body);
    if (item.kind === "tip" && !tips.some(tip => tip.text === body)) {
      tips.push({ id: `community-tip-${tips.length}`, text: body, summary: item.summary || "", narrator: item.narrator || "محتوى مجتمع حديث القلوب", source: item.source || "", category: "community", sourceUrl: item.sourceUrl || undefined });
    }
  });

  return { questions, penalties, tips };
}

export function roundSizeFromLandscape(isLandscape: boolean) {
  return isLandscape ? 10 : 9;
}

export function roundSizeFromViewport(width: number, height: number) {
  return roundSizeFromLandscape(width > height);
}

export function roundSizeForViewport() {
  if (typeof window === "undefined") return 9;
  return roundSizeFromViewport(window.innerWidth, window.innerHeight);
}

export function levelCountsForRound(size: number) {
  const safeSize = Math.min(Math.max(size, LEVELS.length * ROUND_LEVEL_LIMITS.minimum), LEVELS.length * ROUND_LEVEL_LIMITS.maximum);
  const counts = Object.fromEntries(LEVELS.map(level => [level, ROUND_LEVEL_LIMITS.minimum])) as Record<LevelKey, number>;
  let remaining = safeSize - LEVELS.length * ROUND_LEVEL_LIMITS.minimum;
  let previousLevel: LevelKey | null = null;

  while (remaining > 0) {
    const weightedCandidates = LEVELS.flatMap(level => {
      if (counts[level] >= ROUND_LEVEL_LIMITS.maximum) return [];
      const capacityWeight = (ROUND_LEVEL_LIMITS.maximum - counts[level]) * 3;
      const repetitionPenalty = previousLevel === level ? 1 : 2;
      return Array.from({ length: capacityWeight * repetitionPenalty }, () => level);
    });
    const chosen = shuffle(weightedCandidates)[0];
    if (!chosen) break;
    counts[chosen] += 1;
    previousLevel = chosen;
    remaining -= 1;
  }
  return counts;
}

export function generateRound(
  size: number,
  recentlyUsed: string[] = [],
  questionBank: Record<LevelKey, readonly string[]> = QUESTION_BANK,
): GameCard[] {
  const counts = levelCountsForRound(size);
  const recentlyUsedSet = new Set(recentlyUsed);
  const selected: GameCard[] = [];

  LEVELS.forEach(level => {
    const fresh = questionBank[level].filter(question => !recentlyUsedSet.has(question));
    const pool = fresh.length >= counts[level] ? fresh : questionBank[level];
    shuffle(pool)
      .slice(0, counts[level])
      .forEach((prompt, position) => {
        selected.push({ id: `${level}-${Date.now()}-${position}-${Math.random()}`, level, prompt });
      });
  });

  return shuffle(selected);
}

export function getRoundCardStates(deck: readonly GameCard[], availableCards: readonly GameCard[]) {
  const availableIds = new Set(availableCards.map(card => card.id));
  return deck.map(card => ({ card, state: (availableIds.has(card.id) ? "available" : "consumed") as RoundCardState }));
}

export function choosePenalty(penalties: readonly string[] = PENALTIES, recentlyUsed: readonly string[] = []) {
  const recentSet = new Set(recentlyUsed);
  const fresh = penalties.filter(penalty => !recentSet.has(penalty));
  const pool = fresh.length ? fresh : penalties;
  return pool[Math.floor(Math.random() * pool.length)] ?? "شارك الطرف الآخر بكلمة لطيفة من قلبك.";
}

export function chooseTip(tips: readonly GameTip[] = TIPS, recentlyUsedTexts: readonly string[] = []) {
  const recentSet = new Set(recentlyUsedTexts);
  const fresh = tips.filter(tip => !recentSet.has(tip.text));
  const pool = fresh.length ? fresh : tips;
  return pool[Math.floor(Math.random() * pool.length)] ?? {
    id: "fallback-tip",
    text: "تَهَادَوْا تَحَابُّوا",
    summary: "المودة تنمو بالاهتمام والتقدير اليومي.",
    narrator: "من أحاديث أهل البيت (ع)",
    source: "",
  };
}

export function recordOpenedTip(history: readonly GameTip[], tip: GameTip, openedAt = Date.now()) {
  return [...history, { ...tip, id: `${tip.id}-shown-${openedAt}` }].slice(-30);
}

export function createEmptyRoundOutcomeCounts(): RoundOutcomeCounts {
  return { answered: 0, skipped: 0, penalty: 0 };
}

export function createRoundSummary(input: {
  roundNumber: number;
  totalCards: number;
  outcomes: RoundOutcomeCounts;
  playerTurns: [number, number];
  tipHistory: readonly GameTip[];
  tipStartIndex: number;
  sessionCardsOpened: number;
}): RoundSummary {
  return {
    roundNumber: input.roundNumber,
    totalCards: input.totalCards,
    outcomes: { ...input.outcomes },
    playerTurns: [...input.playerTurns] as [number, number],
    tips: input.tipHistory.slice(input.tipStartIndex),
    sessionCardsOpened: input.sessionCardsOpened,
    sessionTipsShown: input.tipHistory.length,
  };
}

export function searchUrlForTip(tip: GameTip) {
  return `https://www.google.com/search?q=${encodeURIComponent([tip.narrator, tip.source, tip.reference, tip.text].filter(Boolean).join(" "))}`;
}
