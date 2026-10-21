// @ts-ignore
import TronWeb from 'tronweb';
import log from 'loglevel';

import { msgNode } from '../inst';
import { useAppSelector } from '../../store/hooks';
import { selectAddressInfo } from '../../store/slices/address_info';
import { useSelectedNodeInfo } from '../../hooks/selected_node_info';
import { callTronWebService } from '../../service/tronweb_service';

export const useTriggerConstantContract = () => {
  const addressInfo = useAppSelector(selectAddressInfo);
  const selectedAddress = addressInfo?.selectedAddress ?? '';

  const { selectedNodeInfo } = useSelectedNodeInfo();
  const { chain } = selectedNodeInfo;

  const triggerConstantContract = async (
    recipient: string,
    amount: string | number,
    token: string,
    note: string,
    isTrc721: boolean,
  ) => {
    try {
      if (!TronWeb.isAddress(recipient)) {
        return;
      }
      const sideChain = chain !== '_';
      if (String(amount) === 'NaN') {
        amount = 1;
      }
      let res;
      if (isTrc721) {
        res = await callTronWebService(msgNode, {
          method: 'triggerConstantContract',
          sideChain,
          params: [
            TronWeb.address.toHex(token),
            'transferFrom(address,address,uint256)',
            { feeLimit: 50000000 },
            [
              { type: 'address', value: TronWeb.address.toHex(selectedAddress) },
              { type: 'address', value: recipient },
              { type: 'uint256', value: amount || 1 },
            ],
          ],
        });
      } else {
        res = await callTronWebService(msgNode, {
          method: 'triggerConstantContract',
          sideChain,
          params: [
            TronWeb.address.toHex(token),
            'transfer(address,uint256)',
            { feeLimit: 50000000 },
            [
              { type: 'address', value: recipient },
              { type: 'uint256', value: amount || 1 },
            ],
          ],
        });
      }
      return res;
    } catch (error) {
      log.error('triggerConstantContract error: ', error);
      return null;
    }
  };

  return {
    triggerConstantContract,
  };
};
