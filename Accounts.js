const  { PrivateKey, AccountCreateTransaction, Mnemonic, Hbar, AccountInfoQuery, AccountDeleteTransaction, AccountUpdateTransaction } = require("@hashgraph/sdk");
require("dotenv").config();
const { Misc } = require("./misc.js");

exports.Accounts = class Accounts extends Misc {
    constructor() {
        super()
        this.network()
    }
//create a new hedera account
    async createAcct(memo="", TokenAsc=undefined) {
        const genMnen = await Mnemonic.generate();
        const mnemonic = genMnen.toString()
    
        const newPrivatekey = await PrivateKey.fromMnemonic(mnemonic)
        const newPublickey = newPrivatekey.publicKey;
        const newKey = newPrivatekey.toString()
        
        const newWallet = new AccountCreateTransaction()
        .setKey(newPublickey)
        .setAccountMemo(memo)
        if (TokenAsc != undefined) {
            newWallet.setMaxAutomaticTokenAssociations(TokenAsc)
        }
        let Tx_deets = await newWallet.execute(this.client);
    
        const reciept = await Tx_deets.getReceipt(this.client);
        const newAcctID = reciept.accountId.toString()

        const acct_deet = {}
        acct_deet["account_ID"] = newAcctID
        acct_deet["privateKey"] = newKey
        acct_deet["mnemonic"] = mnemonic
    
        return acct_deet
    }
//import a hedera account with your private key
    async importWithKey(accountId, privatekey) {
        const userPrivatekey = PrivateKey.fromString(privatekey)
        let deet = {}
        deet["Private Key"] = userPrivatekey
        deet["account ID"] = accountId
        return deet
    }
//import a hedera account with passphrase
    async importWithMnemonic(accountId, mnemonic) {
        const userPrivatekey = await PrivateKey.fromMnemonic(mnemonic)
        let deet = {}
        deet["Private Key"] = userPrivatekey
        deet["account ID"] = accountId
        return deet
    }
//update a hedera account
    async updateAcct(acctId, newkey, oldkey, tokenAsc=0, memo="") {
        const update = new AccountUpdateTransaction()
        .setAccountId(acctId)
        .setKey(newkey)
        .setMaxAutomaticTokenAssociations(tokenAsc)
        .setAccountMemo(memo)
    
        await (await update.sign(PrivateKey.fromString(newkey))).sign(PrivateKey.fromString(oldkey))
    
        const Txn_deet = await update.execute(this.client)
        const receipt = await Txn_deet.getReceipt(this.client)
    
        return receipt.status.toString()
    }
//delete a hedera account
    async deleteAcct(accountId, memo, transferAcctId) {
        const deleteAcctTrans =  new AccountDeleteTransaction()
        .setAccountId(accountId)
        .setTransferAccountId(transferAcctId)
        .freezeWith(this.client)
    
        const delPrivateKey = await PrivateKey.fromMnemonic(memo);
    
        const signTx = await (await deleteAcctTrans.sign(delPrivateKey)).execute(this.client);
        const receipt = await signTx.getReceipt(this.client)
    
        return(receipt.status.toString());
    }
//get account info with account id
    async account_info(acct_id) {
        const query = new AccountInfoQuery()
        .setAccountId(acct_id)
    
        const info = await query.execute(this.client)
        let bar = info.balance.toString()
        let BalHbar = parseFloat(bar)
    
        let details = {}
        let tokens = []
    
        info.tokenRelationships._map.forEach((token) => {
            let token_dict = {}
                token_dict["id"] = token.tokenId.toString()
                token_dict["symbol"] = token.symbol
                token_dict["amount"] = token.balance.toNumber()
                tokens.push(token_dict)
            })
        details["Account_ID"] = acct_id
        details["Hbar_Balance"] = BalHbar
        details["tokens"] =  tokens
        
        for(var i = 0; i < details.tokens.length; i++) {
            const res = await this.TokenReturnInfo(details.tokens[i]["id"].toString())
            const result = await this.nftSerial(details.tokens[i]["id"].toString())
            let n = res.name
            let d = res.dec
            let fac = Math.pow(10, d)
            let bal = details.tokens[i]["amount"] / fac
            details.tokens[i]["name"] = n
            details.tokens[i]["amount"] = bal.toFixed(d)
            details.tokens[i]["decimals"] = d
            details.tokens[i]["Serial"] = result
            details.tokens[i]["custom_fees"] = res.custom_fees.length < 1 ? false : true
            details.tokens[i]["frozen"] = res.freeze_status
            details.tokens[i]["paused"] = res.pause_status
            details.tokens[i]["kyc_enabled"] = res.kyc_status
            details.tokens[i]["deleted"] = res.deleted
            details.tokens[i]["Type"] = res.token_type == "FUNGIBLE_COMMON" ? "Fungible Token" : res.token_type == "NON_FUNGIBLE_UNIQUE" ?
            "Non Fungible Token" : null
        }
        return details
    }
}
