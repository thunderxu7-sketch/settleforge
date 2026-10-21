import { DuplexMessage, MessageHub, MessageNode } from '../lib/bg_msg';
import type { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { tronWebManager } from '../domain/tronweb_manager';
import log from 'loglevel';

interface Params {
  method: string;
  sideChain: boolean;
  params: any;
}

const TRON_WEB_ACTION_NAME = 'TRON_WEB';

export const callTronWebService = async (msgNode: MessageNode, data: Params) => {
  const res = await msgNode.send(new DuplexMessage(TRON_WEB_ACTION_NAME, data));
  return res;
};

export const registerTronWebService = (messageHub: MessageHub) => {
  messageHub.registerSourceActionName('popup', TRON_WEB_ACTION_NAME);

  messageHub.on(TRON_WEB_ACTION_NAME, async (data: Params, meta: DuplexMessageMetaType) => {
    const { method, sideChain, params } = data;
    try {
      await tronWebManager.init();

      let result = '';
      if (sideChain) {
        if (method === 'sign') {
          result = await tronWebManager.tronWeb.sidechain.trx.sign(...params);
        } else if (method === 'trigger') {
          result = await tronWebManager.tronWeb.sidechain.transactionBuilder.triggerSmartContract(
            ...params,
          );
        } else if (method === 'broadcast') {
          result = await tronWebManager.tronWeb.sidechain.trx.sendRawTransaction(...params);
        } else if (method === 'sendTRX') {
          result = await tronWebManager.tronWeb.sidechain.transactionBuilder.sendTrx(...params);
        } else if (method === 'sendToken') {
          result = await tronWebManager.tronWeb.sidechain.transactionBuilder.sendToken(...params);
        } else if (method === 'addUpdateData') {
          result = await tronWebManager.tronWeb.sidechain.transactionBuilder.addUpdateData(
            ...params,
          );
        } else if (method === 'triggerConstantContract') {
          result =
            await tronWebManager.tronWeb.sidechain.transactionBuilder.triggerConstantContract(
              ...params,
            );
        }
      } else {
        if (method === 'sign') {
          result = await tronWebManager.tronWeb.trx.sign(...params);
        } else if (method === 'trigger') {
          result = await tronWebManager.tronWeb.transactionBuilder.triggerSmartContract(...params);
        } else if (method === 'broadcast') {
          result = await tronWebManager.tronWeb.trx.sendRawTransaction(...params);
        } else if (method === 'sendTRX') {
          result = await tronWebManager.tronWeb.transactionBuilder.sendTrx(...params);
        } else if (method === 'sendToken') {
          result = await tronWebManager.tronWeb.transactionBuilder.sendToken(...params);
        } else if (method === 'addUpdateData') {
          result = await tronWebManager.tronWeb.transactionBuilder.addUpdateData(...params);
        } else if (method === 'triggerConstantContract') {
          result = await tronWebManager.tronWeb.transactionBuilder.triggerConstantContract(
            ...params,
          );
        }
      }

      if (result) {
        meta.resolve(result);
      } else {
        meta.reject({
          message: 'ERROR',
        });
      }
    } catch (error) {
      log.error('registerSourceActionName error: ', method, params, error);
      meta.reject({
        message: 'ERROR',
      });
    }
  });
};
