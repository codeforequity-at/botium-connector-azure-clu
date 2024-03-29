require('dotenv').config()
const { exportHandler } = require('../../../src/intents')
const { readCaps } = require('./helper')

describe('exporthandler', function () {
  beforeEach(async function () {
    this.caps = readCaps()
  })
  it('should successfully upload existing utterances', async function () {
    await exportHandler({ caps: this.caps }, {
      utterances: [
        {
          name: 'greet',
          utterances: ['Hi', 'Hey']
        }
      ]
    }, {
      statusCallback: (data) => console.log(data)
    })
  }).timeout(100000)
})
