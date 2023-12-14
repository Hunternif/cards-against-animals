import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode,
  fallback?: ReactNode,
  onError?: (error: any, info?: any) => void,
}

interface State {
  error?: any,
}

/** If error occurs, renders fallback. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any): State {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render() {
    if (this.state.error) {
      // You can render any custom fallback UI
      return this.props.fallback ?? <></>;
    }

    return this.props.children;
  }
}