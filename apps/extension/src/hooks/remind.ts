import { useEffect, useState } from 'react';

import { useAppSelector } from '../store/hooks';
import { selectSelectedAddress } from '../store/slices/address_info';
import { callGetAccountRemindStatusService } from '../service/get_account_remind_status_service';
import { msgNode } from '../popup/inst';

export const useRemindStatus = () => {
  const selectedAddress = useAppSelector(selectSelectedAddress);

  const [remind, setRemind] = useState<boolean>(false);

  // initial remind
  useEffect(() => {
    (async () => {
      const { remind } = await callGetAccountRemindStatusService(msgNode, {
        address: selectedAddress,
      });
      setRemind(remind);
    })();
  }, [selectedAddress]);

  return {
    remind,
  };
};
