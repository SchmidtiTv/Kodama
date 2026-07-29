import { ArrowSquareOut } from "@/shared/icons/icons.jsx";
import { Button, CardRoot } from "@heroui/react";
export function OverlaySettingsTab({ onOpenOverlayEditor, t }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <CardRoot
        variant="secondary"
        className="w-full max-w-sm px-[22px] py-5 flex flex-col gap-3 items-center text-center"
      >
        <span className="text-t15 font-semibold text-primary">{t("ovlOpenEditorBtn")}</span>
        <span className="text-t12 text-muted leading-relaxed">{t("ovlOpenEditorDesc")}</span>
        <Button
          data-testid="open-overlay-editor"
          size="sm"
          variant="solid"
          color="accent"
          className="mt-1 flex items-center gap-1.5"
          onPress={() => onOpenOverlayEditor?.()}
        >
          <ArrowSquareOut size={14} />
          {t("ovlOpenEditorBtn")}
        </Button>
      </CardRoot>
    </div>
  );
}
