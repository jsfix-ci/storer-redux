export const namespace = 'modelWithImmer';

export const model = {
    namespace,
    state: {
        count: 1,
        sum: 0,
        info: {
            a: 1,
            b: 2,
        },
        obj: {
            a: 1,
            b: 2,
        },
    },
    reducers: {
        updateInfoA(state, { payload: { a } }) {
            state.info.a = a;
        },
    },
    updateObj(state, { payload }) {
        Object.assign(state.obj, payload);
    },
};
