export interface LanguageOption {
  code: string;
  label: string; // shown in its own script, not translated
  subLabel?: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", subLabel: "Default" },
  { code: "hi", label: "हिन्दी", subLabel: "Hindi" },
  { code: "mr", label: "मराठी", subLabel: "Marathi" },
  { code: "bn", label: "বাংলা", subLabel: "Bengali" },
];
