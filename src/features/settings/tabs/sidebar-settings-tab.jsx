import { Button } from "@heroui/react";

import { ArrowsClockwise, CaretLineLeft } from "@/shared/icons/icons.jsx";
import {
  SettingRow,
  SettingsSectionDesc,
  SettingsSectionLabel,
  Slider,
  Toggle,
} from "@/shared/ui/settings-controls.jsx";

export function SidebarSettingsTab({
  collapsed,
  defaultWidth,
  maxWidth,
  minWidth,
  onCollapsedChange,
  onWidthChange,
  t,
  width,
}) {
  return (
    <div id="set-sec-ap-sidebar" data-settings-section="ap-sidebar" style={{ scrollMarginTop: 8 }}>
      <SettingsSectionLabel>{t("sidebarSettings")}</SettingsSectionLabel>
      <SettingsSectionDesc>{t("sidebarSettingsDesc")}</SettingsSectionDesc>

      <SettingRow
        label={t("sidebarCollapsed")}
        description={t("sidebarCollapsedDesc")}
        icon={<CaretLineLeft />}
      >
        <Toggle
          value={collapsed}
          onChange={(event) => onCollapsedChange(event.target.checked)}
          ariaLabel={t("sidebarCollapsed")}
        />
      </SettingRow>

      <SettingRow
        label={t("sidebarWidth")}
        description={t("sidebarWidthDesc", { width })}
        icon={<CaretLineLeft />}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Slider
            min={minWidth}
            max={maxWidth}
            value={width}
            onChange={onWidthChange}
            width={132}
          />
          <span style={{ minWidth: 40, color: "var(--text-secondary)", fontSize: "var(--t12)" }}>
            {width}px
          </span>
        </div>
      </SettingRow>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => onWidthChange(defaultWidth)}
          className="gap-2 rounded-lg"
        >
          <ArrowsClockwise size={13} />
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
