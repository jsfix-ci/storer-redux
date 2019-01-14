import { actionCreators, actionTypes, namespace } from './model-test';

test('actionCreators', () => {
    expect(actionCreators.changeCount()).toEqual({
        type: `${namespace}/changeCount`,
        payload: undefined,
    });
    expect(actionCreators.changeCount(1234)).toEqual({
        type: `${namespace}/changeCount`,
        payload: 1234,
    });
    expect(actionCreators.updateState(1234)).toEqual({
        type: `${namespace}/updateState`,
        payload: 1234,
    });
});
test('actionTypes', () => {
    expect(actionTypes.changeCount).toBe(`${namespace}/changeCount`);
    expect(actionTypes.updateState).toBe(`${namespace}/updateState`);
});
