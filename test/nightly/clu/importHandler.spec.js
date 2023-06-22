require('dotenv').config()
const assert = require('chai').assert
const { importHandler } = require('../../../src/intents')
const { readCaps } = require('./helper')

describe('importhandler', function () {
  beforeEach(async function () {
    this.caps = readCaps()
  })
  it('should successfully download intents', async function () {
    const result = await importHandler({ caps: this.caps })
    assert.isFalse(!!result.convos?.length)
    assert.isAbove(result.utterances.length, 0)
    const utterance = result.utterances.find(u => (u.name === 'greet'))

    assert.isTrue(!!utterance, '"greet" intent not found')
    assert.equal(utterance.name, 'greet')
    assert.isTrue(utterance.utterances.includes('Hi'))
    assert.isTrue(utterance.utterances.includes('Hey'))
  }).timeout(10000)
})
