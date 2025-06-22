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
  // Check if we're in a build-time environment where Clerk isn't available
  const isBuildTime = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'pk_build_time_placeholder' || 
                     typeof window === 'undefined';
  
  // Use hooks conditionally
  const clerkUser = isBuildTime ? null : useUser();
  const { user, isLoaded: userLoaded } = clerkUser || { user: null, isLoaded: true };
  
  const [xapiClient, setXapiClient] = useState<XAPIClient | null>(null);
  const [actor, setActor] = useState<XAPIActor | null>(null);
  const [isReady, setIsReady] = useState(isBuildTime); // If build time, mark as ready immediately

  useEffect(() => {
    if (isBuildTime) {
      // During build time, just set up a basic client without user info
      const client = getXAPIClient();
      setXapiClient(client);
      setIsReady(true);
      return;
    }

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
  }, [user, userLoaded, isBuildTime]);

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
