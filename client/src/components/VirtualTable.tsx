import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Props<T> extends React.HTMLAttributes<HTMLTableElement> {
  data: T[];
  rowHeight: number;
  render: (item: T) => ReactNode;
}

/**
 * Renders a large table by hiding rows outside of the screen,
 * to speed up rendering.
 */
export function VirtualTable<T>({
  data,
  rowHeight,
  render,
  ...props
}: Props<T>) {
  const tableRef = useRef<HTMLTableElement>(null);
  /** Offset of table above window, as it scrolls up. */
  const [tableOffset, setTableOffset] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [shouldMeasure, setShouldMeasure] = useState(false);

  const refreshTableOffset = useCallback(() => {
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      setTableOffset(rect.top);
    }
  }, [tableRef]);

  if (shouldMeasure) {
    refreshTableOffset();
    setShouldMeasure(false);
  }

  useEffect(() => {
    refreshTableOffset(); // set initial table offset

    function handleScroll() {
      setShouldMeasure(true);
    }
    function handleResizeWindow() {
      setWindowHeight(window.innerHeight);
      refreshTableOffset();
    }
    if (tableRef.current) {
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResizeWindow);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResizeWindow);
      };
    }
  }, [tableRef]);

  const rowsAboveScreen = Math.floor(Math.max(0, -tableOffset) / rowHeight);
  const visibleRows = Math.ceil(windowHeight / rowHeight) + 5;
  // If the entire table is scrolled out of view,
  // padding can't be more then the entire height:
  const paddingTop = rowHeight * Math.min(data.length, rowsAboveScreen);
  const paddingBottom =
    rowHeight * Math.max(0, data.length - (rowsAboveScreen + visibleRows));
  const tableStyle = useMemo<CSSProperties>(() => {
    return {
      paddingTop,
      paddingBottom,
    };
  }, [paddingTop, paddingBottom]);

  const Row = useCallback(({ item }: { item: T }) => render(item), [render]);

  return (
    <table {...props} ref={tableRef} style={tableStyle}>
      <tbody>
        {data.map((item, i) => {
          if (i < rowsAboveScreen || i > rowsAboveScreen + visibleRows) {
            return null;
          }
          return <Row key={i} item={item} />;
        })}
      </tbody>
    </table>
  );
}
