import { ReactNode } from "react";
import { ScrollContainer } from "../../../components/layout/ScrollContainer";

interface Props {
  title?: string,
  headerContent?: ReactNode,
  children: ReactNode,
}

export function AdminSubpage({ title, children, headerContent }: Props) {
  return <div className="admin-subpage">
    <header className="admin-header">
      {title && <h2>{title}</h2>}
      {headerContent}
    </header>
    <ScrollContainer scrollLight>
      {children}
    </ScrollContainer>
  </div>;
}