const request = require('request-promise-native')
const debug = require('debug')('botium-connector-azure-clu-intents')
// we use the older version because the client lib uses it
const DEFAULT_API_VERSION = '2022-05-01'

const importIt = async ({ caps, dataset, language }) => {
  const requestOptionsImport = {
    uri: `${caps.AZURE_CLU_ENDPOINT_URL}/language/authoring/analyze-conversations/projects/${caps.AZURE_CLU_PROJECT_NAME}/:export?stringIndexType=Utf16CodeUnit&api-version=${caps.AZURE_CLU_API_VERSION || DEFAULT_API_VERSION}`,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'POST',
    json: true,
    transform: (body, response) => ({
      headers: response.headers,
      data: body
    })
  }
  debug(`import request: ${JSON.stringify(requestOptionsImport, null, 2)}`)
  const responseImport = await request(requestOptionsImport)
  const operationLocation = (responseImport && responseImport.headers && responseImport.headers['operation-location']) ? responseImport.headers['operation-location'] : null
  if (!operationLocation) {
    throw new Error(`Operation Location not found in ${JSON.stringify(responseImport)}`)
  }

  debug(`import status request: ${JSON.stringify(requestOptionsImport, null, 2)}`)
  const requestOptionsImportStatus = {
    uri: operationLocation,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'GET',
    json: true
  }
  let resultUrl = null
  let responseImportStatus
  for (let tries = 0; tries < 10 && !resultUrl; tries++) {
    responseImportStatus = await request(requestOptionsImportStatus)
    if (responseImportStatus && responseImportStatus.errors && responseImportStatus.errors.length > 0) {
      throw new Error(`Import failed: ${JSON.stringify(responseImportStatus.errors)}`)
    }

    if (responseImportStatus && ['cancelled', 'cancelling', 'failed'].includes(responseImportStatus.status)) {
      throw new Error(`Import failed, job status is: ${responseImportStatus.status}`)
    }

    resultUrl = responseImportStatus.resultUrl
    if (!resultUrl) {
      debug(`Try ${tries + 1} Result URI is not ready yet. Waiting 1s.`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  if (!resultUrl) {
    throw new Error(`Failed to retrieve the result URL: ${JSON.stringify(responseImportStatus)}`)
  }
  const requestOptionsDownload = {
    uri: resultUrl,
    headers: {
      'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
    },
    method: 'GET',
    json: true
  }
  const responseDownload = await request(requestOptionsDownload)
  const utterances = {}
  for (const u of (responseDownload.assets.utterances || [])) {
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

  return { chatbotData: responseDownload, rawUtterances: utterances }
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
    const downloadResult = await importIt({ caps, dataset, language })
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

const exportLuisIntents = async ({ caps, uploadmode, dataset, language }, { convos, utterances }, { statusCallback }) => {
  try {
    const { chatbotData, rawUtterances } = await importIt({ caps, dataset, language })

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
            chatbotData.assets.utterances.push({ intent: name, text: u })
          }
        }
      }
    }

    const requestOptionsExport = {
      uri: `${caps.AZURE_CLU_ENDPOINT_URL}/language/authoring/analyze-conversations/projects/${caps.AZURE_CLU_PROJECT_NAME}/:import?stringIndexType=Utf16CodeUnit&api-version=${caps.AZURE_CLU_API_VERSION || DEFAULT_API_VERSION}`,
      headers: {
        'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
      },
      method: 'POST',
      body: chatbotData,
      json: true,
      transform: (body, response) => ({
        headers: response.headers,
        data: body
      })
    }
    debug(`export request: ${JSON.stringify(requestOptionsExport, null, 2)}`)
    const responseExport = await request(requestOptionsExport)
    const operationLocation = (responseExport && responseExport.headers && responseExport.headers['operation-location']) ? responseExport.headers['operation-location'] : null
    if (!operationLocation) {
      throw new Error(`Operation Location not found in ${JSON.stringify(responseExport)}`)
    }

    debug(`export status request: ${JSON.stringify(requestOptionsExport, null, 2)}`)
    const requestOptionsExportStatus = {
      uri: operationLocation,
      headers: {
        'Ocp-Apim-Subscription-Key': caps.AZURE_CLU_ENDPOINT_KEY
      },
      method: 'GET',
      json: true
    }
    let responseExportStatus
    for (let tries = 0; tries < 10 && (responseExportStatus && responseExportStatus.status === 'succeeded'); tries++) {
      responseExportStatus = await request(requestOptionsExportStatus)
      if (responseExportStatus && responseExportStatus.errors && responseExportStatus.errors.length > 0) {
        throw new Error(`Export failed: ${JSON.stringify(responseExportStatus.errors)}`)
      }

      if (responseExportStatus && ['cancelled', 'cancelling', 'failed'].includes(responseExportStatus.status)) {
        throw new Error(`Export failed, job status is: ${responseExportStatus.status}`)
      }
    }
  } catch (err) {
    throw new Error(`Export failed: ${err.message}`)
  }
}

module.exports = {
  importHandler: ({ caps, versionId, buildconvos, ...rest } = {}) => importAzureCLUIntents({
    caps,
    versionId,
    buildconvos,
    ...rest
  }),
  importArgs: {
    caps: {
      describe: 'Capabilities',
      type: 'json',
      skipCli: true
    },
    versionId: {
      describe: 'LUIS app version (will use active version by default)',
      type: 'string'
    },
    buildconvos: {
      describe: 'Build convo files for intent assertions (otherwise, just write utterances files)',
      type: 'boolean',
      default: false
    }
  },
  exportHandler: ({ caps, uploadmode, versionId, newVersionName, publish, waitfortraining, ...rest } = {}, { convos, utterances } = {}, { statusCallback } = {}) => exportLuisIntents({
    caps,
    uploadmode,
    versionId,
    newVersionName,
    publish,
    waitfortraining,
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
      describe: 'Appending LUIS intents and user examples or replace them',
      choices: ['append', 'replace'],
      default: 'append'
    },
    versionId: {
      describe: 'LUIS app version (will use active version by default)',
      type: 'string'
    },
    newVersionName: {
      describe: 'New LUIS app version name (if not given will be generated)',
      type: 'string'
    },
    publish: {
      describe: 'Publishes the LUIS app version',
      choices: ['staging', 'production']
    },
    waitfortraining: {
      describe: 'Wait until version finished training',
      type: 'boolean',
      default: false
    }
  }
}
