import { Button, cn, InputRoot, TextFieldRoot } from "@heroui/react";

import { Eye, EyeSlash } from "@/shared/icons/icons.jsx";

export function PinDots({ count, filled }) {
  return (
    <div className="flex gap-3.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-3.5 h-3.5 rounded-full border-2 transition-colors",
            i < filled ? "bg-primary border-primary" : "border-secondary"
          )}
        />
      ))}
    </div>
  );
}

export function PinKeypad({ onKey }) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(3, 68px)" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "del", 0, null].map((key, i) => {
        if (key === null) return <div key={i} />;
        return (
          <Button
            key={i}
            variant={key === "del" ? "ghost" : "secondary"}
            onPress={() => onKey(key === "del" ? "del" : key)}
            className="h-[58px] w-full rounded-xl text-t20 font-semibold"
          >
            {key === "del" ? "⌫" : key}
          </Button>
        );
      })}
    </div>
  );
}

export function PasswordEntryInput({
  value,
  onChange,
  onSubmit,
  show,
  onToggleShow,
  error,
  autoFocus,
  submitLabel,
}) {
  return (
    <div className="flex flex-col items-center gap-3.5">
      <div className="relative w-[260px]">
        <TextFieldRoot aria-label="PIN" value={value} onChange={onChange} className="w-full">
          <InputRoot
            type={show ? "text" : "password"}
            placeholder="••••••••"
            autoFocus={autoFocus}
            onKeyDown={(event) => {
              if (event.key === "Enter" && value.length > 0) onSubmit(value);
            }}
            className={cn("pr-11", error && "border-[#f44336]!")}
          />
        </TextFieldRoot>
        <button
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 flex items-center text-muted hover:text-primary"
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <div className="text-t12 font-medium" style={{ color: "#f44336" }}>
          {error}
        </div>
      )}
      <Button
        variant="primary"
        isDisabled={value.length === 0}
        onPress={() => value.length > 0 && onSubmit(value)}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
