const debug = require('debug')('botium-connector-azure-clu')
const uuidv1 = require('uuid').v1
const { ConversationAnalysisClient } = require('@azure/ai-language-conversations')
const { AzureKeyCredential } = require('@azure/core-auth')
const { setLogLevel } = require('@azure/logger')
const INCOMPREHENSION_INTENT = 'None'

const INCOMPREHENSION_INTENT_STRUCT = {
  name: INCOMPREHENSION_INTENT,
  incomprehension: true,
  confidence: 1
}

const isIncomprehension = (intent) => {
  if (intent.intent === INCOMPREHENSION_INTENT) {
    return true
  }
}

const Capabilities = {
  AZURE_CLU_ENDPOINT_URL: 'AZURE_CLU_ENDPOINT_URL',
  AZURE_CLU_ENDPOINT_KEY: 'AZURE_CLU_ENDPOINT_KEY',
  AZURE_CLU_PROJECT_NAME: 'AZURE_CLU_PROJECT_NAME',
  AZURE_CLU_DEPLOYMENT_NAME: 'AZURE_CLU_DEPLOYMENT_NAME',
  // Just for export/import?
  AZURE_CLU_API_VERSION: 'AZURE_CLU_API_VERSION',
  // experimental, not tested, optional caps
  AZURE_CLU_PARTICIPANT_ID: 'AZURE_CLU_PARTICIPANT_ID',
  AZURE_CLU_DIRECT_TARGET: 'AZURE_CLU_DIRECT_TARGET',
  AZURE_CLU_TARGET_PROJECT_PARAMETERS: 'AZURE_CLU_TARGET_PROJECT_PARAMETERS'
}

class BotiumConnectorAzureCLU {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.client = null
    this.parameters = null
    this.participantId = null
    this.conversationId = null
  }

  async Validate () {
    debug('Validate called')
    if (!this.caps[Capabilities.AZURE_CLU_ENDPOINT_URL]) throw new Error('AZURE_CLU_ENDPOINT_URL capability required')
    if (!this.caps[Capabilities.AZURE_CLU_ENDPOINT_KEY]) throw new Error('AZURE_CLU_ENDPOINT_KEY capability required')
    if (!this.caps[Capabilities.AZURE_CLU_PROJECT_NAME]) throw new Error('AZURE_CLU_PROJECT_NAME capability required')
    if (!this.caps[Capabilities.AZURE_CLU_DEPLOYMENT_NAME]) throw new Error('AZURE_CLU_DEPLOYMENT_NAME capability required')
  }

  Build () {
    const endpoint = this.caps[Capabilities.AZURE_CLU_ENDPOINT_URL]
    const key = this.caps[Capabilities.AZURE_CLU_ENDPOINT_KEY]
    this.client = new ConversationAnalysisClient(endpoint, new AzureKeyCredential(key))
    this.parameters = {
      projectName: this.caps[Capabilities.AZURE_CLU_PROJECT_NAME],
      deploymentName: this.caps[Capabilities.AZURE_CLU_DEPLOYMENT_NAME],
      isLoggingEnabled: debug.enabled
    }

    // The name of a target project to forward the request to.
    if (this.caps[Capabilities.AZURE_CLU_DIRECT_TARGET]) {
      this.parameters.directTarget = this.caps[Capabilities.AZURE_CLU_DIRECT_TARGET]
    }

    // A dictionary representing the parameters for each target project.
    if (this.caps[Capabilities.AZURE_CLU_TARGET_PROJECT_PARAMETERS]) {
      this.parameters.targetProjectParameters = this.caps[Capabilities.AZURE_CLU_TARGET_PROJECT_PARAMETERS]
    }

    if (debug.enabled) {
      setLogLevel('info')
    }
  }

  Start () {
    debug('Start called')
    this.participantId = this.caps[Capabilities.AZURE_CLU_PARTICIPANT_ID] || `${uuidv1()}`
    this.conversationId = 0
  }

  async UserSays ({ messageText }) {
    const request = {
      kind: 'Conversation',
      analysisInput: {
        conversationItem: {
          id: `${this.conversationId++}`,
          participantId: this.participantId,
          text: messageText
        }
      },
      parameters: this.parameters
    }
    const { result } = await this.client.analyzeConversation(request)

    const intents = (result.prediction.intents || []).map(i => ({
      name: i.category,
      confidence: i.confidence,
      incomprehension: isIncomprehension(i.category)
    }))
    const entities = (result.prediction.entities || []).map(e => ({
      name: e.category,
      value: e.text
    }))
    const structuredResponse = {
      sender: 'bot',
      nlp: {
        intent: intents.length === 0 ? INCOMPREHENSION_INTENT_STRUCT : Object.assign({}, intents[0], { intents: intents.slice(1) }),
        entities
      },
      sourceData: {
        request: request,
        response: result
      }
    }
    debug(`Structured response: ${JSON.stringify(structuredResponse, null, 2)}`)
    setTimeout(() => this.queueBotSays(structuredResponse), 0)
  }

  Stop () {
    debug('Stop called')
    this.participantId = null
    this.conversationId = null
  }

  Clean () {
    debug('Clean called')
    this.client = null
    this.parameters = null
  }
}

module.exports = BotiumConnectorAzureCLU
