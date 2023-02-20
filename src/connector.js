const debug = require('debug')('botium-connector-azure-clu')
const uuidv1 = require('uuid').v1
const { ConversationAnalysisClient } = require('@azure/ai-language-conversations')
const { AzureKeyCredential } = require('@azure/core-auth')
const { setLogLevel } = require('@azure/logger')
const INCOMPREHENSION_INTENT = 'None'
const DEFAULT_API_VERSION = '2022-05-01'
const DEFAULT_CONVERSATION_LANGUAGE = 'en-us'

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
  AZURE_CLU_LANGUAGE: 'AZURE_CLU_LANGUAGE',
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
    this.client = new ConversationAnalysisClient(endpoint, new AzureKeyCredential(key), { apiVersion: this.caps[Capabilities.AZURE_CLU_API_VERSION] || DEFAULT_API_VERSION })
    this.parameters = {
      projectName: this.caps[Capabilities.AZURE_CLU_PROJECT_NAME],
      deploymentName: this.caps[Capabilities.AZURE_CLU_DEPLOYMENT_NAME],
      isLoggingEnabled: debug.enabled, // If true, the service will keep the query for further review.
      verbose: debug.enabled // If true, the service will return more detailed information in the response.
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
          text: messageText,
          language: this.caps[Capabilities.AZURE_CLU_LANGUAGE] || DEFAULT_CONVERSATION_LANGUAGE
        }
      },
      parameters: this.parameters
    }
    const { result } = await this.client.analyzeConversation(request)

    debug(`Response type ${result.prediction.projectKind} response ${JSON.stringify(result, null, 2)}`)

    let intents
    let entities
    if (result.prediction.projectKind === 'Conversation') {
      debug('Conversation response')
      intents = (result.prediction.intents || []).map(i => ({
        name: i.category,
        confidence: i.confidence,
        incomprehension: isIncomprehension(i.category)
      }))
      entities = (result.prediction.entities || []).map(e => ({
        name: e.category,
        value: e.text
      }))
    } else if (result.prediction.projectKind === 'Orchestration') {
      debug('Orchestration response')
      // there are intent list in this response, but real-intent-name for QuestionAnswering is available
      // just if it is the topIntent. So to be consistent, we just return always the top intent
      const { targetProjectKind, confidence, result: inner } = result.prediction.intents[result.prediction.topIntent]
      if (targetProjectKind === 'NonLinked') {
        intents = [{
          name: result.prediction.topIntent,
          confidence
        }]
      } else if (targetProjectKind === 'Conversation') {
        intents = [{
          name: inner?.prediction?.topIntent || 'N/A',
          confidence
        }]
        entities = (inner?.prediction?.entities || []).map(e => ({
          name: e.category,
          value: e.text
        }))
      } else if (targetProjectKind === 'QuestionAnswering') {
        intents = [{
          name: inner?.answers[0].source || 'N/A',
          confidence
        }]
      } else {
        debug(`Unknown target type ${inner?.prediction?.topIntent || 'N/A'} in ${JSON.stringify(inner, null, 2)}`)
      }
    } else {
      debug(`Unknown project type ${result.prediction.projectKind}`)
    }
    if (intents) {
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

BotiumConnectorAzureCLU.DEFAULT_API_VERSION = DEFAULT_API_VERSION

module.exports = BotiumConnectorAzureCLU
