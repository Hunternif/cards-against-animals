import { Outlet } from "react-router-dom";

export function GamePage() {
  // This could be common layout shared between all game screens
  return <><Outlet/></>;
}