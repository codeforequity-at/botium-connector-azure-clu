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
        label: 'Endpoint URL',
        description: 'Azure CLU endpoint URL',
        type: 'url',
        required: true
      },
      {
        name: 'AZURE_CLU_ENDPOINT_KEY',
        label: 'Endpoint Key',
        description: 'Azure CLU Subscription Key',
        type: 'secret',
        required: true
      },
      {
        name: 'AZURE_CLU_PROJECT_NAME',
        label: 'Project Name',
        description: 'Azure CLU Project Name',
        type: 'string',
        required: true
      },
      {
        name: 'AZURE_CLU_DEPLOYMENT_NAME',
        label: 'Deployment Name',
        description: 'Azure CLU Deployment Name',
        type: 'string',
        required: true
      }
    ]
  }
}
