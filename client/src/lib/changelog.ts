export type ChangelogItemType = "feature" | "fix" | "content";

export type ChangelogEntry = {
  version: string;
  date: string;
  items: { type: ChangelogItemType; text: string }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.7.0",
    date: "2026-08-22",
    items: [
      { type: "feature", text: "جولة تعريفية تفاعلية ترافق الاستخدام الأول خطوة بخطوة." },
      { type: "feature", text: "إعدادات تجمع المظهر وإعادة الشرح وخيارات المساعدة." },
      { type: "feature", text: "نافذة «الجديد في حديث القلوب» للمستخدمين العائدين." },
      { type: "fix", text: "تحسين ثبات عرض الواجهة على شاشات الهاتف الضيقة." },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-08-22",
    items: [
      { type: "feature", text: "فلترة اختيارية للنصائح مع بقاء العرض مختلطاً افتراضياً." },
      { type: "content", text: "توسعة سجل التوثيق والمراجع العامة للروايات." },
    ],
  },
];

export const LATEST_VERSION = CHANGELOG[0]!.version;
