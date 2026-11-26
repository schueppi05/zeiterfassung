// Zeiterfassung – Azure-Infrastruktur (Region Schweiz)
// Deployment: az deployment group create -g <resource-group> -f infra/main.bicep -p dbAdminPassword=<...>

@description('Region für Datenhaltung und API')
param location string = 'switzerlandnorth'

@description('Präfix für Ressourcennamen')
param prefix string = 'zeiterfassung'

@secure()
param dbAdminPassword string

var suffix = uniqueString(resourceGroup().id)

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: take('st${prefix}${suffix}', 24)
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: { minimumTlsVersion: 'TLS1_2', allowBlobPublicAccess: false }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${prefix}-plan'
  location: location
  kind: 'functionapp'
  sku: { name: 'Y1', tier: 'Dynamic' }
  properties: { reserved: true }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: '${prefix}-db-${suffix}'
  location: location
  sku: { name: 'Standard_B1ms', tier: 'Burstable' }
  properties: {
    version: '16'
    administratorLogin: 'zeitadmin'
    administratorLoginPassword: dbAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 14 }
  }
}

resource db 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgres
  name: 'zeiterfassung'
}

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: '${prefix}-api-${suffix}'
  location: location
  kind: 'functionapp,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22'
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'node' }
        { name: 'AzureWebJobsStorage__accountName', value: storage.name }
        // ENTRA_TENANT_ID, ENTRA_API_CLIENT_ID, ENTRA_ALLOWED_GROUP_ID und DATABASE_URL
        // werden nach dem Deployment gesetzt (DATABASE_URL als Key-Vault-Referenz empfohlen).
      ]
    }
  }
}

output apiHostname string = api.properties.defaultHostName
output dbHost string = postgres.properties.fullyQualifiedDomainName
