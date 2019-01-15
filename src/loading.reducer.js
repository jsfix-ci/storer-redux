import { produce } from 'immer';
export const loading_name = 'loading';
export const loadingReducer = (state = { effects: {} }, { type, payload }) => {
    if (type === loading_name) {
        let { effects } = payload;
        return {
            effects: { ...state.effects, ...effects },
        };
    }
    return state;
};

export const loadingReducerImmer = produce(
    (draft, { type, payload }) => {
        if (type === loading_name) {
            Object.assign(draft.effects, payload.effects);
        }
    },
    { effects: {} },
);
