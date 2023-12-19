import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { CSSProperties, ReactNode } from "react";
import confused_kitty from '../assets/confused_kitty.jpg'
import { GameButton } from "../components/Buttons";



function getErrorMessage(error: any): ReactNode {
  if (error instanceof Error) {
    return error.message;
  } else if (isRouteErrorResponse(error)) {
    return `${error.status}: ${error.statusText}`;
  } else if (error.hasOwnProperty("message")) {
    return error.message;
  } else {
    return "Unknown error";
  }
}

const botRowStyle: CSSProperties = {
  position: "relative",
  marginTop: "1.5rem",
  height: "3rem",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
}

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  return <CenteredLayout style={{ maxWidth: "500px" }}>
    <h1>Oops!</h1>
    <p>Sorry, an unexpected error has occurred.</p>
    {error != undefined && error != null && <p>
      <i>{getErrorMessage(error)}</i>
    </p>}
    <img src={confused_kitty} style={{ width: "100%" }} />
    <div style={botRowStyle}>
      <GameButton secondary onClick={() => navigate("/")}>Go home</GameButton>
    </div>
  </CenteredLayout>
}