export const loadingReducer = (state = { effects: {} }, { type, payload }) => {
    if (type === 'loading') {
        let { effects } = payload;
        return {
            ...state,
            effects: { ...state.effects, ...effects },
        };
    }
    return state;
};
