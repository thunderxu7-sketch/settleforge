import _ from 'lodash';
import log from 'loglevel';

import { DuplexMessageMetaType } from '../../../lib/bg_msg/types';
import { accountManager } from '../../../domain/account_manager';
import { tronWebManager } from '../../../domain/tronweb_manager';
import { getEnergyUsed, transactionBuilder } from '../../../lib/transactionBuilder';
import { ChainType, ConfirmationType, signManager } from '../../../domain/sign_manager';
import { getHostname } from '../../../lib/bg_msg/message_hub';

export const signTransaction = async (uuid: string, data: any, meta: DuplexMessageMetaType) => {
  if (accountManager.isLocked()) {
    return meta.resolve({
      success: false,
      data: 'User has not unlocked wallet',
      uuid,
    });
  }

  try {
    const { transaction, input } = data;
    const hostname = getHostname(meta.sender);

    await tronWebManager.init();
    const tronWeb = tronWebManager.tronWeb;

    let chainType: ChainType = ChainType.MAIN_CHAIN;
    if (!!transaction && input.chainType == ChainType.SIDE_CHAIN) {
      chainType = ChainType.SIDE_CHAIN;
    }

    let tronWebInstance;
    if (chainType == ChainType.SIDE_CHAIN) {
      tronWebInstance = tronWeb.sidechain;
    } else {
      tronWebInstance = tronWeb;
    }

    // transaction is string
    if (typeof input === 'string') {
      await tronWebInstance.trx.sign(input);
      return signManager.queueConfirmation({
        confirmation: {
          type: ConfirmationType.STRING,
          hostname,
          unSignedTransaction: input,
          input,
        },
        uuid,
        meta,
      });
    }

    // transaction is object
    if (typeof input !== 'string') {
      let visible = _.get(transaction, 'visible');
      if (Object.prototype.toString.call(visible).slice(8, -1) === 'String') {
        visible = visible === 'true';
      }
      input.visible = !!visible;
    }

    const contractType = transaction.raw_data.contract[0].type;
    const { mapped, error } = await transactionBuilder(tronWebInstance, contractType, input);
    // cal fee
    let energyUsed = 0;
    try {
      energyUsed = await getEnergyUsed(tronWebInstance, input);
    } catch (e) {
      log.warn('get energyUsed error:', e);
    }

    if (error) {
      return meta.resolve({
        success: false,
        data: 'Invalid transaction provided',
        uuid,
      });
    }

    let unSignedTransaction = mapped.transaction || mapped;
    if (
      ['TransferContract', 'TriggerSmartContract', 'TransferAssetContract'].indexOf(contractType) !=
        -1 &&
      transaction.raw_data.data
    ) {
      const note = tronWebInstance.toUtf8(transaction.raw_data.data);
      const noteHex = Buffer.from(_.toString(note), 'utf8').toString('hex');
      unSignedTransaction = await tronWebInstance.transactionBuilder.addUpdateData(
        unSignedTransaction,
        noteHex,
        'hex',
      );
    }

    await signManager.queueConfirmation({
      confirmation: {
        chainType,
        type: ConfirmationType.TRANSACTION,
        hostname,
        unSignedTransaction,
        contractType,
        input,
        energyUsed,
        data,
      },
      uuid,
      meta,
    });
  } catch (ex) {
    log.error('Failed to sign transaction:', ex);

    return meta.resolve({
      success: false,
      data: 'Invalid transaction provided',
      uuid,
    });
  }
};

export const multiSignTransaction = async (
  uuid: string,
  data: any,
  meta: DuplexMessageMetaType,
) => {
  if (accountManager.isLocked()) {
    return meta.resolve({
      success: false,
      data: 'User has not unlocked wallet',
      uuid,
    });
  }

  try {
    const { transaction, input, permissionId } = data;
    const hostname = getHostname(meta.sender);

    await tronWebManager.init();
    const tronWeb = tronWebManager.tronWeb;

    let chainType = 0;
    if (!!transaction && input.chainType == 1) {
      chainType = input.chainType;
    }
    const sideChain = Number(chainType) === 1;
    let tronWebInstance;
    if (sideChain) {
      tronWebInstance = tronWeb.sidechain;
    } else {
      tronWebInstance = tronWeb;
    }

    // transaction is string
    if (typeof input === 'string') {
      return signManager.queueConfirmation({
        confirmation: {
          type: ConfirmationType.STRING,
          hostname,
          unSignedTransaction: transaction,
          input,
          multiSign: true,
          permissionId,
        },
        uuid,
        meta,
      });
    }

    if (typeof input !== 'string') {
      let visible = _.get(transaction, 'visible');
      if (Object.prototype.toString.call(visible).slice(8, -1) === 'String') {
        visible = visible === 'true';
      }
      input.visible = !!visible;
    }

    const contractType = transaction.raw_data.contract[0].type;
    const contractAddress = tronWeb.address.fromHex(input.contract_address);

    // cal fee
    let energyUsed = 0;
    try {
      energyUsed = await getEnergyUsed(tronWebInstance, input);
    } catch (e) {
      log.warn('get energyUsed error:', e);
    }
    await signManager.queueConfirmation({
      confirmation: {
        chainType,
        type: ConfirmationType.TRANSACTION,
        hostname,
        unSignedTransaction: transaction,
        contractType,
        input,
        energyUsed,
        multiSign: true,
        permissionId,
        data,
      },
      uuid,
      meta,
    });
  } catch (ex) {
    log.error('Failed to sign transaction:', ex);

    return meta.resolve({
      success: false,
      data: 'Invalid transaction provided',
      uuid,
    });
  }
};
