/**
 * Azure Application Insights Centralized Observability Provider
 * 
 * Handles:
 * - Request tracking
 * - Dependency monitoring (DB, Redis)
 * - Exception logging
 * - Distributed tracing for Push Notifications & Background Tasks
 */

import * as appInsights from 'applicationinsights';
import winston from 'winston';

const instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '';

if (instrumentationKey) {
  appInsights.setup(instrumentationKey)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .start();
  
  console.log('✅ Azure Application Insights initialized.');
} else {
  console.warn('⚠️ APPLICATIONINSIGHTS_CONNECTION_STRING not found. Monitoring disabled.');
}

export const telemetryClient = appInsights.defaultClient;

// Custom Winston Transport for App Insights integration
export const monitorLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Track failure in critical flows (e.g. FCM push failures)
 */
export function trackFailure(name: string, error: any, properties?: Record<string, string>) {
  monitorLogger.error(`[FAILURE: ${name}]`, { error: error.message, ...properties });
  
  if (telemetryClient) {
    telemetryClient.trackException({
      exception: error instanceof Error ? error : new Error(String(error)),
      properties: { flow: name, ...properties }
    });
  }
}

/**
 * Track business events (e.g. Order placed, Surge triggered)
 */
export function trackEvent(name: string, properties: Record<string, string>, measurements?: Record<string, number>) {
  monitorLogger.info(`[EVENT: ${name}]`, { ...properties, ...measurements });
  
  if (telemetryClient) {
    telemetryClient.trackEvent({
      name,
      properties,
      measurements
    });
  }
}
