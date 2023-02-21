const debug = require('debug')('botium-connector-azure-clu-intents')
const axios = require('axios')
const DEFAULT_API_VERSION = require('./connector').DEFAULT_API_VERSION

const axiosCustomError = async (options, msg) => {
  try {
    return axios(options)
  } catch (err) {
    throw new Error(`${msg}: ${err.message}`)
  }
}
const _importIt = async ({ caps, dataset, language }) => {
  const requestOptionsImport = {
    url: `${caps.AZURE_CLU_ENDPOINT_URL}/language/authoring/analyze-conversations/projects/${caps.AZURE_CLU_PROJECT_NAME}/:export?stringIndexType=Utf16CodeUnit&api-version=${caps.AZURE_CLU_API_VERSION || DEFAULT_API_VERSION}`,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'post'
  }
  debug(`import request: ${JSON.stringify(requestOptionsImport, null, 2)}`)
  const responseImport = await axiosCustomError(requestOptionsImport, 'Import failed')
  const operationLocation = (responseImport && responseImport.headers && responseImport.headers['operation-location']) ? responseImport.headers['operation-location'] : null
  if (!operationLocation) {
    throw new Error(`Operation Location not found in ${JSON.stringify(responseImport.headers)}`)
  }

  debug(`import status request: ${JSON.stringify(requestOptionsImport, null, 2)}`)
  const requestOptionsImportStatus = {
    url: operationLocation,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'get'
  }
  let resultUrl = null
  let responseImportStatus
  for (let tries = 0; tries < 10 && !resultUrl; tries++) {
    responseImportStatus = await axiosCustomError(requestOptionsImportStatus, 'Import status failed')
    if (responseImportStatus.data.errors?.length > 0) {
      throw new Error(`Import failed: ${JSON.stringify(responseImportStatus.errors)}`)
    }

    if (['cancelled', 'cancelling', 'failed'].includes(responseImportStatus.data.status)) {
      throw new Error(`Import failed, job status is: ${responseImportStatus.data.status}`)
    }

    resultUrl = responseImportStatus.data.resultUrl
    if (!resultUrl) {
      debug(`Try ${tries + 1} Result URI is not ready yet. Waiting 1s.`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  if (!resultUrl) {
    throw new Error(`Failed to retrieve the result URL: ${JSON.stringify(responseImportStatus.data)}`)
  }
  const requestOptionsDownload = {
    url: resultUrl,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'get'
  }
  const responseDownload = await axiosCustomError(requestOptionsDownload, 'Download failed')
  const utterances = {}
  for (const u of (responseDownload.data.assets.utterances || [])) {
    if ((!language || language === u.language) && (!dataset || dataset === u.dataset)) {
      if (!utterances[u.intent]) {
        utterances[u.intent] = {
          name: u.intent,
          utterances: [u.text]
        }
      } else {
        utterances[u.intent].utterances.push(u.text)
      }
    }
  }

  return { chatbotData: responseDownload.data, rawUtterances: utterances }
}
/**
 *
 * @param caps
 * @param buildconvos
 * @param dataset - "Train" for training data, or null for all
 * @param language - in "en-us" format, or null for all
 * @returns {Promise<{utterances: *, convos: *}>}
 */
const importAzureCLUIntents = async ({ caps, buildconvos, dataset, language }) => {
  try {
    const downloadResult = await _importIt({ caps, dataset, language })
    const utterances = Object.values(downloadResult.rawUtterances)
    const convos = []
    if (buildconvos) {
      for (const utterance of utterances) {
        const convo = {
          header: {
            name: utterance.name
          },
          conversation: [
            {
              sender: 'me',
              messageText: utterance.name
            },
            {
              sender: 'bot',
              asserters: [
                {
                  name: 'INTENT',
                  args: [utterance.name]
                }
              ]
            }
          ]
        }
        convos.push(convo)
      }
    }

    return {
      convos,
      utterances
    }
  } catch (err) {
    throw new Error(`Import failed: ${err.message}`)
  }
}

const exportAzureCLUIntents = async ({ caps, uploadmode, dataset, language }, { convos, utterances }, { statusCallback }) => {
  try {
    const { chatbotData, rawUtterances } = await _importIt({
      caps,
      dataset,
      language
    })

    if (uploadmode === 'replace') {
      chatbotData.assets.intents = []
      chatbotData.assets.utterances = []
      for (const { name, utterances: list } of utterances) {
        chatbotData.assets.intents.push({ category: name })
        for (const u of list) {
          chatbotData.assets.utterances.push({ intent: name, text: u })
        }
      }
    } else {
      for (const { name, utterances: list } of utterances) {
        const isNewIntent = !chatbotData.assets.intents.find(({ category }) => category === name)
        if (isNewIntent) {
          chatbotData.assets.intents.push({ category: name })
        }
        for (const u of list) {
          const isNewUtterance = isNewIntent || !rawUtterances[name] || rawUtterances[name].utterances.indexOf(u) < 0
          if (isNewUtterance) {
            chatbotData.assets.utterances.push({ intent: name, text: u, dataset: dataset || 'Train', language: language || 'en-us' })
          }
        }
      }
    }
    const requestOptionsExport = {
      url: `${caps.AZURE_CLU_ENDPOINT_URL}/language/authoring/analyze-conversations/projects/${caps.AZURE_CLU_PROJECT_NAME}/:import?stringIndexType=Utf16CodeUnit&api-version=${caps.AZURE_CLU_API_VERSION || DEFAULT_API_VERSION}`,
      headers: {
        'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
      },
      method: 'POST',
      data: chatbotData
    }
    debug(`export request: ${JSON.stringify(requestOptionsExport, null, 2)}`)
    const responseExport = await axiosCustomError(requestOptionsExport, 'Export failed')
    const operationLocation = responseExport.headers['operation-location']
    if (!operationLocation) {
      throw new Error(`Operation Location not found in ${JSON.stringify(responseExport.headers)}`)
    }

    debug(`export status request: ${JSON.stringify(requestOptionsExport, null, 2)}`)
    const requestOptionsExportStatus = {
      url: operationLocation,
      headers: {
        'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
      },
      method: 'GET'
    }
    let responseExportStatus
    for (let tries = 0; tries < 10 && (responseExportStatus && responseExportStatus.status === 'succeeded'); tries++) {
      responseExportStatus = await axiosCustomError(requestOptionsExportStatus, 'Export status failed')
      if (responseExportStatus.data.errors?.length > 0) {
        throw new Error(`Export failed with errors: ${JSON.stringify(responseExportStatus.data.errors)}`)
      }

      if (['cancelled', 'cancelling', 'failed'].includes(responseExportStatus.data.status)) {
        throw new Error(`Export failed, job status is: ${responseExportStatus.data.status}`)
      }
    }
  } catch (err) {
    throw new Error(`Export process failed: ${err.message}`)
  }

  debug('export finished')
}

// caps, buildconvos, dataset, language
module.exports = {
  importHandler: ({ caps, buildconvos, dataset, language, ...rest } = {}) => importAzureCLUIntents({
    caps,
    buildconvos,
    dataset,
    language,
    ...rest
  }),
  importArgs: {
    caps: {
      describe: 'Capabilities',
      type: 'json',
      skipCli: true
    },
    buildconvos: {
      describe: 'Build convo files for intent assertions (otherwise, just write utterances files)',
      type: 'boolean',
      default: false
    },
    dataset: {
      describe: 'Type of the dataset (Train, or Test)',
      choices: ['Train', 'Test']
    },
    language: {
      describe: 'Language (like en-us)',
      type: 'string',
      default: false
    }
  },
  exportHandler: ({ caps, uploadmode, dataset, language, ...rest } = {}, { convos, utterances } = {}, { statusCallback } = {}) => exportAzureCLUIntents({
    caps,
    uploadmode,
    dataset,
    language,
    ...rest
  }, {
    convos,
    utterances
  }, { statusCallback }),
  exportArgs: {
    caps: {
      describe: 'Capabilities',
      type: 'json',
      skipCli: true
    },
    uploadmode: {
      describe: 'Appending Azure CLU intents and user examples or replace them',
      choices: ['append', 'replace'],
      default: 'append'
    },
    dataset: {
      describe: 'Type of the dataset (Train, or Test)',
      choices: ['Train', 'Test']
    },
    language: {
      describe: 'Language (like en-us)',
      type: 'string'
    }
  }
}
