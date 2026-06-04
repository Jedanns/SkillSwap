"use client";

import { createContext, useCallback, useContext, useRef } from "react";

type MessageNotification = {
  conversationId: string;
  preview: string;
  sentAt: string;
  senderId: string;
};

type Listener = (n: MessageNotification) => void;

type ContextValue = {
  notify: (n: MessageNotification) => void;
  subscribe: (fn: Listener) => () => void;
};

const MessagesCtx = createContext<ContextValue | null>(null);

export function useMessagesNotify() {
  return useContext(MessagesCtx)!.notify;
}

export function useMessagesSubscribe() {
  return useContext(MessagesCtx)!.subscribe;
}

export function MessagesPanelShell({
  left,
  children,
}: {
  left: React.ReactNode;
  children: React.ReactNode;
}) {
  const listeners = useRef(new Set<Listener>());

  const notify = useCallback((n: MessageNotification) => {
    listeners.current.forEach((fn) => fn(n));
  }, []);

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  return (
    <MessagesCtx.Provider value={{ notify, subscribe }}>
      <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 flex h-[calc(100vh-60px)] overflow-hidden">
        {left}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </MessagesCtx.Provider>
  );
}
