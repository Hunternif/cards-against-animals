import { ReactNode, useEffect, useState } from 'react';

interface Props {
  widthBreakpoint: number;
  bigScreen: ReactNode;
  smallScreen: ReactNode;
}

/**
 * Renders different results based on screen size.
 * Thanks to https://stackoverflow.com/a/62954922/1093712
 */
export function ScreenSizeSwitch({
  widthBreakpoint,
  bigScreen,
  smallScreen,
}: Props) {
  const { width } = useScreenSize();
  if (width > widthBreakpoint) {
    return bigScreen;
  }
  return smallScreen;
}

/** Returns true if the screen is wider than the breakpoint. */
export function useScreenWiderThan(widthBreakpoint: number): boolean {
  const { width } = useScreenSize();
  return width > widthBreakpoint;
}

export function useScreenSize(): { width: number; height: number } {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  useEffect(() => {
    const handleResizeWindow = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResizeWindow);
    return () => {
      window.removeEventListener('resize', handleResizeWindow);
    };
  }, []);
  return { width, height };
}
