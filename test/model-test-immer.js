import { getActionCreatorsAndTypes } from '../src/index';
import asyncFn from '../utils/asyncFn.js';
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
    effects: {
        *effectsTest() {
            // do nothing
        },
        *changeCount({ payload: { count } }, { put, call }) {
            const c = yield call(asyncFn, count);
            // yield put({
            //     type: 'updateState',
            //     payload: {
            //         count: c,
            //     },
            // });
        },
    },
    reducers: {
        updateInfoA(state, { payload: { a } }) {
            state.info.a = a;
        },
        // updateState(state, { payload }) {
        //     Object.assign(state, payload);
        // },
    },
};

export const { actionCreators, actionTypes } = getActionCreatorsAndTypes(model);
