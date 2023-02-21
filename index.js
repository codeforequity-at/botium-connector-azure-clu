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
      },
      {
        name: 'AZURE_CLU_PARTICIPANT_ID',
        label: 'Direct Target',
        description: 'Azure CLU Participant ID (Keep it empty to use random)',
        type: 'string',
        required: false
      },
      {
        name: 'AZURE_CLU_LANGUAGE',
        label: 'Language of the conversation (default: autodetect)',
        description: 'API Language of the conversation',
        type: 'choice',
        required: false,
        choices: [
          { key: 'en-us', name: 'English (US)' },
          { key: 'af', name: 'Afrikaans' },
          { key: 'am', name: 'Amharic' },
          { key: 'ar', name: 'Arabic' },
          { key: 'as', name: 'Assamese' },
          { key: 'az', name: 'Azerbaijani' },
          { key: 'be', name: 'Belarusian' },
          { key: 'bg', name: 'Bulgarian' },
          { key: 'bn', name: 'Bengali' },
          { key: 'br', name: 'Breton' },
          { key: 'bs', name: 'Bosnian' },
          { key: 'ca', name: 'Catalan' },
          { key: 'cs', name: 'Czech' },
          { key: 'cy', name: 'Welsh' },
          { key: 'da', name: 'Danish' },
          { key: 'de', name: 'German' },
          { key: 'el', name: 'Greek' },
          { key: 'en-gb', name: 'English (UK)' },
          { key: 'eo', name: 'Esperanto' },
          { key: 'es', name: 'Spanish' },
          { key: 'et', name: 'Estonian' },
          { key: 'eu', name: 'Basque' },
          { key: 'fa', name: 'Persian (Farsi)' },
          { key: 'fi', name: 'Finnish' },
          { key: 'fr', name: 'French' },
          { key: 'fy', name: 'Western Frisian' },
          { key: 'ga', name: 'Irish' },
          { key: 'gd', name: 'Scottish Gaelic' },
          { key: 'gl', name: 'Galician' },
          { key: 'gu', name: 'Gujarati' },
          { key: 'ha', name: 'Hausa' },
          { key: 'he', name: 'Hebrew' },
          { key: 'hi', name: 'Hindi' },
          { key: 'hr', name: 'Croatian' },
          { key: 'hu', name: 'Hungarian' },
          { key: 'hy', name: 'Armenian' },
          { key: 'id', name: 'Indonesian' },
          { key: 'it', name: 'Italian' },
          { key: 'ja', name: 'Japanese' },
          { key: 'jv', name: 'Javanese' },
          { key: 'ka', name: 'Georgian' },
          { key: 'kk', name: 'Kazakh' },
          { key: 'km', name: 'Khmer' },
          { key: 'kn', name: 'Kannada' },
          { key: 'ko', name: 'Korean' },
          { key: 'ku', name: 'Kurdish (Kurmanji)' },
          { key: 'ky', name: 'Kyrgyz' },
          { key: 'la', name: 'Latin' },
          { key: 'lo', name: 'Lao' },
          { key: 'lt', name: 'Lithuanian' },
          { key: 'lv', name: 'Latvian' },
          { key: 'mg', name: 'Malagasy' },
          { key: 'mk', name: 'Macedonian' },
          { key: 'ml', name: 'Malayalam' },
          { key: 'mn', name: 'Mongolian' },
          { key: 'mr', name: 'Marathi' },
          { key: 'ms', name: 'Malay' },
          { key: 'my', name: 'Burmese' },
          { key: 'ne', name: 'Nepali' },
          { key: 'nl', name: 'Dutch' },
          { key: 'nb', name: 'Norwegian (Bokmal)' },
          { key: 'or', name: 'Oriya' },
          { key: 'pa', name: 'Punjabi' },
          { key: 'pl', name: 'Polish' },
          { key: 'ps', name: 'Pashto' },
          { key: 'pt-br', name: 'Portuguese (Brazil)' },
          { key: 'pt-pt', name: 'Portuguese (Portugal)' },
          { key: 'ro', name: 'Romanian' },
          { key: 'ru', name: 'Russian' },
          { key: 'sa', name: 'Sanskrit' },
          { key: 'sd', name: 'Sindhi' },
          { key: 'si', name: 'Sinhala' },
          { key: 'sk', name: 'Slovak' },
          { key: 'sl', name: 'Slovenian' },
          { key: 'so', name: 'Somali' },
          { key: 'sq', name: 'Albanian' },
          { key: 'sr', name: 'Serbian' },
          { key: 'su', name: 'Sundanese' },
          { key: 'sv', name: 'Swedish' },
          { key: 'sw', name: 'Swahili' },
          { key: 'ta', name: 'Tamil' },
          { key: 'te', name: 'Telugu' },
          { key: 'th', name: 'Thai' },
          { key: 'tl', name: 'Filipino' },
          { key: 'tr', name: 'Turkish' },
          { key: 'ug', name: 'Uyghur' },
          { key: 'uk', name: 'Ukrainian' },
          { key: 'ur', name: 'Urdu' },
          { key: 'uz', name: 'Uzbek' },
          { key: 'vi', name: 'Vietnamese' },
          { key: 'xh', name: 'Xhosa' },
          { key: 'yi', name: 'Yiddish' },
          { key: 'zh-hans', name: 'Chinese (Simplified)' },
          { key: 'zh-hant', name: 'Chinese (Traditional)' },
          { key: 'zu', name: 'Zulu' }
        ]
      },
      {
        name: 'AZURE_CLU_API_VERSION',
        label: 'API Version',
        description: 'API Version',
        type: 'choice',
        required: false,
        advanced: true,
        choices: [
          { key: '2022-05-01', name: '2022-05-01 (Production)' },
          // { key: '2022-05-15-preview', name: '2022-05-15-preview (Experimental)' }, // It is the default for the client lib
          // // So it can have a sense to offer it too. But I did not seen it docu
          { key: '2022-10-01-preview', name: '2022-10-01-preview (Experimental)' }
        ]
      },
      {
        name: 'AZURE_CLU_DIRECT_TARGET',
        label: 'Direct Target',
        description: 'Azure CLU Direct Target',
        type: 'string',
        required: false,
        advanced: true
      },
      {
        name: 'AZURE_CLU_TARGET_PROJECT_PARAMETERS',
        label: 'Project Parameters',
        description: 'Azure CLU Project Parameters',
        type: 'json',
        required: false,
        advanced: true
      }
    ]
  }
}
