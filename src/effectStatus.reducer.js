import { isPlainObject } from 'lodash';
import { produce } from 'immer';
export const effectStatus_name = '_effectStatus';

export const status_loading = 'loading';
export const status_fail = 'fail';
export const status_success = 'success';
export const ACTION_EFFECTS_REMOVE = 'REMOVE_EFFECTS';

export const isStatusSuccess = (state, type) => {
    return (
        isPlainObject(state[effectStatus_name][type]) &&
        state[effectStatus_name][type].status === status_success
    );
};
export const isStatusLoading = (state, type) => {
    return (
        isPlainObject(state[effectStatus_name][type]) &&
        state[effectStatus_name][type].status === status_loading
    );
};
export const isStatusUninitialized = (state, type) => {
    return state[effectStatus_name][type] === undefined;
};
export const isStatusFail = (state, type) => {
    return (
        isPlainObject(state[effectStatus_name][type]) &&
        state[effectStatus_name][type].status === status_fail
    );
};

export const getStatus = (state, type) => {
    return state[effectStatus_name][type] || {};
};

export const effectStatusReducer = (state = {}, { type, payload }) => {
    if (type === effectStatus_name) {
        return {
            ...state,
            ...payload,
        };
    }
    if (type === ACTION_EFFECTS_REMOVE) {
        const keys = Object.keys(state);
        const keysFiltered = keys.filter((name) => {
            if (name.split('/')[0] === payload.namespace) {
                return false;
            }
            return true;
        });
        const result = {};
        keysFiltered.forEach((key) => {
            result[key] = state[key];
        });
        return result;
    }
    return state;
};

export const effectStatusReducerImmer = produce((draft, { type, payload }) => {
    if (type === effectStatus_name) {
        Object.assign(draft, payload);
    }
    if (type === ACTION_EFFECTS_REMOVE) {
        Object.keys(draft).forEach((key) => {
            if (key.split('/')[0] === payload.namespace) {
                delete draft[key];
            }
        });
    }
}, {});
