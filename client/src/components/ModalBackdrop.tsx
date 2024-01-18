interface Props
  extends React.HTMLAttributes<HTMLDivElement> {
}

/**
 * Displays a dark background over in front of other elements.
 * Should be used with an absolutely-positioned modal pop-up.
 */
export function ModalBackdrop(props: Props) {
  return <div className="modal-backdrop"
    {...props}
    style={{
      position: "fixed",
      width: "100vw",
      height: "100vh",
      top: 0,
      left: 0,
      zIndex: "9",
      ...props.style,
    }}
  />;
}