param location string
param resourceToken string
param tags object
@secure()
param databaseUrl string

// ── Shared Infrastructure ────────────────────────────────────────────────
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-06-01' = {
  name: 'law-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'app-insights-${resourceToken}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2022-03-01' = {
  name: 'cae-${resourceToken}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// ── Backend API (Container App) ──────────────────────────────────────────
resource backendApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: 'backend-${resourceToken}'
  location: location
  tags: union(tags, { 'azd-service-name': 'backend' })
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
      secrets: [
        {
          name: 'db-url'
          value: databaseUrl
        }
        {
          name: 'app-insights-connection-string'
          value: applicationInsights.properties.ConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          name: 'main'
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'db-url'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'app-insights-connection-string'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

// ── DASHBOARDS (Static Web Apps) ─────────────────────────────────────────
resource adminSwa 'Microsoft.Web/staticSites@2022-03-01' = {
  name: 'admin-swa-${resourceToken}'
  location: 'eastus2' // SWA availability restricted in some regions
  tags: union(tags, { 'azd-service-name': 'admin-dashboard' })
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

resource merchantSwa 'Microsoft.Web/staticSites@2022-03-01' = {
  name: 'merchant-swa-${resourceToken}'
  location: 'eastus2'
  tags: union(tags, { 'azd-service-name': 'merchant-dashboard' })
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

output BACKEND_URI string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output ADMIN_URI string = 'https://${adminSwa.properties.defaultHostname}'
output MERCHANT_URI string = 'https://${merchantSwa.properties.defaultHostname}'
