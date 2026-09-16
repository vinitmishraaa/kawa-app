export interface LanguageOption {
  code: string;
  label: string; // shown in its own script, not translated
}

// Start with English + Hindi per spec; add more codes + a matching
// locales/<code>.json file to extend.
export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
];
