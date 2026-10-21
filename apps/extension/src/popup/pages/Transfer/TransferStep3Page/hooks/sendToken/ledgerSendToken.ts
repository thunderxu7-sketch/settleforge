import _ from 'lodash';
import log from 'loglevel';

import { useTronWebInstance } from '../../../../../../hooks/tronweb_popup';
import { ledgerSign } from '../../../../../../lib/ledger/ledger_sign';

export const useLedgerSendToken = (selectedAddress: string) => {
  const { tronWebInstance } = useTronWebInstance();

  const ledgerSendTrx = async (
    toAddress: string,
    amount: string,
    accountIndex: number,
    addressIndex: number,
    note?: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const transaction = await tronWebInstance.transactionBuilder.sendTrx(
        toAddress,
        amount,
        selectedAddress,
      );

      const transactionWithNote = await tronWebInstance.transactionBuilder.addUpdateData(
        transaction,
        noteHex,
        'hex',
      );

      const signedTransaction = (await ledgerSign(
        transactionWithNote,
        accountIndex,
        addressIndex,
        tronWebInstance,
      )) as any;

      await tronWebInstance.trx.sendRawTransaction(signedTransaction);

      return {
        success: true,
        signedTransaction,
      };
    } catch (error) {
      log.info('Failed to send TRX:', error);
      return {
        success: false,
        error,
      };
    }
  };

  const ledgerSendBasicToken = async (
    toAddress: string,
    amount: string,
    tokenId: string,
    accountIndex: number,
    addressIndex: number,
    note: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      const transaction = await tronWebInstance.transactionBuilder.sendToken(
        toAddress,
        amount,
        tokenId,
        selectedAddress,
      );

      const transactionWithNote = await tronWebInstance.transactionBuilder.addUpdateData(
        transaction,
        noteHex,
        'hex',
      );

      const signedTransaction = (await ledgerSign(
        transactionWithNote,
        accountIndex,
        addressIndex,
        tronWebInstance,
      )) as any;

      await tronWebInstance.trx.sendRawTransaction(signedTransaction);

      return {
        success: true,
        signedTransaction,
      };
    } catch (error) {
      log.info('Failed to send basic token:', error);
      return {
        success: false,
        error,
      };
    }
  };

  const ledgerSendSmartToken = async (
    toAddress: string,
    amount: string,
    tokenId: string,
    accountIndex: number,
    addressIndex: number,
    note: string,
  ) => {
    const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
    try {
      const { transaction } = await tronWebInstance.transactionBuilder.triggerSmartContract(
        tronWebInstance.address.toHex(tokenId),
        'transferFrom(address,address,uint256)',
        40000000,
        0,
        [
          { type: 'address', value: tronWebInstance.address.toHex(selectedAddress) },
          { type: 'address', value: tronWebInstance.address.toHex(toAddress) },
          { type: 'uint256', value: amount },
        ],
        tronWebInstance.address.toHex(selectedAddress),
      );

      const transactionWithNote = await tronWebInstance.transactionBuilder.addUpdateData(
        transaction,
        noteHex,
        'hex',
      );

      const signedTransaction = (await ledgerSign(
        transactionWithNote,
        accountIndex,
        addressIndex,
        tronWebInstance,
      )) as any;

      await tronWebInstance.trx.sendRawTransaction(signedTransaction);

      return {
        success: true,
        signedTransaction,
      };
    } catch (error) {
      log.info('Failed to send smart token:', error);
      return {
        success: false,
        error,
      };
    }
  };

  const ledgerSendSmart721Token = async (
    toAddress: string,
    amount: string,
    tokenId: string,
    accountIndex: number,
    addressIndex: number,
    note: string,
  ) => {
    try {
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');

      const { transaction } = await tronWebInstance.transactionBuilder.triggerSmartContract(
        tronWebInstance.address.toHex(tokenId),
        'transferFrom(address,address,uint256)',
        40000000,
        0,
        [
          { type: 'address', value: tronWebInstance.address.toHex(selectedAddress) },
          { type: 'address', value: tronWebInstance.address.toHex(toAddress) },
          { type: 'uint256', value: amount },
        ],
        tronWebInstance.address.toHex(selectedAddress),
      );

      const transactionWithNote = await tronWebInstance.transactionBuilder.addUpdateData(
        transaction,
        noteHex,
        'hex',
      );

      const signedTransaction = (await ledgerSign(
        transactionWithNote,
        accountIndex,
        addressIndex,
        tronWebInstance,
      )) as any;

      await tronWebInstance.trx.sendRawTransaction(signedTransaction);

      return {
        success: true,
        signedTransaction,
      };
    } catch (error) {
      log.info('Failed to sendSmart721Token:', error);
      return {
        success: false,
        error,
      };
    }
  };

  return { ledgerSendTrx, ledgerSendBasicToken, ledgerSendSmartToken, ledgerSendSmart721Token };
};
