export const effectStatus_name = '_effectStatus';

export const status_loading = 'loading';
export const status_fail = 'fail';
export const status_success = 'success';

export const effectStatusReducer = (state = {}, { type, payload }) => {
    if (type === effectStatus_name) {
        return {
            ...state,
            ...payload,
        };
    }
    return state;
};
