import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface NotificationState {
  checkAuthed: number;
  checkRedirect: number;
  checkSecondaryPopupRedirect: number;
  checkPendingInfos: number;
  checkConfirmations: number;
  checkWatchAsset: number;
  checkLedgerImportLoading: number;
}

const initialState: NotificationState = {
  checkAuthed: 0,
  checkRedirect: 0,
  checkSecondaryPopupRedirect: 0,
  checkPendingInfos: 0,
  checkConfirmations: 0,
  checkWatchAsset: 0,
  checkLedgerImportLoading: 0,
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    updateCheckAuthed: (state) => {
      state.checkAuthed = Date.now();
    },
    updateCheckRedirect: (state) => {
      state.checkRedirect = Date.now();
    },
    updateCheckSecondaryPopupRedirect: (state) => {
      state.checkSecondaryPopupRedirect = Date.now();
    },
    updateCheckPendingInfos: (state) => {
      state.checkPendingInfos = Date.now();
    },
    updateCheckConfirmations: (state) => {
      state.checkConfirmations = Date.now();
    },
    updateCheckWatchAsset: (state) => {
      state.checkWatchAsset = Date.now();
    },
    updateCheckLedgerImportLoading: (state) => {
      state.checkLedgerImportLoading = Date.now();
    },
  },
});

export const {
  updateCheckAuthed,
  updateCheckRedirect,
  updateCheckSecondaryPopupRedirect,
  updateCheckPendingInfos,
  updateCheckConfirmations,
  updateCheckWatchAsset,
  updateCheckLedgerImportLoading,
} = notificationSlice.actions;

export const selectCheckAuthed = (state: RootState) => state.notification.checkAuthed;
export const selectCheckRedirect = (state: RootState) => state.notification.checkRedirect;
export const selectCheckSecondaryPopupRedirect = (state: RootState) =>
  state.notification.checkSecondaryPopupRedirect;
export const selectCheckPendingInfos = (state: RootState) => state.notification.checkPendingInfos;
export const selectCheckConfirmations = (state: RootState) => state.notification.checkConfirmations;
export const selectCheckWatchAsset = (state: RootState) => state.notification.checkWatchAsset;
export const selectCheckLedgerImportLoading = (state: RootState) => state.notification.checkLedgerImportLoading;

export default notificationSlice.reducer;
