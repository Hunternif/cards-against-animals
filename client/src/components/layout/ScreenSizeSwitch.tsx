import { ReactNode, useEffect, useState } from "react";

interface Props {
  widthBreakpoint: number,
  bigScreen: ReactNode,
  smallScreen: ReactNode,
}

/**
 * Renders different results based on screen size.
 * Thanks to https://stackoverflow.com/a/62954922/1093712
 */
export function ScreenSizeSwitch({
  widthBreakpoint, bigScreen, smallScreen,
}: Props) {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResizeWindow = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResizeWindow);
    return () => {
      window.removeEventListener("resize", handleResizeWindow);
    };
  }, []);
  if (width > widthBreakpoint) {
    return bigScreen;
  }
  return smallScreen;
}