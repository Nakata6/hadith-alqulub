export function nextTurnNotice(playerName: string) {
  const name = playerName.trim();
  return name ? `الدور الآن لـ ${name}.` : "انتقل الدور إلى اللاعب الآخر.";
}
