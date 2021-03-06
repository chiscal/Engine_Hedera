const { TransferTransaction, Hbar, PrivateKey, HbarUnit, Client } = require("@hashgraph/sdk");
require("dotenv").config()
const { Misc} = require("./misc.js")

class Transfers extends Misc {
    constructor() {
        super()
        this.network()
    }

    async transferHbar(senderId, receiverId, amount, memo="") {
        const transferAction = new TransferTransaction()
        .addHbarTransfer(senderId, Hbar.from(-amount, HbarUnit.Hbar))
        .addHbarTransfer(receiverId, Hbar.from(amount, HbarUnit.Hbar))
        .setTransactionMemo(memo)
    
        let res = await transferAction.execute(this.client)
        
        const transferReceipt = await res.getReceipt(this.client);
        return transferReceipt.status.toString()
    }
//the transfer function will be passed in as a parameter(changes will be made to this code to make it more efficiently and less memory consuming)
    async scheduledTransfer(y, m, d, hour, min, sec, transfer) {
        const settime = new Date(y, m-1, d, hour, min, sec).getTime()
        const rtime = new Date().getTime()
    
        var res = new Promise(function(resolve, reject) {
            const schtime = Math.round(settime - rtime)
            if (schtime <= 0) {
                reject("set a higher time")
            }
            setTimeout(() => {
                resolve(transfer)
            }, schtime);
        })
        return res
    }

    async transferTokens(tokenid, receiverAcct, amount, senderAcct, senderkey) {
        const tokenTransfer = new TransferTransaction()
            .addTokenTransfer(tokenid, senderAcct, -amount)
            .addTokenTransfer(tokenid, receiverAcct, amount)
            .freezeWith(this.client)
            await tokenTransfer.sign(PrivateKey.fromString(senderkey))
    
        const Tx_deets = await tokenTransfer.execute(this.client)
        const receipt = await Tx_deets.getReceipt(this.client)
        return receipt.status.toString()
    }

    async transferNFT(NFTid, receiverAcct, senderAcct, senderkey, serial=1) {
        const NFTTransfer = new TransferTransaction()
            .addNftTransfer(NFTid, serial, senderAcct, receiverAcct) 
            .freezeWith(this.client)
            await NFTTransfer.sign(PrivateKey.fromString(senderkey))
    
        const Tx_deets = await NFTTransfer.execute(this.client)
        const receipt = await Tx_deets.getReceipt(this.client)
        return receipt.status.toString()
    }

    async TransferTxns(acct_id) {
        const link = this.link;
        const explorer = this.explorer
        const info = await this.Txn_details(acct_id, link);
        const Txn = {}
        const details = []
        for (let i = 0; i < info.transactions.length; i++) {
            const Txn_deet = {}
            if (info.transactions[i]["result"] === "SUCCESS" && info.transactions[i]["transfers"] !== undefined && info.transactions[i]["transfers"].length === 4) {
                Txn_deet["Transactions_ID"] = `${explorer}hedera/search?q=${info.transactions[i]["transaction_id"]}`
                Txn_deet["Name"] = "Hbar"
                let bal = info.transactions[i]["transfers"][2]["amount"]
                Txn_deet["amount"] = Math.abs(bal/100000000)
                info.transactions[i]["transfers"][2]["account"] === acct_id && info.transactions[i]["transfers"][2]["amount"].toString()[0] === "-" ? 
                Txn_deet["type"] = "Debit" :
                info.transactions[i]["transfers"][3]["account"] === acct_id && info.transactions[i]["transfers"][3]["amount"].toString()[0] === "-" ?
                Txn_deet["type"] = "Debit" : 
                Txn_deet["type"] = "Credit"; 
                let date = parseFloat(info.transactions[i]["valid_start_timestamp"])
                Txn_deet["Date"] = this.toDateTime(date)
                details.push(Txn_deet)
            }
            if (info.transactions[i]["result"] === "SUCCESS" && info.transactions[i]["token_transfers"] !== undefined && info.transactions[i]["token_transfers"].length === 2) {
                Txn_deet["Transactions_ID"] = `${explorer}hedera/search?q=${info.transactions[i]["transaction_id"]}`
                const res = await this.TokenReturnInfo(info.transactions[i]["token_transfers"][0]["token_id"])
                let bal = info.transactions[i]["token_transfers"][0]["amount"]/ Math.pow(10, res.dec)
                Txn_deet["Name"] = res.name
                Txn_deet["amount"] = Math.abs(bal)
                info.transactions[i]["token_transfers"][0]["account"] === acct_id && info.transactions[i]["token_transfers"][0]["amount"].toString()[0] === "-" ? 
                Txn_deet["type"] = "Debit" :
                info.transactions[i]["token_transfers"][1]["account"] === acct_id && info.transactions[i]["token_transfers"][1]["amount"].toString()[0] === "-" ? 
                Txn_deet["type"] = "Debit" : 
                Txn_deet["type"] = "Credit";
                let date = parseFloat(info.transactions[i]["valid_start_timestamp"])
                Txn_deet["Date"] = this.toDateTime(date)
                details.push(Txn_deet)
            }
        Txn["Account_ID"] = acct_id
        Txn["Transactions"] = details
        }
        return Txn
    }
}

