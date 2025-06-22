// src/contexts/xapi-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { XAPIClient, getXAPIClient, createActor, XAPIActor } from '@/lib/xapi';

interface XAPIContextType {
  xapiClient: XAPIClient | null;
  actor: XAPIActor | null;
  isReady: boolean;
}

const XAPIContext = createContext<XAPIContextType>({
  xapiClient: null,
  actor: null,
  isReady: false
});

interface XAPIProviderProps {
  children: ReactNode;
}

export function XAPIProvider({ children }: XAPIProviderProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const [xapiClient, setXapiClient] = useState<XAPIClient | null>(null);
  const [actor, setActor] = useState<XAPIActor | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (userLoaded) {
      // Initialize xAPI client
      const client = getXAPIClient();
      setXapiClient(client);

      // Create actor from Clerk user info
      if (user) {
        const userActor = createActor(
          user.fullName || user.firstName || 'Unknown User',
          user.primaryEmailAddress?.emailAddress || 'unknown@skillsprint.app'
        );
        setActor(userActor);
      }

      setIsReady(true);
    }
  }, [user, userLoaded]);

  return (
    <XAPIContext.Provider value={{ xapiClient, actor, isReady }}>
      {children}
    </XAPIContext.Provider>
  );
}

export function useXAPI() {
  const context = useContext(XAPIContext);
  if (!context) {
    throw new Error('useXAPI must be used within an XAPIProvider');
  }
  return context;
}
