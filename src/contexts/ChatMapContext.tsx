import { createContext, useContext, ReactNode } from 'react';

export interface ChatMapContextValue {
  showLocationOnMap: (lat: number, lng: number, name: string) => void;
}

const ChatMapContext = createContext<ChatMapContextValue | null>(null);

export function ChatMapProvider({
  showLocationOnMap,
  children,
}: {
  showLocationOnMap: (lat: number, lng: number, name: string) => void;
  children: ReactNode;
}) {
  return (
    <ChatMapContext.Provider value={{ showLocationOnMap }}>
      {children}
    </ChatMapContext.Provider>
  );
}

export function useChatMap(): ChatMapContextValue | null {
  return useContext(ChatMapContext);
}
