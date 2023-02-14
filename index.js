const BotiumConnectorAzureCLU = require('./src/connector')
const { importHandler, importArgs } = require('./src/intents')
const { exportHandler, exportArgs } = require('./src/intents')

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorAzureCLU,
  Import: {
    Handler: importHandler,
    Args: importArgs
  },
  Export: {
    Handler: exportHandler,
    Args: exportArgs
  },
  PluginDesc: {
    name: 'Azure Conversational Language Understanding',
    provider: 'Microsoft',
    features: {
      intentResolution: true,
      intentConfidenceScore: true,
      alternateIntents: true,
      entityResolution: true,
      entityConfidenceScore: false
    },
    // AZURE_CLU_ENDPOINT_URL: 'AZURE_CLU_ENDPOINT_URL',
    // AZURE_CLU_ENDPOINT_KEY: 'AZURE_CLU_ENDPOINT_KEY',
    // AZURE_CLU_PROJECT_NAME: 'AZURE_CLU_PROJECT_NAME',
    // AZURE_CLU_DEPLOYMENT_NAME: 'AZURE_CLU_DEPLOYMENT_NAME',

    capabilities: [
      {
        name: 'AZURE_CLU_ENDPOINT_URL',
        label: 'AZURE CLU Endpoint URL',
        description: 'By default, "https://.api.cognitiveservices.azure.com" will be used',
        type: 'url',
        required: false
      },
      {
        name: 'LUIS_APP_ID',
        label: 'LUIS App ID',
        description: 'Open your LUIS project, then go to Manage, Application Information, Application ID',
        type: 'string',
        required: true
      },
      {
        name: 'LUIS_ENDPOINT_KEY',
        label: 'LUIS Endpoint Key',
        description: 'Azure Subscription Key for prediction - open your LUIS project, then go to Manage, Azure Resources',
        type: 'secret',
        required: true
      },
      {
        name: 'LUIS_AUTHORING_KEY',
        label: 'LUIS Authoring Key',
        description: 'Azure Subscription Key for authoring - open your LUIS project, then go to Manage, Azure Resources',
        type: 'secret',
        required: false
      }
    ]
  }
}
