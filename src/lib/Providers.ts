import Web3 from 'web3'
import Pool from './Pool'

const ADDR = 'addr'
const EXCHANGE = 'exchange'
const DECIMALS = 'decimals'

const tokens = {
  ['DAI']: {
    [ADDR]: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    [EXCHANGE]: '0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667',
    [DECIMALS]: 18
  },
  ['USDC']: {
    [ADDR]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [EXCHANGE]: '0x97deC872013f6B5fB443861090ad931542878126',
    [DECIMALS]: 6
  },
  ['MKR']: {
    [ADDR]: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    [EXCHANGE]: '0x2C4Bd064b998838076fa341A83d007FC2FA50957',
    [DECIMALS]: 18
  },
  ['WETH']: {
    [ADDR]: '',
    [EXCHANGE]: '0xA2881A90Bf33F03E7a3f803765Cd2ED5c8928dFb',
    [DECIMALS]: 18
  }
}

const testaddr = ''

export class Provider {
  static readonly web3 = new Web3(window['ethereum'])

  async wait() {
    return Provider.web3.shh.net.isListening()
  }

  async check() {
    await this.wait()

    // const c = new Provider.web3.eth.Contract(ABI, tokens.DAI[EXCHANGE])
    // c.events.AddLiquidity({ filter: { provider: testaddr } }).on('data', ev => {
    //   console.log(ev)
    // })

    // const past = await c.getPastEvents('AddLiquidity', {
    //   filter: { provider: testaddr },
    //   fromBlock: 0,
    //   toBlock: 'latest'
    // })

    // console.log(past, past[0].returnValues)

    const p = new Pool({ symbol: 'Dai', decimals: 18, tokenAddress: tokens.DAI[ADDR], exchangeAddress: tokens.DAI[EXCHANGE], userAddress: testaddr }, Provider.web3);
    await p.init();
  }
}
