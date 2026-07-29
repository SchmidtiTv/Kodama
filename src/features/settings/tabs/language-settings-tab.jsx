import {
  Button,
  CardRoot,
  ProgressBar,
  ProgressBarFill,
  ProgressBarTrack,
  cn,
} from "@heroui/react";
import { Check, Translate, Users } from "@/shared/icons/icons.jsx";
import { LANGUAGES, translationProgress } from "@/shared/i18n/i18n.js";
import { openUrl } from "@tauri-apps/plugin-opener";
export function LanguageSettingsTab({ language, onLanguageChange, t }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => {
          const pct = translationProgress(lang.code);
          return (
            <CardRoot
              key={lang.code}
              data-testid={`settings-language-${lang.code}`}
              onClick={() => onLanguageChange(lang.code)}
              variant="secondary"
              className={cn(
                "flex flex-row items-center gap-3.5 px-4 py-3 cursor-default border-2 transition-colors",
                language === lang.code
                  ? "border-accent bg-accent-dim"
                  : "border-transparent bg-surface-1 hover:bg-hover"
              )}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: lang.flag,
                }}
                className="w-12 h-[30px] shrink-0 rounded overflow-hidden border border-border"
              />
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-t13 font-medium",
                    language === lang.code ? "text-accent" : "text-primary"
                  )}
                >
                  {lang.label}
                </div>
                {lang.translators?.length > 0 && (
                  <div className="text-t11 text-muted mt-1 flex items-center gap-1">
                    <Users size={12} className="shrink-0" />
                    <span className="truncate">{lang.translators.join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="ml-auto flex items-center gap-3 shrink-0">
                {pct < 100 && (
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      aria-label="Translation progress"
                      value={pct}
                      className="w-28 gap-0!"
                    >
                      <ProgressBarTrack className="h-1.5!">
                        <ProgressBarFill />
                      </ProgressBarTrack>
                    </ProgressBar>
                    <span className="text-[10px] text-muted tabular-nums shrink-0">{pct}%</span>
                  </div>
                )}
                {language === lang.code && <Check size={14} className="text-accent" />}
              </div>
            </CardRoot>
          );
        })}
      </div>
      <CardRoot
        variant="secondary"
        className="bg-surface-1 flex flex-row items-center gap-3 px-4 py-3 mt-2"
      >
        <Translate size={18} className="shrink-0 text-secondary" />
        <div className="flex-1 text-t12 text-secondary leading-snug">
          {t("contributeTranslation")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onPress={() => openUrl("https://crowdin.com/project/kiyoshi-music").catch(console.error)}
        >
          Crowdin →
        </Button>
      </CardRoot>
    </>
  );
}
