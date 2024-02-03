import { CSSProperties, ReactNode, useState } from "react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { GameButton } from "../components/Buttons";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { randomAvatar } from "../model/avatars";



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
  const [pic] = useState(randomAvatar());
  return <CenteredLayout innerStyle={{ maxWidth: "500px" }}>
    <h1>Oops!</h1>
    <p>Sorry, an unexpected error has occurred.</p>
    {error != undefined && error != null && <p>
      <i>{getErrorMessage(error)}</i>
    </p>}
    <img src={pic.url} style={{ width: "100%" }} />
    <div style={botRowStyle}>
      <GameButton secondary onClick={() => navigate("/")}>Go home</GameButton>
    </div>
  </CenteredLayout>
}