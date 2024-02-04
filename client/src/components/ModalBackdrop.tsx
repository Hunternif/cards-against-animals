interface Props
  extends React.HTMLAttributes<HTMLDivElement> {
}

/**
 * Displays a dark background over in front of other elements.
 * Should be used with an absolutely-positioned modal pop-up.
 */
export function ModalBackdrop(props: Props) {
  return <div className="modal-backdrop" {...props} />;
}