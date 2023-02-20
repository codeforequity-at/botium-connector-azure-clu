# Botium Connector for Azure Conversational Language Understanding

[![NPM](https://nodei.co/npm/botium-connector-azure-clu.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-azure-clu/)

[![Codeship Status for codeforequity-at/botium-connector-azure-clu](https://app.codeship.com/projects/339e78b1-0906-4972-afba-fb5a4488db87/status?branch=master)](https://app.codeship.com/projects/462729)
[![npm version](https://badge.fury.io/js/botium-connector-azure-clu.svg)](https://badge.fury.io/js/botium-connector-azure-clu)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

This is a [Botium](https://github.com/codeforequity-at/botium-core) connector for testing your Azure Conversational Language Understanding intent resolution logic.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works

Azure Conversational Language Understanding is just a stateless NLP recognition engine, extracting intent, and entities. 
You can use corresponding [Botium NLP Asserters](https://botium-docs.readthedocs.io/en/latest/05_botiumscript/index.html#nlp-asserter-intents-entities-confidence)

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Prerequisites

* __Node.js and NPM__
* [AZURE subsription](https://azure.microsoft.com/free/cognitive-services)
* Azure CLU project
* [Resource key, and endpoint of the Azure CLU project](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/conversational-language-understanding/quickstart#get-your-resource-keys-and-endpoint)
* The name of the Azure CLU project
* The deployment name
* A __project directory__ on your workstation to hold test cases and Botium configuration

See also [Quickstart: Conversational language understanding](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/conversational-language-understanding/quickstart))

## Install Botium and Azure Conversational Language Understanding Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-azure-clu
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-azure-clu
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting Azure Conversational Language Understanding

Create a botium.json with Azure resource key, and endpoint:

```javascript
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "Botium Project Azure CLU",
      "CONTAINERMODE": "azure-clu",
      "AZURE_CLU_ENDPOINT_URL": "xxx",
      "AZURE_CLU_ENDPOINT_KEY": "xxx",
      "AZURE_CLU_PROJECT_NAME": "xxx",
      "AZURE_CLU_DEPLOYMENT_NAME": "xxx"
    }
  }
}
```

Botium setup is ready, you can begin to write your [BotiumScript](https://github.com/codeforequity-at/botium-core/wiki/Botium-Scripting) files.

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __azure-clu__ to activate this connector.

### AZURE_CLU_ENDPOINT_URL
See [Resource key, and endpoint of the Azure CLU project](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/conversational-language-understanding/quickstart#get-your-resource-keys-and-endpoint)

### AZURE_CLU_ENDPOINT_KEY
See [Resource key, and endpoint of the Azure CLU project](https://learn.microsoft.com/en-us/azure/cognitive-services/language-service/conversational-language-understanding/quickstart#get-your-resource-keys-and-endpoint)

### AZURE_CLU_PROJECT_NAME
The name of the Azure CLU project

### AZURE_CLU_DEPLOYMENT_NAME
The Azure CLU deployment to test.

### AZURE_CLU_API_VERSION
API version.
_Default: 2022-05-01_

### AZURE_CLU_PARTICIPANT_ID
The participiant ID. See [Azure API doc](https://learn.microsoft.com/en-us/rest/api/language/2022-05-01/conversation-analysis-runtime/analyze-conversation)

### AZURE_CLU_LANGUAGE
The language of the conversation.

### AZURE_CLU_DIRECT_TARGET
The direct target. See [Azure API doc](https://learn.microsoft.com/en-us/rest/api/language/2022-05-01/conversation-analysis-runtime/analyze-conversation)

### AZURE_CLU_TARGET_PROJECT_PARAMETERS
The target project parameters. See [Azure API doc](https://learn.microsoft.com/en-us/rest/api/language/2022-05-01/conversation-analysis-runtime/analyze-conversation)




Possible values:
* staging
* production
