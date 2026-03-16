targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment')
param name string

@minLength(1)
@description('Location for resources')
param location string

@secure()
@description('Database connection string for the backend container app.')
param databaseUrl string

var resourceToken = toLower(uniqueString(subscription().id, name, location))
var tags = { 'azd-env-name': name }

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: '${name}-rg'
  location: location
  tags: tags
}

module resources 'resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    location: location
    resourceToken: resourceToken
    tags: tags
    databaseUrl: databaseUrl
  }
}

output AZURE_LOCATION string = location
output RESOURCE_GROUP string = rg.name
