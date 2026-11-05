export type OnboardingScreen = "welcome" | "starter" | "game";

export type OnboardingStep = {
  id: string;
  screen?: OnboardingScreen;
  targetSelector?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom";
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "players", screen: "welcome", targetSelector: '[data-tour="players"]', title: "ابدآ بالاسمين", body: "يُستخدم الاسمان داخل هذه الجلسة فقط ليظهر الدور بوضوح بينكما.", placement: "bottom" },
  { id: "start", screen: "welcome", targetSelector: '[data-tour="start-session"]', title: "ابدآ الجلسة", body: "الاسمان اختياريان. انتقلا إلى اختيار عمق الجولة ومن يبدأ الحديث.", placement: "top" },
  { id: "starter", screen: "starter", targetSelector: '[data-tour="starter-choice"]', title: "اختارا البداية", body: "يمكنكما اختيار من يبدأ، أو ترك البداية لزر الاختيار العشوائي.", placement: "bottom" },
  { id: "cards", screen: "game", targetSelector: '[data-tour="cards"]', title: "البطاقات تخفي المستوى", body: "اختارا بطاقة لتظهر فكرتها. تبقى مستويات همسات ونبض وأعماق وجوهر مفاجأة حتى الفتح.", placement: "bottom" },
  { id: "question-actions", screen: "game", targetSelector: '[data-tour="question-actions"]', title: "ثلاثة خيارات لطيفة", body: "بعد القراءة: الإجابة، أو التخطي، أو نشاط لطيف اختياري. هذه أفعال حقيقية على البطاقة الحالية.", placement: "top" },
  { id: "tip", screen: "game", targetSelector: '[data-tour="tip"]', title: "نصيحة في وقتها", body: "افتحا نصيحة واحدة من مصادرها في الوقت الذي يناسبكما، من دون إغراق شاشة اللعب بقائمة طويلة.", placement: "bottom" },
  { id: "help", screen: "game", targetSelector: '[data-tour="help"]', title: "تعليمات عند الحاجة", body: "يمكنكما العودة إلى التعليمات أو إعادة هذه الجولة التعريفية في أي وقت.", placement: "bottom" },
  { id: "tools", screen: "game", targetSelector: '[data-tour="session-tools"]', title: "أدوات الجلسة", body: "من هنا تتابعان إحصائيات الجلسة. تجدان أيضًا النصائح التي شاهدتماها والمفضلة الخاصة بهذا الجهاز.", placement: "top" },
  { id: "theme", targetSelector: '[data-tour="settings"]', title: "إعداداتك", body: "تجمع الإعدادات المظهر وإعادة الشرح، ويمكن إضافة خيارات أخرى إليها لاحقاً.", placement: "bottom" },
  { id: "favorites", screen: "game", targetSelector: '[data-tour="session-tools"]', title: "المفضلة الخاصة", body: "يمكنكما حفظ سؤال أو نصيحة بعد فتحها عبر زر القلب، والرجوع إليها من المفضلة.", placement: "top" },
  { id: "complete", title: "أنتما جاهزان", body: "ابدآ من حيث يناسبكما، وخذا من اللعبة ما يفتح حواراً هادئاً وصادقاً." },
];

export function firstOnboardingStepForScreen(screen: OnboardingScreen) {
  return Math.max(0, ONBOARDING_STEPS.findIndex(step => step.screen === screen));
}
