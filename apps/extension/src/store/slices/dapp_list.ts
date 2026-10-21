import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface RecommendDAppItemState {
  id: string;
  name: string;
  desc: string;
  href: string;
  icon: string;
  img: string;
  isWhiteList: string;
  isAuthorize: string;
  isHorizontal: string;
  isPlugHot: string;
}

export interface UsedDAppItemState {
  id: string;
  name: string;
  classifyId: number;
  home_url: string;
  horiz_vert: number;
  image_url: string;
  is_anonymous: number;
  is_roll: number;
  is_white: number;
  slogan: string;
}

export interface DAppListState {
  recommend: RecommendDAppItemState[];
  used: UsedDAppItemState[];
}

const initialState: DAppListState = {
  recommend: [],
  used: [],
};

export const dappListSlice = createSlice({
  name: 'dappList',
  initialState,
  reducers: {
    updateDAppList: (state, action: PayloadAction<DAppListState>) => {
      const { recommend, used } = action.payload;
      // used list max length 5
      state.recommend = recommend;
      state.used = used.slice(0, 5);
    },
    deleteDAppItem: (state, action: PayloadAction<string>) => {
      const name = action.payload;
      const newUsed = state.used.filter((item) => item.name !== name);
      state.used = newUsed;
    },
  },
});

export const { updateDAppList, deleteDAppItem } = dappListSlice.actions;

export const selectDAppList = (state: RootState) => state.dappList;

export default dappListSlice.reducer;
