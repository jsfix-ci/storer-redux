export const loading_name = 'loading';
export const loadingReducer = (state = { effects: {} }, { type, payload }) => {
    if (type === loading_name) {
        let { effects } = payload;
        return {
            ...state,
            effects: { ...state.effects, ...effects },
        };
    }
    return state;
};
