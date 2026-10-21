import log from 'loglevel';
import _ from 'lodash';

import { DuplexMessageMetaType } from '../lib/bg_msg/types';
import { secondaryPopup } from './secondary_popup';
import PAGES from '../constants/pages';
import { getStore } from '../store/store';
import { updateCheckConfirmations } from '../store/slices/notification';
import { updateDAppList, UsedDAppItemState } from '../store/slices/dapp_list';
import { redirectPopupToPage, redirectSecondaryPopupToPage } from '../lib/popup';
import { requestAccountsManager } from './request_accounts_manager';
import { getOrigin } from '../lib/bg_msg/util';
import { accountManager } from './account_manager';
import { tronWebManager } from './tronweb_manager';
import { badgeManager } from './badge_manager';
import { getAllDapps } from '../service/local_data_service';
import { secondaryPopupManager } from './secondary_popup_manager';

export enum ChainType {
  MAIN_CHAIN,
  SIDE_CHAIN,
}

export enum ConfirmationType {
  STRING,
  TRANSACTION,
}

export type ConfirmationObj =
  | {
      hostname: string;
      type: ConfirmationType.STRING;
      unSignedTransaction: string;
      input: string;
      multiSign?: boolean;
      permissionId?: number;
      data?: any;
    }
  | {
      hostname: string;
      type: ConfirmationType.TRANSACTION;
      unSignedTransaction: Record<string, any>;
      input: Record<string, any>;
      data?: any;

      chainType: ChainType;
      contractType: string;
      energyUsed: number;
      multiSign?: boolean;
      permissionId?: number;
    };

export interface ConfirmationInfo {
  confirmation: ConfirmationObj;
  uuid: string;
  meta: DuplexMessageMetaType;
}

class SignManager {
  static #instance: SignManager;

  private confirmationInfos: ConfirmationInfo[];

  private constructor() {
    this.confirmationInfos = [];
  }

  public static getInstance(): SignManager {
    if (!SignManager.#instance) {
      SignManager.#instance = new SignManager();
    }

    return SignManager.#instance;
  }

  async queueConfirmation(confirmationInfo: ConfirmationInfo): Promise<void> {
    // if (this.confirmations.length == 0) {
    //   await secondaryPopup.close();
    // }
    this.confirmationInfos.unshift(confirmationInfo);

    if (!requestAccountsManager.existPendingInfos()) {
      await this.openSignSecondaryPopup();
    }
    await badgeManager.updateBadge();
  }

  public async openSignSecondaryPopup() {
    await secondaryPopup.open(`secondary_popup/secondary_popup.html#${PAGES.PAGE_SIGN}`);
    await redirectSecondaryPopupToPage(PAGES.PAGE_SIGN);
    await redirectPopupToPage(PAGES.PAGE_SIGN);
    getStore().dispatch(updateCheckConfirmations());
  }

  getConfirmations(): ConfirmationObj[] {
    return this.confirmationInfos.map((ele) => ele.confirmation);
  }

  existPendingConfirmations(): boolean {
    return this.confirmationInfos.length > 0;
  }

  pendingConfirmationsLength(): number {
    return this.confirmationInfos.length;
  }

  async rejectConfirmationsBy(origin: string) {
    const newInfos = this.confirmationInfos.filter((info) => {
      const currentOrigin = getOrigin(info.meta);
      const isSameOrigin = currentOrigin == origin;
      if (isSameOrigin) {
        info.meta.reject({
          success: false,
          data: 'Confirmation declined by user',
          uuid: info.uuid,
        });
      }
      return !isSameOrigin;
    });
    this.confirmationInfos = newInfos;
  }

  async deleteCurrentConfirmationInfo(info: ConfirmationInfo) {
    const confirmationInfosBefore = this.confirmationInfos.slice();
    this.confirmationInfos = confirmationInfosBefore.filter(
      (item: { uuid: string }) => item.uuid != info!.uuid,
    );

    await secondaryPopupManager.centralControl();
  }

  async deleteAllConfirmationInfo() {
    this.confirmationInfos = [];

    await secondaryPopupManager.centralControl();
  }

  async confirmSignTransaction(confirmationFromPopUp: ConfirmationObj, selectedIndex: number) {
    try {
      const { selectedAccount } = await accountManager.getSelected();
      const accountType = accountManager.getAccountType(selectedAccount);
      if (accountType != 2) {
        await tronWebManager.init();
        const tronWeb = tronWebManager.tronWeb;
        const {
          unSignedTransaction,
          input,
          type,
          multiSign = false,
          permissionId,
        } = confirmationFromPopUp;
        let chainType: ChainType = ChainType.MAIN_CHAIN;
        if (
          !!unSignedTransaction &&
          typeof input !== 'string' &&
          input?.chainType == ChainType.SIDE_CHAIN
        ) {
          chainType = ChainType.SIDE_CHAIN;
        }

        let tronWebInstance;
        if (chainType == ChainType.SIDE_CHAIN) {
          tronWebInstance = tronWeb.sidechain;
        } else {
          tronWebInstance = tronWeb;
        }
        const info: ConfirmationInfo = this.confirmationInfos[selectedIndex];
        if (info) {
          const { confirmation, meta, uuid } = info;
          if (
            (type === ConfirmationType.STRING && confirmation.input === input) ||
            (type === ConfirmationType.TRANSACTION &&
              typeof confirmation.unSignedTransaction !== 'string' &&
              // @ts-ignore
              confirmation?.unSignedTransaction?.txID === unSignedTransaction?.txID)
          ) {
            const signedTransaction = multiSign
              ? await tronWebInstance.trx.multiSign(unSignedTransaction, undefined, permissionId)
              : await tronWebInstance.trx.sign(unSignedTransaction);

            await this.addUsedDapp(confirmation);
            await this.deleteCurrentConfirmationInfo(info);
            meta.resolve({
              success: true,
              data: signedTransaction,
              uuid,
            });
            return signedTransaction;
          }
        }
        log.error('Failed to sign transaction: transaction does not exist');
      }
    } catch (ex) {
      log.error('Failed to sign transaction:', ex);
      return {
        success: false,
        data: 'Invalid transaction provided',
      };
    }
  }

  async rejectSignTransaction(confirmationFromPopUp: ConfirmationObj, selectedIndex: number) {
    try {
      const info: ConfirmationInfo = this.confirmationInfos[selectedIndex];
      const { unSignedTransaction, type } = confirmationFromPopUp;
      if (info) {
        const { confirmation, meta, uuid } = info;
        if (
          (type === ConfirmationType.STRING &&
            _.isEqual(confirmation.unSignedTransaction, unSignedTransaction)) ||
          (type === ConfirmationType.TRANSACTION &&
            typeof confirmation.unSignedTransaction !== 'string' &&
            // @ts-ignore
            confirmation?.unSignedTransaction?.txID === unSignedTransaction?.txID)
        ) {
          await this.deleteCurrentConfirmationInfo(info);
          meta.resolve({
            success: false,
            data: 'Confirmation declined by user',
            uuid,
          });
          return;
        }
      }
    } catch (ex) {
      log.error('Failed to sign transaction:', ex);
      return {
        success: false,
        data: 'Confirmation declined by user',
      };
    }
  }

  async confirmLedgerSignTransaction(selectedIndex: number, signedTransaction: any) {
    try {
      const info: ConfirmationInfo = this.confirmationInfos[selectedIndex];
      if (info) {
        const { meta, uuid, confirmation } = info;
        await this.addUsedDapp(confirmation);
        meta.resolve({
          success: true,
          data: signedTransaction,
          uuid,
        });

        await this.deleteCurrentConfirmationInfo(info);
      }

      return;
    } catch (ex) {
      log.error('Failed to remove transaction:', ex);
    }
  }

  async rejectAllSignTransaction() {
    try {
      const len = this.confirmationInfos.length;
      for (let i = 0; i < len; i++) {
        const info = this.confirmationInfos[i];
        if (info) {
          const { meta } = info;
          meta.resolve({
            success: false,
            data: 'Confirmation declined by user',
          });
        }
      }
      await this.deleteAllConfirmationInfo();
    } catch (ex) {
      log.error('Failed to sign transaction:', ex);
      return {
        success: false,
        data: 'Confirmation declined by user',
      };
    }
  }

  async addUsedDapp(confirmation: ConfirmationObj) {
    try {
      const state = getStore().getState();
      const selectedAddress = state.addressInfo.selectedAddress;

      const { success, data: tronDapps }: { success: boolean; data: UsedDAppItemState[] } =
        await getAllDapps(selectedAddress);

      if (success) {
        const { hostname } = confirmation;
        const regExp = new RegExp(`^${hostname}`);

        const newDapp = tronDapps.find(({ home_url: href }) => {
          const dappHost = _.get(href.split('://'), '[1]');
          if (!dappHost) {
            return false;
          }
          return dappHost.match(regExp);
        });

        if (newDapp) {
          const recommendDappList = state.dappList.recommend;
          const usedDappList = state.dappList.used;

          const index = usedDappList.findIndex((item) => {
            return item.name === newDapp.name;
          });
          if (index !== -1) {
            usedDappList.splice(index, 1);
          }
          usedDappList.unshift(newDapp);

          getStore().dispatch(
            updateDAppList({
              recommend: recommendDappList,
              used: usedDappList,
            }),
          );
        }
      }
    } catch (error) {
      log.info('addUsedDapp error: ', error);
    }
  }
}

export const signManager = SignManager.getInstance();
