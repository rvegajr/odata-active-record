// Re-export all Astro integration interfaces
export type {
  IAstroConfig,
  IAstroContext,
  IAstroApiHandler,
  IAstroMiddleware,
  IAstroODataService,
  IAstroApiRouteBuilder,
  IAstroSSRIntegration,
  IAstroEdgeIntegration,
  IAstroCache,
  IAstroErrorHandler,
  IAstroRequestUtils,
  IAstroConfigValidator,
  IAstroPerformanceMonitor
} from 'odata-active-record-contracts';

// Re-export core types
export type {
  IQueryResult,
  IUserFriendlyError,
  IEntityNamespace,
  IEntityNamespaceManager
} from 'odata-active-record-contracts';

// Re-export core classes
export { EntityNamespaceManager, ActiveRecord } from 'odata-active-record-core';

// Export the real Astro integration implementation
export { AstroODataIntegration } from './astro-integration';
