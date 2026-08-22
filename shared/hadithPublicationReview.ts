import { ORIGINAL_GAME_DATA } from "./originalGameData";

export type HadithPublicationDecision = "excluded" | "approved";
export type MajlisiGrade = "صحيح" | "حسن" | "حسن كالصحيح" | "موثق" | "ضعيف" | "مرسل" | "غير متحققة";
export type HadithReviewStatus = "accepted" | "rejected_weak_or_mursal" | "source_found_without_grade" | "non_shia_source_identified" | "source_or_attribution_unverified";
export type SourceEvidenceStatus = "thaqalayn_direct" | "shia_alternate_or_text_variant" | "no_source_verified" | "non_shia_source_identified";
export type HadithPublicationBasis = "majlisi_accepted" | "verified_shia_chain" | "published_scholarly_verdict";
export type HadithVerificationMethod = "majlisi_grade" | "published_scholarly_verdict" | "rijal_research" | "source_only";

export type HadithVerification = {
  method: HadithVerificationMethod;
  status: "publishable" | "research_only" | "owner_approved_source_only";
  label: string;
  verdict?: string;
  verifier?: string;
  verifierWork?: string;
  referenceUrl?: string;
};

export type CuratedShiaHadithTip = {
  id: string;
  text: string;
  summary: string;
  application?: string;
  narrator: string;
  source: string;
  reference: string;
  sourceUrl: string;
  majlisiGrade?: "صحيح" | "حسن" | "حسن كالصحيح" | "موثق";
  shiaSourceLocation: string;
  verification?: HadithVerification;
};

export type HadithPublicationReview = {
  text: string;
  speaker: string;
  originalSource: string;
  originalReference: string;
  majlisiGrade: MajlisiGrade;
  reviewStatus: HadithReviewStatus;
  sourceEvidenceStatus: SourceEvidenceStatus;
  decision: HadithPublicationDecision;
  reason: string;
  thaqalaynSearchUrl: string;
  shiaSourceUrl?: string;
  shiaSourceLocation?: string;
  gradingReferenceUrl?: string;
  publicationBasis?: HadithPublicationBasis;
  verification?: HadithVerification;
  publishedText?: string;
  publishedSource?: string;
  publishedReference?: string;
  publishedSpeaker?: string;
};

type MajlisiFinding = Pick<HadithPublicationReview, "majlisiGrade" | "shiaSourceUrl" | "shiaSourceLocation" | "gradingReferenceUrl" | "publicationBasis" | "publishedText" | "publishedSource" | "publishedReference" | "publishedSpeaker">;

const MAJLISI_FINDINGS_BY_TEXT: Readonly<Record<string, MajlisiFinding>> = {
  "جُلُوسُ الْمَرْأَةِ عِنْدَ زَوْجِهَا أَحَبُّ إِلَى اللَّهِ تَعَالَى مِنَ اعْتِكَافٍ فِي مَسْجِدِي هَذَا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://rafed.net/reyhana/article/15699",
    shiaSourceLocation: "تنبيه الخواطر؛ النص المنشور بلفظ «جلوس المرء عند عياله...» وهو مختلف عن النص المؤرشف",
  },
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11017/1/285",
    shiaSourceLocation: "مسند الإمام الرضا، ج1، ص285؛ يحيل إلى تحف العقول، ص325",
  },
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/chapter/31/2/3",
    shiaSourceLocation: "كتاب الزهد، ج1، كتاب 2، باب حسن الخلق؛ لفظ قريب «إذا أراد الله بأهل بيت خيراً رزقهم الرفق في المعيشة وحسن الخلق»",
  },
  "إِنَّ الْمَرْأَةَ رَيْحَانَةٌ وَلَيْسَتْ بِقَهْرَمَانَةٍ": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب إكرام المرأة، الحديث 3",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/151/3",
  },
  "الْعَبْدُ كُلَّمَا ازْدَادَ لِلنِّسَاءِ حُبّاً ازْدَادَ فِي الْإِيمَانِ فَضْلًا": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/36/3/5",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 3، باب حب النساء؛ الرواية الأولى تورد النص عن أبي العباس عن الإمام الصادق (ع)",
    publicationBasis: "verified_shia_chain",
    publishedSource: "من لا يحضره الفقيه",
    publishedReference: "ج3، كتاب 3، باب حب النساء، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "أَيُّمَا امْرَأَةٍ خَدَمَتْ زَوْجَهَا سَبْعَةَ أَيَّامٍ أَغْلَقَ اللَّهُ عَنْهَا سَبْعَةَ أَبْوَابِ النَّارِ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25342؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
  "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/36/4/25/10",
    shiaSourceLocation: "من لا يحضره الفقيه، ج3، كتاب 4، باب 25، الحديث 10",
  },
  "مَا مِنِ امْرَأَةٍ تَسْقِي زَوْجَهَا شَرْبَةً مِنْ مَاءٍ إِلَّا كَانَ خَيْراً لَهَا مِنْ عِبَادَةِ سَنَةٍ": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11025/20/172",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص172، الحديث 25343؛ الحاشية تصرح بعدم العثور عليه في تنبيه الخواطر المطبوع",
  },
};

const MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE: Readonly<Record<string, MajlisiFinding>> = {
  "مستدرك الوسائل ج15 ص116": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11015/15/116",
    shiaSourceLocation: "مستدرك الوسائل، ج15، ص116، الحديث 17709؛ يرويه جامع الأخبار عن أبي هريرة",
  },
  "بحار الأنوار ج43 ص117": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/43/117",
    shiaSourceLocation: "بحار الأنوار، ج43، ص117؛ خبر سؤال النبي للإمام علي عن فاطمة",
  },
  "جامع السعادات ج2 ص140": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://lib.eshia.ir/11008/104/132",
    shiaSourceLocation: "بحار الأنوار، ج104، ص132، باب فضل خدمة العيال؛ ينقل عن جامع الأخبار ص102",
  },
  "الحكمة 136": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/10/25/10/1",
    shiaSourceLocation: "الخصال، الكتاب 25، الباب 10، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الخصال",
    publishedReference: "الكتاب 25، الباب 10، الحديث 1",
    publishedSpeaker: "الإمام الباقر (ع)",
  },
  "ج66 ص408": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/ar/chapter/10/4/15",
    shiaSourceLocation: "الخصال، ج1، الكتاب 4، الباب 15، الحديث 1؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedText: "مَنْ حَسُنَ بَرُّهُ بِأَهْلِهِ زَادَ اللَّهُ فِي عُمُرِهِ",
    publishedSource: "الخصال",
    publishedReference: "ج1، الكتاب 4، الباب 15، الحديث 1",
    publishedSpeaker: "الإمام الصادق (ع)",
  },
  "ج5 ص569": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب 190، ح59",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/5/3/190/59",
  },
  "الكافي ج2 ص110": {
    majlisiGrade: "مرسل",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، ح6",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/2/1/54/6",
  },
  "ج5 ص144": {
    majlisiGrade: "ضعيف",
    shiaSourceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب الهدية، الحديث 14",
    gradingReferenceUrl: "https://thaqalayn.net/ar/hadith/5/2/50/14",
  },
  "الكافي ج2 ص189": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/30/1/5/21",
    shiaSourceLocation: "كتاب المؤمن، الكتاب 1، الباب 5، الحديث 21",
  },
  "الكافي ج2 ص321": {
    majlisiGrade: "حسن كالصحيح",
    shiaSourceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب سوء الخلق، الحديث 1",
    gradingReferenceUrl: "https://thaqalayn.net/hadith/2/1/129/1",
  },
  "الكافي ج2 ص635": {
    majlisiGrade: "غير متحققة",
    shiaSourceUrl: "https://thaqalayn.net/hadith/29/1/36/16",
    shiaSourceLocation: "الأمالي، الكتاب 1، المجلس 36، الحديث 16؛ السند منشور في الموضع",
    publicationBasis: "verified_shia_chain",
    publishedSource: "الأمالي",
    publishedReference: "الكتاب 1، المجلس 36، الحديث 16",
    publishedSpeaker: "رسول الله (ص)",
  },
};

const originalHadiths = (ORIGINAL_GAME_DATA.DAILY_TIPS as unknown as ReadonlyArray<{
  text: string;
  speaker: string;
  source: string;
  reference: string;
  category: "hadith" | "expert";
}>).filter(item => item.category === "hadith");

const ACCEPTED_MAJLISI_GRADES: readonly MajlisiGrade[] = ["صحيح", "حسن", "حسن كالصحيح", "موثق"];
const MAJLISI_VERIFIER = "العلامة محمد باقر المجلسي";
const MAJLISI_WORK = "مرآة العقول في شرح أخبار آل الرسول";

export function verificationForCuratedShiaHadith(tip: CuratedShiaHadithTip): HadithVerification {
  return tip.verification ?? {
    method: "majlisi_grade",
    status: "publishable",
    label: "درجة المجلسي",
    verdict: tip.majlisiGrade,
    verifier: MAJLISI_VERIFIER,
    verifierWork: MAJLISI_WORK,
    referenceUrl: tip.sourceUrl,
  };
}

export function formatHadithVerification(verification: HadithVerification) {
  const parts = [verification.label, verification.verdict].filter(Boolean).join(": ");
  const attribution = [verification.verifier, verification.verifierWork].filter(Boolean).join("، ");
  return attribution ? `${parts} — وفق ${attribution}` : parts;
}

// نصائح منتقاة مستقلة عن الأرشيف الأصلي: مواضع شيعية مباشرة مع درجة مجلسي مقبولة منشورة في ثقلين.
export const CURATED_SHIA_HADITH_TIPS: readonly CuratedShiaHadithTip[] = [
  {
    id: "curated-hadith-anger-restraint",
    text: "مَا تَجَرَّعْتُ جُرْعَةً أَحَبَّ إِلَيَّ مِنْ جُرْعَةِ غَيْظٍ لَا أُكَافِي بِهَا صَاحِبَهَا",
    summary: "عند اشتداد الخلاف، امنح نفسك مساحة لتهدأ قبل أن ترد بالمثل أو تصعّد الموقف.",
    narrator: "الإمام زين العابدين (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب كظم الغيظ، الحديث 1",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/54/1",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، الحديث 1",
  },
  {
    id: "curated-hadith-anger-patience",
    text: "نِعْمَ الْجُرْعَةُ الْغَيْظُ لِمَنْ صَبَرَ عَلَيْهَا",
    summary: "الصبر على الغضب مهارة مشتركة في العلاقة: أوقف النقاش مؤقتاً ثم عُد إليه بهدوء.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب كظم الغيظ، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/54/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب كظم الغيظ، الحديث 2",
  },
  {
    id: "curated-hadith-wife-care",
    text: "يُشْبِعُهَا وَيَكْسُوهَا وَإِنْ جَهِلَتْ غَفَرَ لَهَا",
    summary: "يركز الإحسان في الحياة الزوجية على الرعاية العملية والإنصاف والمغفرة عند الخطأ.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 1",
    sourceUrl: "https://thaqalayn.net/hadith/5/3/152/1",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 1",
  },
  {
    id: "curated-hadith-gentleness-women",
    text: "أَوْصَانِي جَبْرَئِيلُ بِالْمَرْأَةِ حَتَّى ظَنَنْتُ أَنَّهُ لَا يَنْبَغِي طَلَاقُهَا إِلَّا مِنْ فَاحِشَةٍ مُبَيِّنَةٍ",
    summary: "ليكن الرفق والاحترام والتروي أصل التعامل، لا التهديد أو الاستعجال عند الأزمات.",
    narrator: "رسول الله (ص)",
    source: "الكافي",
    reference: "ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 6",
    sourceUrl: "https://thaqalayn.net/hadith/5/3/152/6",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج5، كتاب 3، باب حق المرأة على الزوج، الحديث 6",
  },
  {
    id: "curated-hadith-wife-rights-owner-approved",
    text: "وَحَقُّ الزَّوْجَةِ أَنْ تَعْلَمَ أَنَّ اللَّهَ عَزَّ وَجَلَّ جَعَلَهَا لَكَ سَكَناً وَأُنْساً، وَتَعْلَمَ أَنَّ ذَلِكَ نِعْمَةٌ مِنَ اللَّهِ تَعَالَى عَلَيْكَ، فَتُكْرِمَهَا وَتَرْفُقَ بِهَا، وَإِنْ كَانَ حَقُّكَ عَلَيْهَا أَوْجَبَ فَإِنَّ لَهَا عَلَيْكَ أَنْ تَرْحَمَهَا، لِأَنَّهَا أَسِيرُكَ، وَتُطْعِمَهَا وَتَكْسُوهَا، فَإِذَا جَهِلَتْ عَفَوْتَ عَنْهَا.",
    summary: "يعرض النص الإكرام والرفق والرحمة والرعاية العملية بوصفها مسؤوليات في العلاقة الزوجية.",
    application: "يمكن ترجمة ذلك إلى رعاية متبادلة ومغفرة عند الخطأ واتفاق عادل على الاحتياجات. لا تُستخدم صياغة «أسيرك» التاريخية لتبرير تقييد الحرية أو الإهانة أو العنف؛ فالسلامة والكرامة والحدود الشخصية مقدمة.",
    narrator: "الإمام زين العابدين (ع)",
    source: "رسالة الحقوق",
    reference: "ج1، ك1، ب5، ح3 — حق الزوجة",
    sourceUrl: "https://thaqalayn.net/hadith/33/1/5/3",
    shiaSourceLocation: "رسالة الحقوق، ج1، ك1، ب5، ح3؛ حق الزوجة.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://thaqalayn.net/hadith/33/1/5/3",
    },
  },
  {
    id: "curated-hadith-child-rights-owner-approved",
    text: "وَأَمَّا حَقُّ وَلَدِكَ فَأَنْ تَعْلَمَ أَنَّهُ مِنْكَ وَمُضَافٌ إِلَيْكَ فِي عَاجِلِ الدُّنْيَا بِخَيْرِهِ وَشَرِّهِ، وَأَنَّكَ مَسْؤُولٌ عَمَّا وَلَّيْتَهُ بِهِ مِنْ حُسْنِ الْأَدَبِ وَالدَّلَالَةِ عَلَى رَبِّهِ وَالْمَعُونَةِ لَهُ عَلَى طَاعَتِهِ، فَاعْمَلْ فِي أَمْرِهِ عَمَلَ مَنْ يَعْلَمُ أَنَّهُ مُثَابٌ عَلَى الْإِحْسَانِ إِلَيْهِ مُعَاقَبٌ عَلَى الْإِسَاءَةِ إِلَيْهِ.",
    summary: "يجعل النص إحسان التربية وحسن الأدب والمساندة من مسؤوليات الوالدين تجاه الطفل.",
    application: "اختاروا توجيهاً يناسب عمر الطفل وقدرته، مع تشجيع السلوك الحسن وإصلاح الخطأ بلا إهانة أو تخويف. المسؤولية لا تبرر الإكراه أو تجاهل احتياجات الطفل وسلامته.",
    narrator: "الإمام زين العابدين (ع)",
    source: "رسالة الحقوق",
    reference: "ج1، ك1، ب6، ح3 — حق الولد",
    sourceUrl: "https://thaqalayn.net/hadith/33/1/6/3",
    shiaSourceLocation: "رسالة الحقوق، ج1، ك1، ب6، ح3؛ حق الولد.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://thaqalayn.net/hadith/33/1/6/3",
    },
  },
  {
    id: "curated-hadith-brother-rights-owner-approved",
    text: "وَأَمَّا حَقُّ أَخِيكَ فَأَنْ تَعْلَمَ أَنَّهُ يَدُكَ وَعِزُّكَ وَقُوَّتُكَ، فَلَا تَتَّخِذْهُ سِلَاحاً عَلَى مَعْصِيَةِ اللَّهِ وَلَا عُدَّةً لِلظُّلْمِ لِخَلْقِ اللَّهِ، وَلَا تَدَعْ نُصْرَتَهُ عَلَى عَدُوِّهِ، وَالنَّصِيحَةَ لَهُ، فَإِنْ أَطَاعَ اللَّهَ وَإِلَّا فَلْيَكُنِ اللَّهُ أَكْرَمَ عَلَيْكَ مِنْهُ، وَلَا قُوَّةَ إِلَّا بِاللَّهِ.",
    summary: "يربط النص الأخوة بالمساندة والنصيحة، ويمنع تحويلها إلى أداة للظلم أو الضرر.",
    application: "ساند أخاك أو أختك في طلب عادل، وقدّم نصيحة محترمة عند الحاجة. لا تعن على الأذى أو التستر عليه، وحافظ على الحدود الآمنة عند الخلاف.",
    narrator: "الإمام زين العابدين (ع)",
    source: "رسالة الحقوق",
    reference: "ج1، ك1، ب6، ح4 — حق الأخ",
    sourceUrl: "https://thaqalayn.net/hadith/33/1/6/4",
    shiaSourceLocation: "رسالة الحقوق، ج1، ك1، ب6، ح4؛ حق الأخ.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://thaqalayn.net/hadith/33/1/6/4",
    },
  },
  {
    id: "curated-hadith-father-rights-owner-approved",
    text: "وَأَمَّا حَقُّ أَبِيكَ فَأَنْ تَعْلَمَ أَنَّهُ أَصْلُكَ، وَأَنَّهُ لَوْلَاهُ لَمْ تَكُنْ. فَمَهْمَا رَأَيْتَ فِي نَفْسِكَ مِمَّا يُعْجِبُكَ فَاعْلَمْ أَنَّ أَبَاكَ أَصْلُ النِّعْمَةِ عَلَيْكَ فِيهِ، وَاحْمَدِ اللَّهَ وَاشْكُرْهُ عَلَى قَدْرِ ذَلِكَ، وَلَا قُوَّةَ إِلَّا بِاللَّهِ.",
    summary: "يستدعي النص الامتنان لفضل الأب والتعرف إلى صلة الإنسان بأسرته.",
    application: "عبّر عن تقديرك بمكالمة أو مساعدة أو كلمة طيبة تناسب علاقتكما. لا يلغي الامتنان الحاجة إلى حدود واضحة أو طلب مساندة آمنة إذا كان التواصل مؤذياً.",
    narrator: "الإمام زين العابدين (ع)",
    source: "رسالة الحقوق",
    reference: "ج1، ك1، ب6، ح2 — حق الأب",
    sourceUrl: "https://thaqalayn.net/hadith/33/1/6/2",
    shiaSourceLocation: "رسالة الحقوق، ج1، ك1، ب6، ح2؛ حق الأب.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://thaqalayn.net/hadith/33/1/6/2",
    },
  },
  {
    id: "curated-hadith-mother-rights-owner-approved",
    text: "أَمَّا حَقُّ أُمِّكَ، فَأَنْ تَعْلَمَ أَنَّهَا حَمَلَتْكَ حَيْثُ لَا يَحْتَمِلُ أَحَدٌ أَحَداً، وَأَعْطَتْكَ مِنْ ثَمَرَةِ قَلْبِهَا مَا لَا يُعْطِي أَحَدٌ أَحَداً، وَوَقَتْكَ بِجَمِيعِ جَوَارِحِهَا، وَلَمْ تُبَالِ أَنْ تَجُوعَ وَتُطْعِمَكَ، وَتَعْطَشَ وَتَسْقِيَكَ، وَتَعْرَى وَتَكْسُوَكَ، وَتَضْحَى وَتُظَلِّلَكَ، وَتَهْجُرَ النَّوْمَ لِأَجْلِكَ، وَوَقَتْكَ الْحَرَّ وَالْبَرْدَ، لِتَكُونَ لَهَا، فَإِنَّكَ لَا تُطِيقُ شُكْرَهَا إِلَّا بِعَوْنِ اللَّهِ وَتَوْفِيقِهِ.",
    summary: "يستحضر النص وجوه الرعاية التي تبذلها الأم ويدعو إلى الشكر والتقدير.",
    application: "اختَر لفتة تقدير واقعية ومناسبة، مثل سؤال صادق عن احتياج أو مساعدة أو دعاء. لا يُستخدم الامتنان لإثقال شخص بالذنب أو إنكار مشاعره وحدوده.",
    narrator: "الإمام زين العابدين (ع)",
    source: "رسالة الحقوق",
    reference: "ج1، ك1، ب6، ح1 — حق الأم",
    sourceUrl: "https://thaqalayn.net/hadith/33/1/6/1",
    shiaSourceLocation: "رسالة الحقوق، ج1، ك1، ب6، ح1؛ حق الأم.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://thaqalayn.net/hadith/33/1/6/1",
    },
  },
  {
    id: "curated-hadith-spousal-harmony-owner-approved",
    text: "لَا غِنَى بِالزَّوْجِ عَنْ ثَلَاثَةِ أَشْيَاءَ فِيمَا بَيْنَهُ وَبَيْنَ زَوْجَتِهِ: وَهِيَ الْمُوَافَقَةُ، لِيَجْتَلِبَ بِهَا مُوَافَقَتَهَا وَمَحَبَّتَهَا وَهَوَاهَا، وَحُسْنُ خُلُقِهِ مَعَهَا، وَاسْتِعْمَالُهُ اسْتِمَالَةَ قَلْبِهَا بِالْهَيْئَةِ الْحَسَنَةِ فِي عَيْنِهَا، وَتَوْسِعَتُهُ عَلَيْهَا.",
    summary: "يركز النص على حسن الخلق والتوافق والعناية بالمودة في الحياة الزوجية.",
    application: "حددا عادة صغيرة تعزز المودة كل أسبوع، مثل وقت حوار هادئ أو تقدير صريح أو ترتيب إنفاق يناسب قدرة الأسرة من دون ضغط أو منّة.",
    narrator: "الإمام علي بن موسى الرضا (ع)",
    source: "تحف العقول",
    reference: "ص239، في وصية الإمام الرضا (ع)",
    sourceUrl: "https://imamhussain.org/6665",
    shiaSourceLocation: "تحف العقول، ص239؛ النص من وصية الإمام الرضا (ع) في تدبير المعاشرة.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://imamhussain.org/6665",
    },
  },
  {
    id: "curated-hadith-wife-gentle-companionship-owner-approved",
    text: "إِنَّ الْمَرْأَةَ رَيْحَانَةٌ وَلَيْسَتْ بِقَهْرَمَانَةٍ، فَدَارِهَا عَلَى كُلِّ حَالٍ، وَأَحْسِنِ الصُّحْبَةَ لَهَا، يَصْفُ عَيْشُكَ.",
    summary: "يقدم النص الرفق وحسن الصحبة مدخلاً لصفاء العيش داخل البيت.",
    application: "عند اختلاف الجهد أو توزيع المهام، تحدثا عن القدرة والوقت والاحتياج، ولا تحولا عبارة تاريخية عن الأدوار إلى تحميل طرف واحد مسؤولية البيت أو إلغاء شراكته.",
    narrator: "أمير المؤمنين علي (ع)",
    source: "وسائل الشيعة",
    reference: "ج20، ص169؛ وصية أمير المؤمنين (ع) لمحمد بن الحنفية",
    sourceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص169؛ بإحالة إلى نهج البلاغة ومن لا يحضره الفقيه.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    },
  },
  {
    id: "curated-hadith-spousal-kindness-owner-approved",
    text: "رَحِمَ اللَّهُ عَبْداً أَحْسَنَ فِيمَا بَيْنَهُ وَبَيْنَ زَوْجَتِهِ، فَإِنَّ اللَّهَ عَزَّ وَجَلَّ قَدْ مَلَّكَهُ نَاصِيَتَهَا وَجَعَلَهُ الْقَيِّمَ عَلَيْهَا.",
    summary: "موضع التأمل في النص هو الإحسان في العلاقة الزوجية، مع قراءة مسؤولة لا تحول الألفاظ التاريخية إلى تسلط.",
    application: "اجعلا الإحسان عملياً: استماع بلا إهانة، اعتذار عند الخطأ، وتقاسم منصف للرعاية. لا تبرر أي عبارة عن القوامة السيطرة أو التهديد أو تقييد القرار الشخصي أو السلامة.",
    narrator: "الإمام الصادق (ع)",
    source: "وسائل الشيعة",
    reference: "ج20، ص170؛ منقول عن من لا يحضره الفقيه، ج3، ص281",
    sourceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص170؛ منقول عن من لا يحضره الفقيه، ج3، ص281.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    },
  },
  {
    id: "curated-hadith-best-to-family-owner-approved",
    text: "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ، وَأَنَا خَيْرُكُمْ لِأَهْلِي.",
    summary: "يربط النص الخيرية بحسن المعاشرة داخل الأسرة، لا بالمظهر العام وحده.",
    application: "اختَر سلوكاً أسرياً ملموساً اليوم: كلمة تقدير، إنصات كامل، أو مساعدة متفق عليها. الخير لا يعني السكوت عن الأذى؛ اطلب دعماً آمناً عند الحاجة.",
    narrator: "رسول الله (ص)",
    source: "وسائل الشيعة",
    reference: "ج20، ص171؛ منقول عن من لا يحضره الفقيه، ج3، ص362",
    sourceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    shiaSourceLocation: "وسائل الشيعة، ج20، ص171؛ منقول عن من لا يحضره الفقيه، ج3، ص362.",
    verification: {
      method: "source_only",
      status: "owner_approved_source_only",
      label: "مصدر شيعي بلا حكم سند منشور",
      verdict: "نُشر بقرار المالك بعد المراجعة",
      referenceUrl: "https://alkafeel.net/islamiclibrary/hadith/wasael-20/wasael-20/v09.html",
    },
  },
  {
    id: "curated-hadith-family-repair",
    text: "تَصِلُ مَنْ قَطَعَكَ وَتُعْطِي مَنْ حَرَمَكَ وَتَعْفُو عَمَّنْ ظَلَمَكَ",
    summary: "في خلافات العائلة، ابدأ بخطوة إصلاح آمنة: وصل، أو عطاء، أو عفو؛ مع مراعاة الحدود والسلامة الشخصية.",
    narrator: "رسول الله (ص)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/2",
    majlisiGrade: "موثق",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 2",
  },
  {
    id: "curated-hadith-kinship-kindness",
    text: "صِلْ رَحِمَكَ وَلَوْ بِشَرْبَةٍ مِنْ مَاءٍ وَأَفْضَلُ مَا تُوصَلُ بِهِ الرَّحِمُ كَفُّ الْأَذَى عَنْهَا",
    summary: "تقوية العائلة لا تحتاج فعلاً ضخماً: تواصل لطيف، ومساعدة يسيرة، والامتناع عن الأذى هي بداية عملية.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 9",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/9",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 9",
  },
  {
    id: "curated-hadith-initiate-family",
    text: "إِنِّي لَأُبَادِرُ أَهْلَ بَيْتِي أَصِلُهُمْ قَبْلَ أَنْ يَسْتَغْنُوا عَنِّي",
    summary: "لا تنتظر دائماً أن يطلب المقربون الاهتمام؛ بادر بالسؤال والزيارة والمساندة قبل الحاجة.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب صلة الرحم، الحديث 25",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/68/25",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب صلة الرحم، الحديث 25",
  },
  {
    id: "curated-hadith-household-partnership",
    text: "كَانَ أَمِيرُ الْمُؤْمِنِينَ صَلَوَاتُ اللهِ عَلَيْهِ يَحْتَطِبُ وَيَسْتَقِي وَيَكْنُسُ وَكَانَتْ فَاطِمَةُ سَلامُ اللهِ عَلَيْهَا تَطْحَنُ وَتَعْجِنُ وَتَخْبِزُ",
    summary: "تقدم الرواية صورة عملية للشراكة في أعمال البيت وخارجه، من دون تحويل الأدوار التاريخية إلى إلزام ثابت على أحد الزوجين.",
    application: "اتفقا على قائمة مرنة للمهام اليومية بحسب الوقت والطاقة والظروف، وراجعاها عند المرض أو ضغط العمل؛ فالمقصود شراكة عملية لا تحميل طرف واحد كل العبء.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 2، باب عمل الرجل في بيته، الحديث 1",
    sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/11/1",
    majlisiGrade: "حسن",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب عمل الرجل في بيته، الحديث 1",
  },
  {
    id: "curated-hadith-family-sustenance",
    text: "الَّذِي يَطْلُبُ مِنْ فَضْلِ اللهِ عَزَّ وَجَلَّ مَا يَكُفُّ بِهِ عِيَالَهُ أَعْظَمُ أَجْراً مِنَ الْمُجَاهِدِ فِي سَبِيلِ اللهِ عَزَّ وَجَلَّ",
    summary: "يبين النص قيمة العمل الذي يكفي الأسرة، ويصلح للتأمل في تقدير الجهد المعيشي والرعاية الاقتصادية داخل البيت.",
    application: "اعترفا بمساهمة كل طرف في إعالة الأسرة، سواء كانت دخلاً أو رعاية منزلية أو عملاً غير مدفوع، وضَعا ميزانية مشتركة من دون تحويل الإنفاق إلى سيطرة أو منّة.",
    narrator: "الإمام الرضا (ع)",
    source: "الكافي",
    reference: "ج5، كتاب 2، باب كدّ على عياله، الحديث 2",
    sourceUrl: "https://thaqalayn.net/ar/hadith/5/2/13/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج5، كتاب 2، باب كدّ على عياله، الحديث 2",
  },
  {
    id: "curated-hadith-relieve-hardship",
    text: "مَنْ أَغَاثَ أَخَاهُ الْمُؤْمِنَ اللَّهْفَانَ اللَّهْثَانَ عِنْدَ جَهْدِهِ فَنَفَّسَ كُرْبَتَهُ وَأَعَانَهُ عَلَى نَجَاحِ حَاجَتِهِ",
    summary: "يركز النص على الاستجابة العملية للضيق: تفريج الكربة والمساعدة في إنجاز الحاجة، لا الاكتفاء بالتعاطف اللفظي.",
    application: "عند التعب أو الضيق، اسأل شريكك عن مساعدة محددة ثم خذ مهمة واقعية مثل إعداد الطعام أو رعاية الأطفال أو إنجاز معاملة؛ لتكن المساندة باحترام لا بلوم أو إلغاء للاستقلال.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب تفريج كرب المؤمن، الحديث 1",
    sourceUrl: "https://thaqalayn.net/ar/hadith/2/1/85/1",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب تفريج كرب المؤمن، الحديث 1",
  },
  {
    id: "curated-hadith-gentleness-blessing",
    text: "الرِّفْقُ يُمْنٌ وَالْخُرْقُ شُؤْمٌ",
    summary: "يجعل النص الرفق منهجاً مستمراً للمعاشرة وإدارة التفاصيل اليومية، لا مجرد استجابة مؤقتة عند نشوء الخلاف.",
    application: "اتفقا على قواعد بسيطة للحديث والعمل: خفض الصوت، الطلب بدلاً من الاتهام، وإتاحة وقت للراحة. الرفق لا يعني السكوت عن الأذى، بل طريقة غير عنيفة لوضع الحدود وطلب الإصلاح.",
    narrator: "رسول الله (ص)، برواية الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب الرفق، الحديث 4",
    sourceUrl: "https://thaqalayn.net/ar/hadith/2/1/58/4",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب الرفق، الحديث 4",
  },
  {
    id: "curated-hadith-child-kindness",
    text: "رَحِمَ اللَّهُ مَنْ أَعَانَ وَلَدَهُ عَلَى بِرِّهِ",
    summary: "يشرح النص أن إعانة الطفل تكون بقبول ميسوره، والتجاوز عن معسوره، وعدم إرهاقه أو التعامل معه بخرق.",
    application: "عند الخطأ أو التقصير، اسأل: ما الذي يقدر عليه الطفل الآن؟ ثم وجّهه من دون إهانة أو تحميل يفوق طاقته.",
    narrator: "رسول الله (ص)، برواية الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج6، كتاب 1، باب الرفق بالأولاد، الحديث 6",
    sourceUrl: "https://thaqalayn.net/hadith/6/1/35/6",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج6، كتاب 1، باب الرفق بالأولاد، الحديث 6",
  },
  {
    id: "curated-hadith-gentle-dealings",
    text: "أَمَرَنِي رَبِّي بِمُدَارَاةِ النَّاسِ كَمَا أَمَرَنِي بِأَدَاءِ الْفَرَائِضِ",
    summary: "يجعل النص اللين في التعامل أصلاً مستمراً؛ ويمكن أن يترجم داخل البيت إلى احترام نبرة الحوار وإتاحة مساحة للشرح والاستماع.",
    application: "عند اختلافكما، ابدآ بتسمية ما تفهمانه من موقف الآخر قبل عرض الاعتراض، من دون أن يعني اللين قبول الإهانة أو تجاوز الحدود.",
    narrator: "الإمام الصادق (ع)، عن رسول الله (ص)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب المداراة، الحديث 4",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/57/4",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب المداراة، الحديث 4",
  },
  {
    id: "curated-hadith-practical-joy",
    text: "مِنْ أَحَبِّ الْأَعْمَالِ إِلَى اللَّهِ عَزَّ وَجَلَّ إِدْخَالُ السُّرُورِ عَلَى الْمُؤْمِنِ: إِشْبَاعُ جَوْعَتِهِ أَوْ تَنْفِيسُ كُرْبَتِهِ أَوْ قَضَاءُ دَيْنِهِ",
    summary: "يربط النص إدخال السرور بالفعل العملي: إطعام، أو تفريج كربة، أو إعانة في التزام مالي؛ لا بالمجاملة وحدها.",
    application: "اختَر فعلاً محدداً يخفف عن شريكك أو أسرتك اليوم: وجبة، مهمة مؤجلة، أو خطوة عملية في ضغط يمر به الطرف الآخر.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب إدخال السرور على المؤمن، الحديث 16",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/82/16",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب إدخال السرور على المؤمن، الحديث 16",
  },
  {
    id: "curated-hadith-good-character",
    text: "إِنَّ حُسْنَ الْخُلُقِ يَبْلُغُ بِصَاحِبِهِ دَرَجَةَ الصَّائِمِ الْقَائِمِ",
    summary: "يقدم النص حسن الخلق قيمة إيجابية مستقلة، لا مجرد امتناع عن الإساءة، ويصلح أساساً للمعاشرة اليومية باحترام.",
    application: "حددا سلوكاً بسيطاً من حسن الخلق تريدان ملاحظته هذا الأسبوع، مثل الإصغاء حتى النهاية أو خفض الصوت أو الاعتذار الواضح.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب حسن الخلق، الحديث 18",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/49/18",
    majlisiGrade: "حسن كالصحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب حسن الخلق، الحديث 18",
  },
  {
    id: "curated-hadith-family-compassion",
    text: "إِنَّ اللَّهَ بَعَثَنِي بِالرَّحْمَةِ لَا بِالْعُقُوقِ",
    summary: "يُقدّم النص الرحمة والبر أصلاً في العلاقة مع الوالدين والأسرة الممتدة، بما يشمل الرفق في التواصل عند اختلاف الخلفيات أو الآراء.",
    application: "اختارا عبارة رحيمة للتواصل مع أحد الوالدين أو الأقارب عند اختلاف الرأي، مع إبقاء السلامة والحدود الشخصية مقدمة إذا كان التواصل مؤذياً أو قهرياً.",
    narrator: "رسول الله (ص)، برواية الإمام الرضا (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب بر الوالدين، الحديث 8",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/69/8",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب بر الوالدين، الحديث 8",
  },
  {
    id: "curated-hadith-social-sincere-advice",
    text: "يَجِبُ لِلْمُؤْمِنِ عَلَى الْمُؤْمِنِ النَّصِيحَةُ لَهُ فِي الْمَشْهَدِ وَالْمَغِيبِ",
    summary: "يربط النص النصيحة الصادقة بالمصلحة والوفاء، لا بالتهكم أو كشف الأسرار أو التحكم في الغير.",
    application: "اتفقا أن تكون النصيحة حول غائب حمايةً لمصلحته لا مناسبةً للتهكم؛ واستبدلا إشاعة محتملة بكلمة دعم أو صمت كريم.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب النصيحة للمؤمن، الحديث 2",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/90/2",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب النصيحة للمؤمن، الحديث 2",
  },
  {
    id: "curated-hadith-social-honor-guest",
    text: "مَنْ أَتَاهُ أَخُوهُ الْمُسْلِمُ فَأَكْرَمَهُ فَإِنَّمَا أَكْرَمَ الله عَزَّ وَجَلَّ",
    summary: "يعطي النص للترحيب بالزائر واللطف معه معنى اجتماعياً، من دون جعل الضيافة تكلفاً أو عبئاً غير محتمل.",
    application: "خططا لفتة ضيافة ميسّرة في البيت أو رسالة ترحيب لضيف أو قريب، بما يناسب القدرة والوقت.",
    narrator: "الإمام الصادق (ع)",
    source: "الكافي",
    reference: "ج2، كتاب 1، باب إلطاف المؤمن وإكرامه، الحديث 3",
    sourceUrl: "https://thaqalayn.net/hadith/2/1/88/3",
    majlisiGrade: "صحيح",
    shiaSourceLocation: "الكافي، ج2، كتاب 1، باب إلطاف المؤمن وإكرامه، الحديث 3",
  },
];
const NON_SHIA_SOURCE_TEXTS = new Set([
  "إِذَا أَرَدْتَ الدُّخُولَ عَلَى أَهْلِكَ فَسَلِّمْ فَإِنَّهُ بَرَكَةٌ عَلَيْكَ وَعَلَى أَهْلِ بَيْتِكَ",
  "التَّوَدُّدُ إِلَى النَّاسِ نِصْفُ الْعَقْلِ",
  "إِنَّ اللَّهَ عَزَّ وَجَلَّ إِذَا أَحَبَّ أَهْلَ بَيْتٍ أَدْخَلَ عَلَيْهِمُ الرِّفْقَ",
  "لَا يَفْرَكْ مُؤْمِنٌ مُؤْمِنَةً، إِنْ كَرِهَ مِنْهَا خُلُقاً رَضِيَ مِنْهَا آخَرَ",
  "أَفْضَلُ الْأَعْمَالِ إِدْخَالُ السُّرُورِ عَلَى الْمُؤْمِنِ",
]);

// يعتمد النشر على حكم منشور منسوب إلى مرجعه مع موضع شيعي وسند قابلين للتحقق؛ لا تكفي شهرة الكتاب أو السند الظاهر أو النقل التجميعي وحدها.
export const HADITH_PUBLICATION_REVIEW: readonly HadithPublicationReview[] = originalHadiths.map(item => {
  const finding = MAJLISI_FINDINGS_BY_TEXT[item.text]
    ?? MAJLISI_FINDINGS_BY_ORIGINAL_REFERENCE[item.reference]
    ?? { majlisiGrade: "غير متحققة" as const };
  const gradeReason = finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
    ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}».`
    : "لم تُتحقق بعد درجة العلّامة المجلسي لهذا النص في مكتبة ثقلين؛ فلا يصلح للاعتماد بهذا المعيار.";

  const hasAcceptedMajlisiEvidence = ACCEPTED_MAJLISI_GRADES.includes(finding.majlisiGrade)
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim())
    && Boolean(finding.gradingReferenceUrl?.startsWith("https://"));
  const hasResearchOnlySourceEvidence = finding.publicationBasis === "verified_shia_chain"
    && Boolean(finding.shiaSourceUrl?.startsWith("https://"))
    && Boolean(finding.shiaSourceLocation?.trim());
  const hasPublishableEvidence = hasAcceptedMajlisiEvidence;
  const publicationBasis = hasAcceptedMajlisiEvidence
    ? "majlisi_accepted" as const
    : undefined;
  const reviewStatus: HadithReviewStatus = hasPublishableEvidence
    ? "accepted"
    : finding.majlisiGrade === "ضعيف" || finding.majlisiGrade === "مرسل"
      ? "rejected_weak_or_mursal"
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? "non_shia_source_identified"
        : finding.shiaSourceUrl || hasResearchOnlySourceEvidence
          ? "source_found_without_grade"
          : "source_or_attribution_unverified";
  const sourceEvidenceStatus: SourceEvidenceStatus = NON_SHIA_SOURCE_TEXTS.has(item.text)
    ? "non_shia_source_identified"
    : finding.shiaSourceUrl?.startsWith("https://thaqalayn.net/hadith/")
      ? "thaqalayn_direct"
      : finding.shiaSourceUrl
        ? "shia_alternate_or_text_variant"
        : "no_source_verified";

  return {
    text: item.text,
    speaker: item.speaker,
    originalSource: item.source,
    originalReference: item.reference,
    ...finding,
    publicationBasis,
    reviewStatus,
    sourceEvidenceStatus,
    verification: hasAcceptedMajlisiEvidence
      ? {
          method: "majlisi_grade",
          status: "publishable",
          label: "درجة المجلسي",
          verdict: finding.majlisiGrade,
          verifier: MAJLISI_VERIFIER,
          verifierWork: MAJLISI_WORK,
          referenceUrl: finding.gradingReferenceUrl,
        }
      : hasResearchOnlySourceEvidence
        ? {
            method: "source_only",
            status: "research_only",
            label: "موضع وسند شيعيان ظاهران",
            referenceUrl: finding.shiaSourceUrl,
          }
        : undefined,
    decision: hasPublishableEvidence ? "approved" : "excluded",
    reason: hasPublishableEvidence
      ? publicationBasis === "majlisi_accepted"
        ? `درجة العلّامة المجلسي المنشورة هي «${finding.majlisiGrade}» مع موضع شيعي ورابط حكم قابلين للفتح؛ أُجيز النص «${item.reference}» للعرض.`
        : `ورد للنص دليل توثيقي منشور؛ أُجيز النص «${item.reference}» للعرض وفق المعيار المعتمد.`
      : NON_SHIA_SOURCE_TEXTS.has(item.text)
        ? `أظهرت نتائج التحقق نسبة النص إلى مصادر غير شيعية، ولذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`
        : hasResearchOnlySourceEvidence
          ? `للنص موضع وسند شيعيان ظاهران، لكن لا يوجد حكم منشور منسوب على السند المطابق؛ سجل النص «${item.reference}» للبحث ولم يجز للعرض.`
        : `${gradeReason} لذلك استبعد النص «${item.reference}» من كتالوج الإنتاج.`,
    thaqalaynSearchUrl: `https://thaqalayn.net/search?q=${encodeURIComponent(item.text)}&exact=1`,
  };
});

export function isPublishableShiaHadithReview(review: HadithPublicationReview) {
  const hasSource = Boolean(review.shiaSourceUrl?.startsWith("https://")) && Boolean(review.shiaSourceLocation?.trim());
  if (review.decision !== "approved" || !hasSource) return false;
  if (review.publicationBasis === "published_scholarly_verdict") {
    return review.verification?.method === "published_scholarly_verdict"
      && review.verification.status === "publishable"
      && Boolean(review.verification.verdict?.trim())
      && Boolean(review.verification.verifier?.trim())
      && Boolean(review.verification.verifierWork?.trim())
      && Boolean(review.verification.referenceUrl?.startsWith("https://"));
  }
  return review.publicationBasis === "majlisi_accepted"
    && ACCEPTED_MAJLISI_GRADES.includes(review.majlisiGrade)
    && Boolean(review.gradingReferenceUrl?.startsWith("https://"));
}

export function isApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return Boolean(review && isPublishableShiaHadithReview(review));
}

export function sourceUrlForApprovedShiaHadith(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  return review && isPublishableShiaHadithReview(review) ? review.shiaSourceUrl : undefined;
}

export function approvedShiaHadithPresentation(text: string) {
  const review = HADITH_PUBLICATION_REVIEW.find(item => item.text === text);
  if (!review || !isPublishableShiaHadithReview(review)) return undefined;
  return {
    text: review.publishedText ?? review.text,
    narrator: review.publishedSpeaker,
    source: review.publishedSource,
    reference: review.publishedReference,
    sourceUrl: review.shiaSourceUrl,
  };
}
