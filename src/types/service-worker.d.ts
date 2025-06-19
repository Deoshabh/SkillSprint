/**
 * Service Worker Type Definitions for SkillSprint PWA
 * Provides TypeScript support for service worker functionality
 */

// Service Worker Global Types
declare const self: ServiceWorkerGlobalScope;

// Service Worker Event Types
interface ServiceWorkerInstallEvent extends ExtendableEvent {
  waitUntil(f: Promise<any>): void;
}

interface ServiceWorkerActivateEvent extends ExtendableEvent {
  waitUntil(f: Promise<any>): void;
}

interface ServiceWorkerFetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

interface ServiceWorkerMessageEvent extends ExtendableEvent {
  data: any;
  ports: MessagePort[];
}

interface ServiceWorkerSyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

interface ServiceWorkerPushEvent extends ExtendableEvent {
  data: PushMessageData | null;
}

interface ServiceWorkerNotificationEvent extends ExtendableEvent {
  notification: Notification;
  action: string;
}

// Custom Message Types for Communication with Main Thread
interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'GET_VERSION' | 'CLEAR_CACHE' | 'UPDATE_DEBUG_MODE';
  payload?: {
    enabled?: boolean;
    [key: string]: any;
  };
}

interface ServiceWorkerResponse {
  type: 'VERSION_INFO' | 'CACHE_CLEARED' | 'ERROR';
  version?: string;
  cacheName?: string;
  success?: boolean;
  error?: string;
}

// Ad Blocking Configuration
interface AdBlockConfig {
  patterns: string[];
  debugMode: boolean;
  logBlocked: boolean;
  logAllowed: boolean;
}

// Cache Strategy Types
type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

interface CacheConfig {
  name: string;
  version: string;
  staticAssets: string[];
  strategy: CacheStrategy;
  maxAge?: number;
  maxEntries?: number;
}

// Performance Monitoring Types
interface ServiceWorkerStats {
  requestCount: number;
  blockedCount: number;
  cacheHits: number;
  cacheMisses: number;
  networkErrors: number;
}

// Utility Functions Interface
interface ServiceWorkerUtils {
  wildcardToRegExp(pattern: string): RegExp;
  shouldBlockRequest(url: string): boolean;
  logBlockedRequest(url: string, reason?: string): void;
  logAllowedRequest(url: string): void;
  createBlockedResponse(): Response;
  handleCacheStrategy(request: Request): Promise<Response>;
}

// Global Service Worker Configuration
interface ServiceWorkerConfig {
  cacheName: string;
  cacheVersion: string;
  debugMode: boolean;
  adBlocking: AdBlockConfig;
  caching: CacheConfig;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
}

// Export types for use in main application
export {
  ServiceWorkerMessage,
  ServiceWorkerResponse,
  AdBlockConfig,
  CacheStrategy,
  CacheConfig,
  ServiceWorkerStats,
  ServiceWorkerUtils,
  ServiceWorkerConfig
};
