import { ScrollShadowRoot } from "@heroui/react";

export function Carousel({ children, style, insetX = 0 }) {
  const shadowPadding = 16;
  return (
    <ScrollShadowRoot
      orientation="horizontal"
      hideScrollBar={false}
      size={28}
      className="carousel"
      style={{
        display: "flex",
        overflowX: "auto",
        marginLeft: insetX - shadowPadding,
        marginRight: insetX - shadowPadding,
        paddingLeft: shadowPadding,
        paddingRight: shadowPadding,
        ...style,
      }}
    >
      {children}
    </ScrollShadowRoot>
  );
}
