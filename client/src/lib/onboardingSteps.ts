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
  { id: "start", screen: "welcome", targetSelector: '[data-tour="start-session"]', title: "ابدآ الجلسة", body: "بعد إدخال الاسمين، انتقلا إلى اختيار من يبدأ الحديث.", placement: "top" },
  { id: "starter", screen: "starter", targetSelector: '[data-tour="starter-choice"]', title: "اختارا البداية", body: "يمكنكما اختيار من يبدأ، أو ترك البداية لزر الاختيار العشوائي.", placement: "bottom" },
  { id: "cards", screen: "game", targetSelector: '[data-tour="cards"]', title: "البطاقات تخفي المستوى", body: "اختارا بطاقة لتظهر فكرتها. تبقى مستويات همسات ونبض وأعماق وجوهر مفاجأة حتى الفتح.", placement: "bottom" },
  { id: "question-actions", screen: "game", targetSelector: '[data-tour="question-actions"]', title: "ثلاثة خيارات لطيفة", body: "بعد القراءة: الإجابة، أو التخطي، أو عقوبة لطيفة. هذه أفعال حقيقية على البطاقة الحالية.", placement: "top" },
  { id: "tip", screen: "game", targetSelector: '[data-tour="tip"]', title: "نصيحة في وقتها", body: "افتحا نصيحة من مصادرها، وتُحفظ النصائح الظاهرة في سجل الجلسة.", placement: "bottom" },
  { id: "help", screen: "game", targetSelector: '[data-tour="help"]', title: "تعليمات عند الحاجة", body: "يمكنكما العودة إلى التعليمات أو إعادة هذه الجولة التعريفية في أي وقت.", placement: "bottom" },
  { id: "tools", screen: "game", targetSelector: '[data-tour="session-tools"]', title: "أدوات الجلسة", body: "من هنا تراجعان النصائح، وتحددان محاورها، وتطلعان على إحصائيات الجلسة.", placement: "top" },
  { id: "theme", targetSelector: '[data-tour="settings"]', title: "إعداداتك", body: "تجمع الإعدادات المظهر وإعادة الشرح، ويمكن إضافة خيارات أخرى إليها لاحقاً.", placement: "bottom" },
  { id: "sources", targetSelector: '[data-tour="verification"]', title: "مصادر قابلة للمراجعة", body: "يفتح سجل التوثيق مصادر الروايات وأحكامها المنشورة وحدود الاستفادة منها.", placement: "bottom" },
  { id: "complete", title: "أنتما جاهزان", body: "ابدآ من حيث يناسبكما، وخذا من اللعبة ما يفتح حواراً هادئاً وصادقاً." },
];

export function firstOnboardingStepForScreen(screen: OnboardingScreen) {
  return Math.max(0, ONBOARDING_STEPS.findIndex(step => step.screen === screen));
}
