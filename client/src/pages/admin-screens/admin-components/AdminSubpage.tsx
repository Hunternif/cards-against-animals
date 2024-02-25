import { ReactNode } from "react";
import { ScrollContainer } from "../../../components/layout/ScrollContainer";

interface Props {
  title: string,
  children: ReactNode,
}

export function AdminSubpage({ title, children }: Props) {
  return <div className="admin-subpage">
    <header className="admin-header">
      <h2>{title}</h2>
    </header>
    <ScrollContainer scrollLight>
      {children}
    </ScrollContainer>
  </div>;
}