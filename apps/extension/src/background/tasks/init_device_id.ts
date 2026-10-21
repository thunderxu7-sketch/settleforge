import { v4 as uuidV4 } from 'uuid';

import { chromeStorage } from '../../lib/storage';
import { updateDeviceID } from '../../store/slices/settings';
import { getStore } from '../../store/store';

export async function initDeviceId() {
  // check deviceID in before storage
  const store = getStore();
  if (!store.getState().settings.deviceID) {
    const oldDeviceID = await chromeStorage.getItem<string>('data_deviceID');

    if (oldDeviceID) {
      store.dispatch(updateDeviceID(oldDeviceID));
    } else {
      const newDeviceID = uuidV4();
      store.dispatch(updateDeviceID(newDeviceID));
    }
  }
}
