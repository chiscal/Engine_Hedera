const { TokenCreateTransaction, PrivateKey, TokenType, TokenSupplyType, CustomFixedFee, CustomFractionalFee, CustomRoyaltyFee, TokenUpdateTransaction, TokenDeleteTransaction, TokenMintTransaction, Hbar, TokenBurnTransaction, TokenFreezeTransaction, TokenUnfreezeTransaction, TokenGrantKycTransaction, TokenRevokeKycTransaction, TokenAssociateTransaction, TokenDissociateTransaction, TokenPauseTransaction, TokenUnpauseTransaction, TokenWipeTransaction, TokenNftInfoQuery, NftId, TokenId, TransferTransaction, HbarUnit } = require("@hashgraph/sdk");
const { Tokens_issued, toDateTime, TokenReturnInfo, network, coin_price } = require("./misc.js")
const { account_info } = require("./Accounts.js")
require("dotenv").config();

const operator = network(false);
const client = operator.client;

async function createFungibleToken(tname, tsymbol, inisupply, decimal, tresacct, treskey, memo="") {
    const create = new TokenCreateTransaction()
    .setTokenName(tname)
    .setTokenSymbol(tsymbol)
    .setTreasuryAccountId(tresacct)
    .setTokenMemo(memo)
    .setInitialSupply(inisupply)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(decimal)

    await create.freezeWith(client).sign(PrivateKey.fromString(treskey))
    
    const Tx_det = await create.execute(client)

    const receipt = await Tx_det.getReceipt(client)
    const tokenid = receipt.tokenId

    return tokenid
}


async function createCustomFungible(acctId, tname, tsymbol, decimal, inisupply, tresacct, treskey, freezekey, wipekey, supplykey, pausekey, adminkey, kyckey, collectorid, tokenAmt, TokenID, HbarAmt, num, denum, min, max, charged, finite, freeze, maxsupply, memo="") {
    let token_deets = {}
    let custom = []
    const ID = await account_info(acctId)
    const price = await coin_price()
    let amt = ID.Hbar_Balance*price
    let cost = parseFloat((10/price).toFixed(2))
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
            }
        }

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
            }
        }
        createcustom.setCustomFees(custom)

        if (kyckey != undefined) {
            createcustom.setKycKey(PrivateKey.fromString(kyckey))
        }

        await (await createcustom.freezeWith(client).sign(PrivateKey.fromString(treskey))).sign(PrivateKey.fromString(adminkey))

        let trans_Action = await transfer.execute(client)
        let trans_deet = await trans_Action.getReceipt(client)
        let status = trans_deet.status.toString()

        const Tx_det = await createcustom.execute(client)
        const receipt = await Tx_det.getReceipt(client)
        const tokenid = receipt.tokenId.toString()

        token_deets["token_ID"] = tokenid
        token_deets["status"] = status
        token_deets["cost"] = cost
    }
    return token_deets
}


async function createNft(acctid, nftname, nftsymbol, tresacct, treskey, supplykey, collectorid, num, denum, fallbackfee, memo="") {
    let ID = await account_info(acctid)
    let price = await coin_price()
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
    if (collectorid != undefined && num != undefined && denum != undefined) {
        if (amt > 55) {
            transfer = new TransferTransaction().addHbarTransfer(acctid, -(new Hbar(cost).toTinybars().toString())).addHbarTransfer("0.0.7858233", new Hbar(cost).toTinybars().toString())
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
    nft.freezeWith(client)
    await nft.sign(PrivateKey.fromString(treskey))

    let trans_Action = await transfer.execute(client)
    let trans_deet = await trans_Action.getReceipt(client)
    let status = trans_deet.status.toString()

    const Tx_det = await nft.execute(client)
    const receipt = await Tx_det.getReceipt(client)
    const tokenid = receipt.tokenId.toString()
    create["nft_id"] = tokenid
    create["status"] = status
    create["cost"] = cost

    return create
}


async function updateToken(tokenid, tname, tsymbol, adminkey, tresacct, treskey, newadmin, kyckey, freezekey, wipekey, supplykey, pausekey, memo="") {
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
        update.setsupplyKey(PrivateKey.fromString(supplykey))
    }
    if (pausekey != undefined) {
        update.setPauseKey(PrivateKey.fromString(pausekey))
    }

    update.freezeWith(client)
    await update.sign(PrivateKey.fromString(adminkey))

    const Tx_det = await update.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function deleteToken(tokenid, adminkey) {
    const delToken = new TokenDeleteTransaction()
    .setTokenId(tokenid)
    .freezeWith(client)
    await delToken.sign(PrivateKey.fromString(adminkey))

    const Tx_det = await  delToken.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function mintToken(tokenid, amount, supplykey) {
    const mint = new TokenMintTransaction()
    .setTokenId(tokenid)
    .setAmount(amount)
    .freezeWith(client)

    await mint.sign(PrivateKey.fromString(supplykey))
    const Tx_det = await mint.execute(client)
    const receipt = await Tx_det.getReceipt(client);

    const status = receipt.status.toString()
    return status
}


async function mintNFT(tokenid, supplykey, file_link) {
    const mint = new TokenMintTransaction()
    .setTokenId(tokenid)
    .setMetadata([Buffer.from(file_link)])
    .freezeWith(client)

    await mint.sign(PrivateKey.fromString(supplykey))
    const Tx_det = await mint.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    let deets = {}
    deets["Token_ID"] = tokenid
    deets["serial"] = receipt.serials[0].low

    return deets
}


async function  burnToken(tokenid, amount, supplykey) {
    const burn = new TokenBurnTransaction()
    .setTokenId(tokenid)
    .setAmount(amount)
    .freezeWith(client)

    await burn.sign(PrivateKey.fromString(supplykey))

    const Tx_det = await burn.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function burnNFT(tokenid , supplykey, serial=1) {
    const burn = new TokenBurnTransaction()
    .setTokenId(tokenid)
    .setSerials([serial])
    .freezeWith(client)

    await burn.sign(PrivateKey.fromString(supplykey))
    const Tx_det = await burn.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function freezeToken(tokenid, accountid, freezekey) {
    const freeze = new TokenFreezeTransaction()
    .setAccountId(accountid)
    .setTokenId(tokenid)
    .freezeWith(client)
    await freeze.sign(PrivateKey.fromString(freezekey))

    const Tx_det = await freeze.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    receipt.status.toString()
}


async function unfreezeToken(tokenid, accountid, freezekey) {
    const unfreeze = new TokenUnfreezeTransaction()
    .setAccountId(accountid)
    .setTokenId(tokenid)
    .freezeWith(client)
    await unfreeze.sign(PrivateKey.fromString(freezekey))

    const Tx_det = await unfreeze.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function EnableKycFlag(tokenid, accountid, kyckey) {
    const enablekyc = new TokenGrantKycTransaction()
    .setAccountId(accountid)
    .setTokenId(tokenid)
    .freezeWith(client)

    await enablekyc.sign(PrivateKey.fromString(kyckey))

    const Tx_det = await enablekyc.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function RevokeKycFlag(tokenid, accountid, kyckey) {
    const revokekyc = new TokenRevokeKycTransaction()
    .setAccountId(accountid)
    .setTokenId(tokenid)
    .freezeWith(client)

    await revokekyc.sign(PrivateKey.fromString(kyckey))

    const Tx_det = await revokekyc.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function AssociateToken(accountid, tokenid, accountkey) {
    const associate = new TokenAssociateTransaction()
    .setAccountId(accountid)
    .setTokenIds([tokenid])
    .freezeWith(client)

    await associate.sign(PrivateKey.fromString(accountkey))

    const Tx_det = await associate.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function DissociateToken(accountid, tokenid, accountkey) {
    const dissociate = new TokenDissociateTransaction()
    .setAccountId(accountid)
    .setTokenIds([tokenid])
    .freezeWith(client)

    await dissociate.sign(PrivateKey.fromString(accountkey))

    const Tx_det = await dissociate.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function PauseToken(tokenid, pausekey) {
    const pause = new TokenPauseTransaction()
    .setTokenId(tokenid)
    .freezeWith(client)

    await pause.sign(PrivateKey.fromString(pausekey))

    const Tx_det = await pause.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function UnPauseToken(tokenid, pausekey) {
    const unpause = new TokenUnpauseTransaction()
    .setTokenId(tokenid)
    .freezeWith(client)

    await unpause.sign(PrivateKey.fromString(pausekey))

    const Tx_det = await unpause.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function WipeToken(tokenid, accountid, amount, accountkey, wipekey) {
    const wipe = new TokenWipeTransaction()
    .setTokenId(tokenid)
    .setAccountId(accountid)
    .setAmount(amount)
    .freezeWith(client)

    await (await wipe.sign(PrivateKey.fromString(accountkey))).sign(PrivateKey.fromString(wipekey))

    const Tx_det = await wipe.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function WipeNFT(tokenid, serial, accountid, accountkey, wipekey) {
    const wipe = new TokenWipeTransaction()
    .setTokenId(tokenid)
    .setAccountId(accountid)
    .setSerials([serial])
    .freezeWith(client)

    await (await wipe.sign(PrivateKey.fromString(accountkey))).sign(PrivateKey.fromString(wipekey))

    const Tx_det = await wipe.execute(client)
    const receipt = await Tx_det.getReceipt(client)

    const status = receipt.status.toString()
    return status
}


async function NfTinfo(nftid, serial=1) {
    const nftInfos = new TokenNftInfoQuery()
    .setNftId(NftId.fromString(`${nftid}@${serial}`))
    
    const info = await nftInfos.execute(client);
    let meta = info[0].metadata.toString()

    return meta
}


async function Created_Tokens(acct_id) {
    const link = operator.link;
    const info = await Tokens_issued(acct_id, link)
    const Details = {}
    const Tokens = []
    for (let i = 0; i < info.transactions.length; i++) {
        const created ={}
        if (info.transactions[i].result == "SUCCESS" && info.transactions[i]["token_transfers"] !== undefined && info.transactions[i]["token_transfers"].length == 1) {
            if (info.transactions[i]["token_transfers"][0]["account"] == acct_id) {
                let tokenid = info.transactions[i]["token_transfers"][0]["token_id"]
                const res = await TokenReturnInfo(tokenid)
                created["URl"] = `https://testnet.dragonglass.me/hedera/tokens/${tokenid}`
                created["Token_ID"] = tokenid
                created["Name"] = res.name
                created["Symbol"] = res.symbol
                created["Type"] = res.token_type == "FUNGIBLE_COMMON" ? "Fungible Token" : res.token_type == "NON_FUNGIBLE_UNIQUE" ?
                "Non Fungible Token" : null
                let date = toDateTime(Math.round(info.transactions[i].valid_start_timestamp))
                created["Date"] = date
                Tokens.push(created)
            }
        }
    Details["acct_id"] = acct_id
    Details["Tokens"] = Tokens
    }
    return Details
}
