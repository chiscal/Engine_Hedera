const { TokenCreateTransaction, PrivateKey, TokenType, TokenSupplyType, CustomFixedFee, CustomFractionalFee, CustomRoyaltyFee, TokenUpdateTransaction, TokenDeleteTransaction, TokenMintTransaction, Hbar, TokenBurnTransaction, TokenFreezeTransaction, TokenUnfreezeTransaction, TokenGrantKycTransaction, TokenRevokeKycTransaction, TokenAssociateTransaction, TokenDissociateTransaction, TokenPauseTransaction, TokenUnpauseTransaction, TokenWipeTransaction, TokenNftInfoQuery, NftId, TokenId, TransferTransaction, HbarUnit } = require("@hashgraph/sdk");
const { Accounts } = require("./Accounts.js")

class Tokens extends Accounts {
    constructor() {
        super()
        this.network()
    }
//create a fungible token without added functionalities
    async createFungibleToken(tname, tsymbol, inisupply, decimal, tresacct, treskey, memo="") {
        const create = new TokenCreateTransaction()
        .setTokenName(tname)
        .setTokenSymbol(tsymbol)
        .setTreasuryAccountId(tresacct)
        .setTokenMemo(memo)
        .setInitialSupply(inisupply)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(decimal)
    
        await create.freezeWith(this.client).sign(PrivateKey.fromString(treskey))
        
        const Tx_det = await create.execute(this.client)
    
        const receipt = await Tx_det.getReceipt(this.client)
        const tokenid = receipt.tokenId
    
        return tokenid
    }
//create a custom fungible token with added functionalities
    async createCustomFungible(acctId, tname, tsymbol, decimal, inisupply, tresacct, treskey, freezekey, wipekey, supplykey, pausekey, adminkey, kyckey, collectorid, tokenAmt, TokenID, HbarAmt, num, denum, min, max, charged, finite, freeze, maxsupply, memo="") {
        let token_deets = {}
        let custom = []
        const ID = await account_info(acctId)
        const price = await this.coin_price()
        let amt = ID.Hbar_Balance*price
        let cost = parseFloat((10/price).toFixed(2))
//this transaction charges your account $10 for creating a fungible token with the full functionalities of hedera hasgraph, this is not related to hedera in anyway
        if (amt > 12) {
            let transfer = new TransferTransaction()
            .addHbarTransfer(acctId, Hbar.from(- cost, HbarUnit.Hbar))
            .addHbarTransfer("0.0.7858233", Hbar.from(cost, HbarUnit.Hbar))
            const createcustom = new TokenCreateTransaction()
            .setTokenName(tname)
            .setTokenSymbol(tsymbol)
            .setDecimals(decimal)
            .setTokenMemo(memo)
            .setTokenType(TokenType.FungibleCommon)
            .setInitialSupply(inisupply)
            .setTreasuryAccountId(tresacct)
            if(freezekey != undefined) {
                createcustom.setFreezeKey(PrivateKey.fromString(freezekey))
            }
            if (wipekey != undefined) {
                createcustom.setWipeKey(PrivateKey.fromString(wipekey))
            }
            if(supplykey != undefined) {
                createcustom.setSupplyKey(PrivateKey.fromString(supplykey))
            }
            if(pausekey != undefined) {
                createcustom.setPauseKey(PrivateKey.fromString(pausekey))
            }
            if(adminkey != undefined) {
                createcustom.setAdminKey(PrivateKey.fromString(adminkey))
            }
            if (freeze == true) {
                createcustom.setFreezeDefault(true)
            }
            if (freeze == false) {
                createcustom.setFreezeDefault(false)
            }
            if (finite == true) {
                createcustom.setSupplyType(TokenSupplyType.Finite)
                createcustom.setMaxSupply(maxsupply)
            }
            if (finite == false) {
                createcustom.setSupplyType(TokenSupplyType.Infinite)
            }
//this transaction charges your account $50 for creating a fungible token with a single custom fee, this is not related to hedera in anyway    
            if (collectorid != undefined && TokenID != undefined) {
                if (amt > 64) {
                    let cost1 = parseFloat((50/price).toFixed(2))
                    cost += cost1
                    transfer = new TransferTransaction().addHbarTransfer(acctId, Hbar.from(-cost, HbarUnit.Hbar)).addHbarTransfer("0.0.7858233", Hbar.from(cost, HbarUnit.Hbar))
                    const fixed = new CustomFixedFee()
                    .setFeeCollectorAccountId(collectorid)
                    .setAmount(tokenAmt)
                    .setDenominatingTokenId(TokenId.fromString(TokenID))
                    if (HbarAmt !== undefined ) {
                        fixed.setHbarAmount(new Hbar(HbarAmt))
                    }
                    custom.push(fixed)
                } else {
                    return "insufficient amount"
                }
            }
//this transaction charges your account $50 for creating a fungible token with multiple custom fees, this is not related to hedera in anyway        
            if (collectorid != undefined && num != undefined && denum != undefined){
                if (amt > 119) {
                    let cost2 = parseFloat((50/price).toFixed(2))
                    cost += cost2
                    transfer = new TransferTransaction().addHbarTransfer(acctId, Hbar.from(-cost, HbarUnit.Hbar)).addHbarTransfer("0.0.7858233", Hbar.from(cost, HbarUnit.Hbar))
                    const fractional = new CustomFractionalFee()
                    .setFeeCollectorAccountId(collectorid)
                    .setNumerator(num)
                    .setDenominator(denum)
                    .setMin(min)
                    .setMax(max)
                    if (charged == true){
                        fractional.setAssessmentMethod(true)
                    }
                    custom.push(fractional)
                } else {
                    return "insufficient amount"
                }
            }
            createcustom.setCustomFees(custom)
    
            if (kyckey != undefined) {
                createcustom.setKycKey(PrivateKey.fromString(kyckey))
            }
    
            await (await createcustom.freezeWith(this.client).sign(PrivateKey.fromString(treskey))).sign(PrivateKey.fromString(adminkey))
    
            let trans_Action = await transfer.execute(this.client)
            let trans_deet = await trans_Action.getReceipt(this.client)
            let status = trans_deet.status.toString()
    
            const Tx_det = await createcustom.execute(this.client)
            const receipt = await Tx_det.getReceipt(this.client)
            const tokenid = receipt.tokenId.toString()
    
            token_deets["token_ID"] = tokenid
            token_deets["status"] = status
            token_deets["cost"] = cost
        }
        return token_deets
    }
//create an nft on hedera hashgraph
    async createNft(acctid, nftname, nftsymbol, tresacct, treskey, supplykey, collectorid, num, denum, fallbackfee, memo="") {
        let ID = await this.account_info(acctid)
        let price = await this.coin_price()
        let amt = ID.Hbar_Balance*price
        let cost = parseFloat((50/price).toFixed(2))
        let transfer;
        let create = {}
        const nft = new TokenCreateTransaction()
        .setTokenName(nftname)
        .setTokenSymbol(nftsymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setTokenMemo(memo)
        .setInitialSupply(0)
        .setTreasuryAccountId(tresacct)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1)
        ////this transaction charges your account $50 for creating a non fungible token with custom fees, this is not related to hedera in anyway    
        if (collectorid != undefined && num != undefined && denum != undefined) {
            if (amt > 55) {
                transfer = new TransferTransaction().addHbarTransfer(acctid, Hbar.from(-cost, HbarUnit.Hbar)).addHbarTransfer("0.0.7858233", Hbar.from(cost, HbarUnit.Hbar))
                const royalty = new CustomRoyaltyFee()
                .setFeeCollectorAccountId(collectorid)
                .setNumerator(num)
                .setDenominator(denum)
                if (fallbackfee != undefined) {
                    royalty.setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(fallbackfee)))
                }
                nft.setCustomFees([royalty])
            }
        }
        nft.setSupplyKey(PrivateKey.fromString(supplykey))
        nft.freezeWith(this.client)
        await nft.sign(PrivateKey.fromString(treskey))
    
        let trans_Action = await transfer.execute(this.client)
        let trans_deet = await trans_Action.getReceipt(this.client)
        let status = trans_deet.status.toString()
    
        const Tx_det = await nft.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
        const tokenid = receipt.tokenId.toString()
        create["nft_id"] = tokenid
        create["status"] = status
        create["cost"] = cost
    
        return create
    }
//update an existing token on the hedera network
    async updateToken(tokenid, tname, tsymbol, adminkey, tresacct, treskey, newadmin, kyckey, freezekey, wipekey, supplykey, pausekey, memo="") {
        const update = new TokenUpdateTransaction()
        .setTokenId(tokenid)
        .setTokenName(tname)
        .setTokenSymbol(tsymbol)
        .setTokenMemo(memo)
        if (tresacct != undefined && treskey != undefined) {
            update.setTreasuryAccountId(tresacct)
            update.freezeWith(client)
            await update.sign(PrivateKey.fromString(treskey))
        }
        if (newadmin != undefined) {
            update.setAdminKey(PrivateKey.fromString(newadmin))
            update.freezeWith(client)
            await update.sign(PrivateKey.fromString(newadmin))
        }
        if(kyckey != undefined) {
            update.setKycKey(PrivateKey.fromString(kyckey))
        }
        if (freezekey != undefined) {
            update.setFreezeKey(PrivateKey.fromString(freezekey))
        }
        if (wipekey != undefined) {
            update.setWipeKey(PrivateKey.fromString(wipekey))
        }
        if (supplykey != undefined) {
            update.setSupplyKey(PrivateKey.fromString(supplykey))
        }
        if (pausekey != undefined) {
            update.setPauseKey(PrivateKey.fromString(pausekey))
        }
    
        update.freezeWith(this.client)
        await update.sign(PrivateKey.fromString(adminkey))
    
        const Tx_det = await update.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//delete an existing token on the hedera network
    async deleteToken(tokenid, adminkey) {
        const delToken = new TokenDeleteTransaction()
        .setTokenId(tokenid)
        .freezeWith(this.client)
        await delToken.sign(PrivateKey.fromString(adminkey))
    
        const Tx_det = await  delToken.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
    
//mint more amount of existing tokens on the hedera network
    async mintToken(tokenid, amount, supplykey) {
        const mint = new TokenMintTransaction()
        .setTokenId(tokenid)
        .setAmount(amount)
        .freezeWith(this.client)
    
        await mint.sign(PrivateKey.fromString(supplykey))
        const Tx_det = await mint.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client);
    
        const status = receipt.status.toString()
        return status
    }
//mint nft on the hedera network
    async mintNFT(tokenid, supplykey, file_link) {
        const mint = new TokenMintTransaction()
        .setTokenId(tokenid)
        .setMetadata([Buffer.from(file_link)])
        .freezeWith(this.client)
    
        await mint.sign(PrivateKey.fromString(supplykey))
        const Tx_det = await mint.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        let deets = {}
        deets["Token_ID"] = tokenid
        deets["serial"] = receipt.serials[0].low
    
        return deets
    }
//burn an existing token on the hedera network
    async burnToken(tokenid, amount, supplykey) {
        const burn = new TokenBurnTransaction()
        .setTokenId(tokenid)
        .setAmount(amount)
        .freezeWith(this.client)
    
        await burn.sign(PrivateKey.fromString(supplykey))
    
        const Tx_det = await burn.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//burn an existing nft on the hedera network, this defaults to one as you can only mint one nft with mint engine (you can optionally add an nft serial or serials minted else where)
    async burnNFT(tokenid , supplykey, serial=1) {
        const burn = new TokenBurnTransaction()
        .setTokenId(tokenid)
        .setSerials([serial])
        .freezeWith(this.client)
    
        await burn.sign(PrivateKey.fromString(supplykey))
        const Tx_det = await burn.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//freeze a token for an account on the hedera network
    async freezeToken(tokenid, accountid, freezekey) {
        const freeze = new TokenFreezeTransaction()
        .setAccountId(accountid)
        .setTokenId(tokenid)
        .freezeWith(this.client)
        await freeze.sign(PrivateKey.fromString(freezekey))
    
        const Tx_det = await freeze.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        receipt.status.toString()
    }
//unfreeze a frozen token for an account on the hedera network 
    async unfreezeToken(tokenid, accountid, freezekey) {
        const unfreeze = new TokenUnfreezeTransaction()
        .setAccountId(accountid)
        .setTokenId(tokenid)
        .freezeWith(this.client)
        await unfreeze.sign(PrivateKey.fromString(freezekey))
    
        const Tx_det = await unfreeze.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//enable kycflag for an account (this applies to tokens with kyc)
    async EnableKycFlag(tokenid, accountid, kyckey) {
        const enablekyc = new TokenGrantKycTransaction()
        .setAccountId(accountid)
        .setTokenId(tokenid)
        .freezeWith(this.client)
    
        await enablekyc.sign(PrivateKey.fromString(kyckey))
    
        const Tx_det = await enablekyc.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//revoke kycflag for an account (this applies to tokens with kyc)
    async RevokeKycFlag(tokenid, accountid, kyckey) {
        const revokekyc = new TokenRevokeKycTransaction()
        .setAccountId(accountid)
        .setTokenId(tokenid)
        .freezeWith(this.client)
    
        await revokekyc.sign(PrivateKey.fromString(kyckey))
    
        const Tx_det = await revokekyc.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//associate a token to an account
    async AssociateToken(accountid, tokenid, accountkey) {
        const associate = new TokenAssociateTransaction()
        .setAccountId(accountid)
        .setTokenIds([tokenid])
        .freezeWith(this.client)
    
        await associate.sign(PrivateKey.fromString(accountkey))
    
        const Tx_det = await associate.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//dissociate a token from an account
    async DissociateToken(accountid, tokenid, accountkey) {
        const dissociate = new TokenDissociateTransaction()
        .setAccountId(accountid)
        .setTokenIds([tokenid])
        .freezeWith(this.client)
    
        await dissociate.sign(PrivateKey.fromString(accountkey))
    
        const Tx_det = await dissociate.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//pause token from transactions on the hedera network
    async PauseToken(tokenid, pausekey) {
        const pause = new TokenPauseTransaction()
        .setTokenId(tokenid)
        .freezeWith(this.client)
    
        await pause.sign(PrivateKey.fromString(pausekey))
    
        const Tx_det = await pause.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//pause token from transactions on the hedera network
    async UnPauseToken(tokenid, pausekey) {
        const unpause = new TokenUnpauseTransaction()
        .setTokenId(tokenid)
        .freezeWith(this.client)
    
        await unpause.sign(PrivateKey.fromString(pausekey))
    
        const Tx_det = await unpause.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//wipe a token from an account
    async WipeToken(tokenid, accountid, amount, accountkey, wipekey) {
        const wipe = new TokenWipeTransaction()
        .setTokenId(tokenid)
        .setAccountId(accountid)
        .setAmount(amount)
        .freezeWith(this.client)
    
        await (await wipe.sign(PrivateKey.fromString(accountkey))).sign(PrivateKey.fromString(wipekey))
    
        const Tx_det = await wipe.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.lient)
    
        const status = receipt.status.toString()
        return status
    } 
//wipe an nft from an account
    async WipeNFT(tokenid, serial, accountid, accountkey, wipekey) {
        const wipe = new TokenWipeTransaction()
        .setTokenId(tokenid)
        .setAccountId(accountid)
        .setSerials([serial])
        .freezeWith(this.client)
    
        await (await wipe.sign(PrivateKey.fromString(accountkey))).sign(PrivateKey.fromString(wipekey))
    
        const Tx_det = await wipe.execute(this.client)
        const receipt = await Tx_det.getReceipt(this.client)
    
        const status = receipt.status.toString()
        return status
    }
//get nft info
    async NfTinfo(nftid, serial=1) {
        const nftInfos = new TokenNftInfoQuery()
        .setNftId(NftId.fromString(`${nftid}@${serial}`))
        
        const info = await nftInfos.execute(this.client);
        let meta = info[0].metadata.toString()
    
        return meta
    }
//get the list of created tokens by an account, this doesn't return the list(this doesn't return created nft) 
    async Created_Tokens(acct_id) {
        const link = this.link;
        const explorer = this.explorer
        const info = await this.Tokens_issued(acct_id, link)
        const Details = {}
        const Tokens = []
        for (let i = 0; i < info.transactions.length; i++) {
            const created ={}
            if (info.transactions[i].result == "SUCCESS" && info.transactions[i]["token_transfers"] !== undefined && info.transactions[i]["token_transfers"].length == 1) {
                if (info.transactions[i]["token_transfers"][0]["account"] == acct_id) {
                    let tokenid = info.transactions[i]["token_transfers"][0]["token_id"]
                    const res = await this.TokenReturnInfo(tokenid)
                    created["URl"] = `${explorer}hedera/tokens/${tokenid}`
                    created["Token_ID"] = tokenid
                    created["Name"] = res.name
                    created["Symbol"] = res.symbol
                    created["Type"] = res.token_type == "FUNGIBLE_COMMON" ? "Fungible Token" : res.token_type == "NON_FUNGIBLE_UNIQUE" ?
                    "Non Fungible Token" : null
                    let date = this.toDateTime(Math.round(info.transactions[i].valid_start_timestamp))
                    created["Date"] = date
                    Tokens.push(created)
                }
            }
        Details["acct_id"] = acct_id
        Details["Tokens"] = Tokens
        }
        return Details
    }
}
