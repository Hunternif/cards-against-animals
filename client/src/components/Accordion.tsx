import { ReactNode, useState } from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLElement> { }

interface ItemProps extends React.HTMLAttributes<HTMLElement> {
  header: ReactNode,
}

/** Container for multiple AccordionItem's */
export function Accordion(props: ContainerProps) {
  return <div {...props} className={`accordion-container ${props.className ?? ""}`} />;
}

export function AccordionItem({header, ...props}: ItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openClass = isOpen ? "open" : "closed";
  return (
    <div {...props} className={`accordion-item ${openClass} ${props.className ?? ""}`}>
      <header
        className={openClass}
        onClick={() => setIsOpen(!isOpen)}>
        {header}
      </header>
      {isOpen && <section>{props.children}</section>}
    </div>
  );
}