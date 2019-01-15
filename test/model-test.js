import { getActionCreatorsAndTypes } from '../src/index';
export const namespace = 'model1';

function asyncFn(n) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(n), 100);
    });
}

function mockAsyncError(error) {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(error), 100);
    });
}

export const model1 = {
    namespace,
    state: {
        count: 1,
        sum: 0,
        name: 'rose',
    },
    effects: {
        *changeCount({ payload: { count } }, { put, call, select }) {
            const c = yield call(asyncFn, count);
            yield put({
                type: 'updateState',
                payload: {
                    count: c,
                },
            });
        },
        *throwError({ payload: { error } }) {
            yield 1;
            throw new Error(error);
        },
        *throwError2({ payload: { error } }, { call }) {
            yield call(mockAsyncError, error);
        },

        *dispachAction({ payload: { value } }, { put }) {
            yield put({
                type: 'updateState',
                payload: { dispachAction: value },
            });
        },
        *dispachActionWithCompleteType(action, { put }) {
            yield put({
                type: namespace+'/updateState',
                payload: { dispachActionWithCompleteTypeSuccess: true },
            });
        },
        takeLatest: [
            function*(action, { put }) {
                yield put({
                    type: 'updateState',
                    payload: { takeLatestSuccess: true },
                });
            },
            { type: 'takeLatest' },
        ],
        throttle: [
            function*(action, { put }) {
                yield put({
                    type: 'updateState',
                    payload: { throttleSuccess: true },
                });
            },
            { type: 'throttle' },
        ],
    },
    reducers: {
        updateState(state, { payload }) {
            return { ...state, ...payload };
        },
    },
};

export const { actionCreators, actionTypes } = getActionCreatorsAndTypes(
    model1,
);
