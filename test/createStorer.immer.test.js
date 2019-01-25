import { createStorer,isStatusUninitialized,isStatusSuccess } from '../src/index';
import { model, namespace ,actionCreators,actionTypes} from './model-test-immer';
// import { isFunction, uniqWith, isEqual } from 'lodash';

test('createStorer with immer', () => {
    const storer = createStorer({
        integrateImmer: true,
        model: [model],
        loggerMiddleware: true,
        integrateLoading:true,
        effectStatusWatch:true,
    });
    const state1 = storer.getState();
    expect(state1.loading).toEqual({effects:{}});
    expect(state1._effectStatus).toEqual({});
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
    storer.dispatch(actionCreators.updateInfoA( { a: 666 }));
    const state2 = storer.getState();
    expect(state2[namespace].info.a).toBe(666);
    expect(state2[namespace].info !== state1[namespace].info).toBe(true);
    expect(state2[namespace] !== state1[namespace]).toBe(true);

    // status  loading 
    // before
    expect(isStatusUninitialized(storer.getState(),actionTypes.effectsTest)).toBe(true);
    expect(storer.getState().loading.effects[actionTypes.effectsTest]).toBe(undefined);

    storer.dispatch(actionCreators.effectsTest());
    // after
    expect(isStatusSuccess(storer.getState(),actionTypes.effectsTest)).toBe(true);
    expect(storer.getState().loading.effects[actionTypes.effectsTest]).toBe(false);
    expect(()=>{
        storer.getState().loading.effects[actionTypes.effectsTest]=132412341
    }).toThrow();
    expect(()=>{
        storer.getState()._effectStatus[actionTypes.effectsTest]=132412341
    }).toThrow();
    expect(storer.getState()[namespace].info.a).toBe(666);
});
