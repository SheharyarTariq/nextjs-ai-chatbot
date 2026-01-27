"use client";

import { createContext, useContext, useCallback } from "react";

interface AgendaRefreshContextValue {
  refreshAgenda: () => void;
}

const AgendaRefreshContext = createContext<AgendaRefreshContextValue | null>(null);

export function AgendaRefreshProvider({
  children,
  onRefresh,
}: {
  children: React.ReactNode;
  onRefresh: () => void;
}) {
  const refreshAgenda = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  return (
    <AgendaRefreshContext.Provider value={{ refreshAgenda }}>
      {children}
    </AgendaRefreshContext.Provider>
  );
}

export function useAgendaRefresh() {
  const context = useContext(AgendaRefreshContext);
  if (!context) {
    throw new Error("useAgendaRefresh must be used within AgendaRefreshProvider");
  }
  return context;
}
