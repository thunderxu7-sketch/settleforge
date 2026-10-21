import _ from 'lodash';
import log from 'loglevel';
// @ts-ignore
import TronWeb from 'tronweb';

import { msgNode } from '../../../../../inst';
import { callTronWebService } from '../../../../../../service/tronweb_service';
import { useSelectedNodeInfo } from '../../../../../../hooks/selected_node_info';

export const useSendToken = () => {
  const { selectedNodeInfo } = useSelectedNodeInfo();
  const { chain } = selectedNodeInfo;
  const sideChain = chain !== '_';

  const sendTrx = async (toAddress: string, amount: string, note?: string) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const transaction = await callTronWebService(msgNode, {
        method: 'sendTRX',
        sideChain,
        params: [toAddress, amount],
      });

      const transactionWithNote = await callTronWebService(msgNode, {
        method: 'addUpdateData',
        sideChain,
        params: [transaction, noteHex, 'hex'],
      });

      const signedTransaction = await callTronWebService(msgNode, {
        method: 'sign',
        sideChain,
        params: [transactionWithNote],
      });

      await callTronWebService(msgNode, {
        method: 'broadcast',
        sideChain,
        params: [signedTransaction],
      });

      return signedTransaction;
    } catch (ex) {
      log.info('Failed to send TRX:', ex);
      return ex;
    }
  };

  const sendBasicToken = async (
    toAddress: string,
    amount: string,
    tokenId: string,
    note: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const transaction = await callTronWebService(msgNode, {
        method: 'sendToken',
        sideChain,
        params: [toAddress, amount, tokenId],
      });

      const transactionWithNote = await callTronWebService(msgNode, {
        method: 'addUpdateData',
        sideChain,
        params: [transaction, noteHex, 'hex'],
      });

      const signedTransaction = await callTronWebService(msgNode, {
        method: 'sign',
        sideChain,
        params: [transactionWithNote],
      });

      await callTronWebService(msgNode, {
        method: 'broadcast',
        sideChain,
        params: [signedTransaction],
      });

      return signedTransaction;
    } catch (ex) {
      log.info('Failed to send basic token:', ex);
      return ex;
    }
  };

  const sendSmartToken = async (
    toAddress: string,
    amount: string,
    tokenId: string,
    note: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const { transaction } = await callTronWebService(msgNode, {
        method: 'trigger',
        sideChain,
        params: [
          TronWeb.address.toHex(tokenId),
          'transfer(address,uint256)',
          { feeLimit: 50000000 },
          [
            {
              type: 'address',
              value: toAddress,
            },
            { type: 'uint256', value: amount },
          ],
        ],
      });

      const transactionWithNote = await callTronWebService(msgNode, {
        method: 'addUpdateData',
        sideChain,
        params: [transaction, noteHex, 'hex'],
      });

      const signedTransaction = await callTronWebService(msgNode, {
        method: 'sign',
        sideChain,
        params: [transactionWithNote],
      });

      await callTronWebService(msgNode, {
        method: 'broadcast',
        sideChain,
        params: [signedTransaction],
      });

      return signedTransaction;
    } catch (ex) {
      log.info('Failed to send smart token:', ex);
      return ex;
    }
  };

  const sendSmart721Token = async (
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenId: string,
    note: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const { transaction } = await callTronWebService(msgNode, {
        method: 'trigger',
        sideChain,
        params: [
          TronWeb.address.toHex(tokenId),
          'transferFrom(address,address,uint256)',
          { feeLimit: 50000000 },
          [
            { type: 'address', value: TronWeb.address.toHex(fromAddress) },
            { type: 'address', value: toAddress },
            { type: 'uint256', value: amount },
          ],
        ],
      });

      const transactionWithNote = await callTronWebService(msgNode, {
        method: 'addUpdateData',
        sideChain,
        params: [transaction, noteHex, 'hex'],
      });

      const signedTransaction = await callTronWebService(msgNode, {
        method: 'sign',
        sideChain,
        params: [transactionWithNote],
      });

      await callTronWebService(msgNode, {
        method: 'broadcast',
        sideChain,
        params: [signedTransaction],
      });

      return signedTransaction;
    } catch (ex) {
      log.info('Failed to sendSmart721Token:', ex);
      return ex;
    }
  };

  return { sendTrx, sendBasicToken, sendSmartToken, sendSmart721Token };
};
