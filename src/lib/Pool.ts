import ethers from 'ethers'
import { observable } from 'mobx'
import Web3 from 'web3'
import { EXCHANGE_ABI, ERC20_ABI } from '../abi'
import { Contract } from 'web3-eth-contract'
import { bigNumberify, BigNumber } from 'ethers/utils/bignumber'

export default class Pool {
  symbol!: string
  exchangeAddress!: string
  tokenAddress!: string;
  userAddress!: string
  decimals!: number
  base: BigNumber

  @observable volume = bigNumberify(0)
  @observable ethShare = bigNumberify(0)
  @observable tokenShare = bigNumberify(0)
  @observable originEthShare = bigNumberify(0)
  @observable originTokenShare = bigNumberify(0)
  @observable exchangeEthBalance = bigNumberify(0)
  @observable exchangeTokenBalance = bigNumberify(0)

  private web3: Web3
  private exchangeContract: Contract
  private tokenContract: Contract

  constructor(opts: { symbol: string; decimals: number; tokenAddress: string; exchangeAddress: string; userAddress: string }, web3: Web3) {
    Object.getOwnPropertyNames(opts).forEach(v => (this[v] = opts[v])) // copy all properties
    this.web3 = web3
    this.exchangeContract = new web3.eth.Contract(EXCHANGE_ABI, this.exchangeAddress)
    this.tokenContract = new web3.eth.Contract(ERC20_ABI, this.tokenAddress)
    this.base = bigNumberify(10).pow(opts.decimals)
  }

  async init() {
    await this.refreshPoolInfo()
    await this.refreshUserInfo()
  }

  async refreshPoolInfo() {
    const ethBalance = bigNumberify(await this.web3.eth.getBalance(this.exchangeAddress))
    const tokenBalance = bigNumberify(await this.tokenContract.methods.balanceOf(this.exchangeAddress).call())

    console.log(`pool ${ethBalance} ${tokenBalance}`)

    this.exchangeEthBalance = ethBalance
    this.exchangeTokenBalance = tokenBalance
  }

  async refreshUserInfo() {
    const mapReduce = (items: any[]) => items.map(i => {
      return {
        eth: new BigNumber(i.returnValues['eth_amount']),
        token: new BigNumber(i.returnValues['token_amount'])
      }
    }).reduce(
      (prev, curr) => { return { eth: prev.eth.add(curr.eth), token: prev.token.add(curr.token) } },
      { eth: new BigNumber(0), token: new BigNumber(0) }
    )

    const pastAdded = await this.exchangeContract.getPastEvents('AddLiquidity', {
      filter: { provider: this.userAddress },
      fromBlock: 0,
      toBlock: 'latest'
    })

    const pastRemoved = await this.exchangeContract.getPastEvents('RemoveLiquidity', {
      filter: { provider: this.userAddress },
      fromBlock: 0,
      toBlock: 'latest'
    })

    const sumAdded = mapReduce(pastAdded)
    const sumRemoved = mapReduce(pastRemoved)

    this.originEthShare = sumAdded.eth.sub(sumRemoved.eth)
    this.originTokenShare = sumAdded.token.sub(sumRemoved.token)

    const poolSupply = bigNumberify(await this.exchangeContract.methods.totalSupply().call())
    const poolTokenBalance = bigNumberify(await this.exchangeContract.methods.balanceOf(this.userAddress).call())

    const wei = bigNumberify(10).pow(18)
    const poolSharePercentage = poolTokenBalance.mul(wei).div(poolSupply)
    const ethShare = this.exchangeEthBalance.mul(poolSharePercentage).div(wei)
    const tokenShare = this.exchangeTokenBalance.mul(poolSharePercentage).div(wei)

    this.ethShare = ethShare
    this.tokenShare = tokenShare

    console.log('origin', this.originEthShare.toString(), this.originTokenShare.toString())
    console.log('current', ethShare.toString(), tokenShare.toString())
  }
}
