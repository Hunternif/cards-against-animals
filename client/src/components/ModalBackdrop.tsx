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
      width: "100%",
      height: "100%",
      zIndex: "9",
      ...props.style,
    }}
  />;
}