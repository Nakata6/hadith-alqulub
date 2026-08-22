export function stripViteClient(html: string) {
  return html.replace(
    /<script\b[^>]*\bsrc=(["'])(?:https?:\/\/[^"']+)?\/@vite\/client(?:\?[^"']*)?\1[^>]*>\s*<\/script>\s*/gi,
    "",
  );
}
