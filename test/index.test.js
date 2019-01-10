import { createStorer } from '../src/index';
import { model1, namespace as model1Namespace } from './model-test';
import { createStore } from 'redux';
import { isFunction } from 'lodash';

let err = null,
    errorCount = 0;

const appDemo = createStorer({
    integrateLoading:true,
    onError: (error) => {
        (err = error), errorCount++;
    },
});

const getType = (s) => Object.prototype.toString.call(s);

test('Methods check', () => {
    const store = createStore((state = {}) => state);

    for (let each in store) {
        if (each !== 'replaceReducer') {
            // console.log(each)
            expect(getType(store[each]) === getType(appDemo[each])).toBe(true);
        }
    }
    expect(isFunction(appDemo.addModel)).toBe(true);
});

appDemo.addModel(model1);

test('Get initial state', () => {
    const state = appDemo.getState();
    expect(state[model1Namespace].count).toBe(1);
});

test('Dispatch action(effects)', (done) => {
    appDemo.dispatch({
        type: model1Namespace + '/changeCount',
        payload: {
            count: 3,
        },
    });
    // loading
    expect(
        appDemo.getState().loading.effects[`${model1Namespace}/changeCount`],
    ).toBe(true);
    expect(appDemo.getState()[model1Namespace].count).toBe(1);
    setTimeout(() => {
        expect(appDemo.getState()[model1Namespace].count).toBe(3);
        expect(
            appDemo.getState().loading.effects[
                `${model1Namespace}/changeCount`
            ],
        ).toBe(false);
        done();
    }, 101);
});

test('dispatch action(reducer)', () => {
    appDemo.dispatch({
        type: model1Namespace + '/updateState',
        payload: {
            sum: 9,
        },
    });
    expect(appDemo.getState()[model1Namespace].sum).toBe(9);
});

test('onError', () => {
    appDemo.dispatch({
        type: model1Namespace + '/throwError',
        payload: {
            error: 'error1',
        },
    });
    expect(err.message).toBe('error1');
});

test('onError (async)', (done) => {
    appDemo.dispatch({
        type: model1Namespace + '/throwError2',
        payload: {
            error: 'error2',
        },
    });
    setTimeout(() => {
        expect(err.message).toBe('error2');
        done();
    }, 101);
});

test('CreateStorer with initialState and model ', () => {
    const app = createStorer({
        initialState: {
            [model1Namespace]: {
                name: 'jack',
            },
        },
        model: [model1],
    });

    expect(app.getState()[model1Namespace].name).toBe('jack');
    expect(app.getState()[model1Namespace].count).toBe(1);
});
