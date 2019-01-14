import { isPlainObject } from 'lodash';
export const effectStatus_name = '_effectStatus';

export const status_loading = 'loading';
export const status_fail = 'fail';
export const status_success = 'success';

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

export const effectStatusReducer = (state = {}, { type, payload }) => {
    if (type === effectStatus_name) {
        return {
            ...state,
            ...payload,
        };
    }
    return state;
};
