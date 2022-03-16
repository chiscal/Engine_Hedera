import { Client as Mirror, transactions, TransactionType } from "@tikz/hedera-mirror-node-ts";
import { Client, TokenInfoQuery} from "@hashgraph/sdk"
const axios = require('axios').default;
require("dotenv").config();

const myAccountId = process.env.MY_ACCOUNT_ID;
const myAccountKey = process.env.MY_TESTNET_PRIVATE_KEY;

const client = Client.forTestnet().setOperator(myAccountId, myAccountKey)

export async function Txn_details(accountid:string, link:string) {
    const getter = new Mirror(link)
    const transactionCursor = transactions(getter)
    .setAccountId(accountid)
    .setLimit(1000)
    .setTransactionType(
        TransactionType.CRYPTOTRANSFER
    )
    .setResult('success')
    const txns = await transactionCursor.get()

    return txns
}

export async function Tokens_issued(accountid:string, link:string) {
    const getter = new Mirror(link)
    const transactionCursor = transactions(getter)
    .setAccountId(accountid)
    .setLimit(1000)
    .setTransactionType(
        TransactionType.TOKENCREATION
    )
    .setResult('success')
    const txns = await transactionCursor.get()

    return txns
}

export async function TokenReturnInfo(tokenid:string) {
    const info = new TokenInfoQuery()
    .setTokenId(tokenid)

    const query = await info.execute(client)

    let id = query.tokenId.toString()
    let name = query.name
    let symbol = query.symbol
    let dec = query.decimals
    let token_type = query.tokenType.toString()
    let custom_fees = query.customFees
    let freeze_status = query.defaultFreezeStatus
    let kyc_status = query.defaultKycStatus
    let pause_status = query.pauseStatus
    let deleted = query.isDeleted
    let max_supply = query.maxSupply.toString()
    let supply_type = query.supplyType.toString()
    let token_memo = query.tokenMemo

    return { id, name, symbol, dec, token_type,custom_fees, freeze_status, kyc_status, pause_status, deleted, max_supply, supply_type, token_memo }
}

export async function nftSerial(nftid:string) {
    try {
        const info = await axios.get(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${nftid}/nfts`)
        let serial = info.data.nfts[0].serial_number
        return serial
    } catch (e) {
        if (e == "TypeError: Cannot read properties of undefined (reading 'serial_number')") {
            let res = null
            return res
        }
    }
}

export function toDateTime(secs: number) {
    var t = new Date(1970, 0, 1);
    t.setSeconds(secs);
    return t.toLocaleString();
}

export function getstamp(y:number, m:number, d:number, hour:number, min:number, sec:number) {
    const stamp = new Date(y, m-1, d, hour, min, sec)
    return stamp
}

export function network(net=true, ID:string=myAccountId, Key:string=myAccountKey) {
    let client:Client;
    let link:string;
    if (net == true) {
        client = Client.forMainnet().setOperator(ID, Key)
        link = "https://mainnet-public.mirrornode.hedera.com/"
    }
    if ( net == false) {
        client = Client.forTestnet().setOperator(ID, Key)
        link = "https://testnet.mirrornode.hedera.com/"
    }
    return { client, link }
}

export async function coin_price(coin:string="hbar") {
    const info = await axios.get(`https://data.messari.io/api/v1/assets/${coin}/metrics`)
    const res = info.data.data.market_data.price_usd
    let price = res.toFixed(3)
    return price
}
