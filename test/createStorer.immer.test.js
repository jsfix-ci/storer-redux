import { createStorer } from '../src/index';
import { model, namespace } from './model-test-immer';
// import { isFunction, uniqWith, isEqual } from 'lodash';

test('createStorer with immer', () => {
    const storer = createStorer({
        integrateImmer: true,
        model: [model],
        loggerMiddleware: true,
    });
    const state1 = storer.getState();
    expect(state1[namespace].count).toBe(1);
    // state should be readonly!
    expect(
        () => {
            try{
                state1[namespace].count = 4;
            }catch(e){
                throw e
            }
        }
    ).toThrow();
    storer.dispatch({ type: `${namespace}/updateInfoA`, payload: { a: 666 } });
    const state2 = storer.getState();
    expect(state2[namespace].info.a).toBe(666);
    expect(state2[namespace].info !== state1[namespace].info).toBe(true);
    expect(state2[namespace] !== state1[namespace]).toBe(true);
    
});
