import _ from 'lodash';
import log from 'loglevel';

import { LedgerWebHid } from '../webhid';

import tokenList, { TokenItem } from './tokens';
import exchangeList, { ExchangeItem } from './exchanges';

export const ledgerSign = async (
  transaction: any,
  accountIndex = 0,
  addressIndex = 0,
  tronWebChainInstance: any,
) => {
  const ledgerWebHid = new LedgerWebHid();
  try {
    if (typeof transaction === 'string') {
      return await ledgerWebHid.signPersonalMessage(
        transaction,
        getPath(accountIndex, addressIndex),
      );
    }

    const transactionObj = transaction;

    let raw = transactionObj.raw_data;

    const contractObj = raw.contract[0];

    let contractType = contractObj.type;

    let tokenInfo = [];

    let extra: any = {};

    switch (contractType) {
      case 1: //Transfer
        if (transaction.raw_data.data) {
          extra.note = transaction.raw_data.data;
        }
        break;
      case 2: // Transfer Assets
        const ID = tronWebChainInstance.toUtf8(
          transaction.raw_data.contract[0].parameter.value.asset_name,
        );
        // get token info
        extra = await getTokenExtraInfo(
          transaction.raw_data.contract[0].parameter.value.asset_name,
          tronWebChainInstance,
        );
        if (transaction.raw_data.data) {
          extra.note = transaction.raw_data.data;
        }
        let tokenObj = await getLedgerTokenInfo(ID);
        if (tokenObj.message) {
          tokenInfo.push(tokenObj.message);
        }
        break;
      case 5: //Create Witness
        extra = transaction.extra || {};
        break;
      case 16: //Create Proposal
        extra = transaction.extra || {};
        break;
      case 17: //Approve Proposal
        extra = transaction.extra || {};
        break;
      case 18: //Delete Proposal
        extra = transaction.extra || {};
        break;
      case 41: //ExchangeCreateContract
        const token1 = await getTokenExtraInfo(
          transaction.raw_data.contract[0].parameter.value.first_token_id,
          tronWebChainInstance,
        );
        const token2 = await getTokenExtraInfo(
          transaction.raw_data.contract[0].parameter.value.second_token_id,
          tronWebChainInstance,
        );
        if (token1 !== undefined && token2 !== undefined) {
          extra = {
            token1: token1.token_name,
            decimals1: token1.decimals,
            token2: token2.token_name,
            decimals2: token2.decimals,
          };
          if (token1.id !== 0) tokenInfo.push(getLedgerTokenInfo(token1.id).message);
          if (token2.id !== 0) tokenInfo.push(getLedgerTokenInfo(token2.id).message);
        }
        break;
      case 42: //ExchangeInjectContract
        const exchangeDepositID = transaction.raw_data.contract[0].parameter.value.exchange_id;
        const exchangeDeposit = getLedgerExchangeInfo(exchangeDepositID);
        const exchangeDepositToken = getLedgerTokenInfo(
          tronWebChainInstance.toUtf8(transaction.raw_data.contract[0].parameter.value.token_id),
        );
        // get exchange info
        extra = {
          pair: exchangeDeposit.pair,
        };
        if (exchangeDepositToken.id !== 0) tokenInfo.push(exchangeDepositToken.message);
        break;
      case 43: //ExchangeWithdrawContract
        const exchangeWithdrawID = transaction.raw_data.contract[0].parameter.value.exchange_id;
        const exchangeWithdraw = getLedgerExchangeInfo(exchangeWithdrawID);
        const exchangeWithdrawToken = getLedgerTokenInfo(
          tronWebChainInstance.toUtf8(transaction.raw_data.contract[0].parameter.value.token_id),
        );
        // get exchange info
        extra = {
          pair: exchangeWithdraw.pair,
        };
        if (exchangeWithdrawToken.id !== 0) tokenInfo.push(exchangeWithdrawToken.message);
        break;
      case 44: //ExchangeTransactionContract
        const exchangeID = transaction.raw_data.contract[0].parameter.value.exchange_id;
        const exchange = getLedgerExchangeInfo(exchangeID);
        // get exchange info
        extra = {
          pair: exchange.pair,
          decimals1: exchange.decimals1,
          decimals2: exchange.decimals2,
          action:
            transaction.raw_data.contract[0].parameter.value.token_id === exchange.firstToken
              ? 'Sell'
              : 'Buy',
        };
        tokenInfo.push(exchange.message);
        break;

      case 31: //Trigger Smart Contract
        extra = transaction.extra || {};
        break;
      case 46:
        extra = transaction.extra || {};
        break;
    }

    extra.hash = transaction.txID;
    const signedResponse = await ledgerWebHid.signTransaction(
      {
        // hex: transaction.raw_data_hex || rawDataHex,
        hex: transaction.raw_data_hex,
        info: tokenInfo,
      },
      getPath(accountIndex, addressIndex),
    );
    // transaction.signature = [signedResponse];
    if (Array.isArray(transaction.signature)) {
      if (!transaction.signature.includes(signedResponse))
        transaction.signature.push(signedResponse);
    } else {
      transaction.signature = [signedResponse];
    }
    return transaction;
  } catch (error: any) {
    log.error('error:', error.message);
    if (/Too many bytes to encode/.test(error.message)) {
      try {
        const signedResponse = await ledgerWebHid.signTransactionHash(
          getPath(accountIndex, addressIndex),
          transaction.txID,
        );

        if (Array.isArray(transaction.signature)) {
          if (!transaction.signature.includes(signedResponse))
            transaction.signature.push(signedResponse);
        } else {
          transaction.signature = [signedResponse];
        }
        return transaction;
      } catch (e: any) {
        log.error('e :', e);

        throw e.message;
      }
    } else {
      throw error.message;
    }
  }
};

const getTokenExtraInfo = async (ID: any, tronWebChainInstance: any) => {
  let tokenID = ID;
  if (typeof tokenID != 'number') {
    tokenID = tronWebChainInstance.toUtf8(tokenID);
    if (tokenID === '') return { id: 0, decimals: 6, token_name: 'TRX' };
    else tokenID = parseInt(tokenID);
  }
  const { id, precision, name } = await tronWebChainInstance.trx.getTokenByID(tokenID);
  return { id, decimals: precision, token_name: name };
};

const getLedgerTokenInfo = (ID: any): TokenItem => {
  let tokenID = ID;
  if (typeof tokenID != 'number') {
    if (tokenID === '') tokenID = 0;
    else tokenID = parseInt(tokenID);
  }
  return (
    tokenList.find((o: any) => o.id === tokenID) ?? {
      id: 0,
      message: '',
    }
  );
};

const getLedgerExchangeInfo = (ID: any): ExchangeItem => {
  let exchangeID = ID;
  if (typeof exchangeID !== 'number') {
    exchangeID = parseInt(exchangeID);
  }
  return (
    exchangeList.find((o: any) => o.id === exchangeID) ?? {
      id: 0,
      message: '',
      firstToken: '',
      pair: '',
      decimals1: 0,
      decimals2: 0,
    }
  );
};

function getPath(index = 0, addressIndex = 0) {
  return "44'/195'/" + index + "'/0/" + addressIndex;
}
