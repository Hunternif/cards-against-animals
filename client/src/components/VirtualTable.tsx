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

  useEffect(() => {
    function refreshTableOffset() {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect();
        setTableOffset(rect.top);
      }
    }
    refreshTableOffset(); // set initial table offset

    function handleScroll() {
      refreshTableOffset();
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
  const visibleRows = Math.ceil(windowHeight / rowHeight);
  const tableStyle = useMemo<CSSProperties>(() => {
    return {
      paddingTop: rowHeight * rowsAboveScreen,
      paddingBottom:
        rowHeight * (data.length - (rowsAboveScreen + visibleRows)),
    };
  }, [rowsAboveScreen, visibleRows]);

  const Row = useCallback(({ item }: { item: T }) => render(item), [render]);

  return (
    <table {...props} ref={tableRef} style={tableStyle}>
      <tbody>
        {data.map(
          (item, i) => {
            if (i < rowsAboveScreen || i > rowsAboveScreen + visibleRows) {
              return null;
            }
            return <Row key={i} item={item} />;
          }
          // isRowVisible(i, tableOffset) ? <Row key={i} item={item} /> : null
        )}
      </tbody>
    </table>
  );
}
