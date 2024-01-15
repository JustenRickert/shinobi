import { JSX, createContext } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";

import "./toast.css";

interface ToastContextState {
  content: null | {
    header: string;
    body: JSX.Element;
  };
  unsetContent: () => void;
  setContent: (header: string, element: JSX.Element) => void;
}

const ToastContext = createContext<ToastContextState>({
  content: null,
  unsetContent: () => {},
  setContent: () => {},
});

export function ToastProvider({ children }: { children: JSX.Element }) {
  const [content, setContent] = useState<ToastContextState["content"]>(null);
  const value = useMemo<ToastContextState>(
    () => ({
      content,
      unsetContent: () => {
        setContent(null);
      },
      setContent: (header: string, body: JSX.Element) => {
        setContent({
          header,
          body,
        });
      },
    }),
    [content]
  );
  return (
    <ToastContext.Provider value={value}>
      {content && (
        <>
          <div id="toast" className="card">
            <h2>{content.header}</h2>
            <div id="toast-content">{content.body}</div>
          </div>
          <div id="toast-background-overlay" onClick={() => setContent(null)} />
        </>
      )}
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const { content, setContent, unsetContent } = useContext(ToastContext);
  return {
    isToastShown: Boolean(content),
    closeToast: unsetContent,
    openToast: setContent,
  };
}
