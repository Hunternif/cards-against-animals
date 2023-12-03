import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { CenteredLayout } from "../components/layout/CenteredLayout";
import { ReactNode } from "react";
import confused_kitty from '../assets/confused_kitty.jpg'

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

export function ErrorPage() {
  const error = useRouteError();
  return <CenteredLayout style={{ maxWidth: "500px" }}>
    <h1>Oops!</h1>
    <p>Sorry, an unexpected error has occurred.</p>
    {error != undefined && error != null && <p>
      <i>{getErrorMessage(error)}</i>
    </p>}
    <img src={confused_kitty} style={{ width: "100%" }} />
  </CenteredLayout>
}