@description('Prefix for resource names.')
param namePrefix string = 'gift-ideas'

@description('Deployment location.')
param location string = resourceGroup().location

@description('App Service plan SKU (F1 = free, B1 = basic).')
param appServiceSku string = 'B1'

@description('Node runtime for the Linux web app.')
param linuxFxVersion string = 'NODE|22-lts'

var suffix = uniqueString(resourceGroup().id)
var cosmosAccountName = toLower('${namePrefix}-cosmos-${suffix}')
var webAppName = toLower('${namePrefix}-web-${suffix}')
var planName = toLower('${namePrefix}-plan')

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' = {
  name: cosmosAccountName
  location: location
  kind: 'MongoDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    apiProperties: {
      serverVersion: '6.0'
    }
    minimalTlsVersion: 'Tls12'
  }
}

resource mongoDb 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2024-11-15' = {
  parent: cosmos
  name: 'gift_ideas'
  properties: {
    resource: {
      id: 'gift_ideas'
    }
  }
}

resource collection 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases/collections@2024-11-15' = {
  parent: mongoDb
  name: 'giftIdeas'
  properties: {
    resource: {
      id: 'giftIdeas'
      indexes: [
        {
          key: {
            keys: ['_id']
          }
        }
        {
          key: {
            keys: ['id']
          }
          options: {
            unique: true
          }
        }
      ]
    }
  }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: appServiceSku
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: 'npm start'
      appSettings: [
        {
          name: 'MONGODB_URI'
          value: cosmos.listConnectionStrings().connectionStrings[0].connectionString
        }
        {
          name: 'MONGODB_DB'
          value: 'gift_ideas'
        }
        {
          name: 'CLIENT_DIST'
          value: 'public'
        }
        {
          name: 'HOST'
          value: '0.0.0.0'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
}

output webAppName string = webAppName
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output cosmosAccountName string = cosmosAccountName
