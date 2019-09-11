import { produce } from 'immer';
export const loading_name = 'loading';
export const ACTION_LOADINGS_REMOVE = 'REMOVE_LOADINGS';
export const loadingReducer = (state = { effects: {} }, { type, payload }) => {
    if (type === loading_name) {
        const { effects } = payload;
        return {
            effects: { ...state.effects, ...effects },
        };
    }
    if (type === ACTION_LOADINGS_REMOVE) {
        const keys = Object.keys(state.effects);
        const keysFiltered = keys.filter((name) => {
            if (name.split('/')[0] === payload.namespace) {
                return false;
            }
            return true;
        });
        const result = { effects: {} };
        keysFiltered.forEach((key) => {
            result.effects[key] = state.effects[key];
        });
        return result;
    }
    return state;
};

export const loadingReducerImmer = produce(
    (draft, { type, payload }) => {
        if (type === loading_name) {
            Object.assign(draft.effects, payload.effects);
        }
        if (type === ACTION_LOADINGS_REMOVE) {
            Object.keys(draft.effects).forEach((key) => {
                if (key.split('/')[0] === payload.namespace) {
                    delete draft.effects[key];
                }
            });
        }
    },
    { effects: {} },
);
