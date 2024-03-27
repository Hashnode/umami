import { createSlice } from '@reduxjs/toolkit';

const websites = createSlice({
  name: 'websites',
  initialState: {},
  reducers: {
    updateWebsites(state, action) {
      state = action.payload;
      return state;
    },
    updateWebsite(state, action) {
      const { publicationId, ...data } = action.payload;
      state[publicationId] = data;
      return state;
    },
  },
});

export const { updateWebsites, updateWebsite } = websites.actions;

export default websites.reducer;

export function setDateRange(publicationId, dateRange) {
  return dispatch => {
    return dispatch(
      updateWebsite({ publicationId, dateRange: { ...dateRange, modified: Date.now() } }),
    );
  };
}
