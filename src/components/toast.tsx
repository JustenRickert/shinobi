import { JSX, createContext } from "preact";
import { useContext, useMemo, useState } from "preact/hooks";

import "./toast.css";

interface ToastContextState {
  content: null | {
    header: string;
    body: JSX.Element;
  };
  setContent: (header: string, element: JSX.Element) => void;
}

const ToastContext = createContext<ToastContextState>({
  content: null,
  setContent: () => {},
});

export function ToastProvider({ children }: { children: JSX.Element }) {
  const [content, setContent] = useState<ToastContextState["content"]>(null);
  const value = useMemo<ToastContextState>(
    () => ({
      content,
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
            <hr />
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
  const { content, setContent } = useContext(ToastContext);
  return {
    isToastShown: Boolean(content),
    openToast: setContent,
  };
}
