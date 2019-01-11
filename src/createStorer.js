import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { isFunction, isPlainObject, isString, extend, isArray } from 'lodash';
import { loadingReducer, loading_name } from './loading.reducer';
import {
    effectStatusReducer,
    effectStatus_name,
    status_fail,
    status_loading,
    status_success,
} from './effectStatus.reducer';
import { logger } from './logger';
const { takeEvery, takeLatest, throttle } = sagaEffects;

export function createStorer(config = {}) {
    const { reducers, ...rest } = config;

    const _config = {
        initialState: {},
        onError: () => void 0,
        extraEnhancers: [],
        model: [],
        integrateLoading: false,
        effectStatusWatch: false,
        separator: '/',
        loggerMiddleware: false,
        ...rest,
    };

    const app = {
        reducers: { ...reducers },
        sagaMiddleware: createSagaMiddleware(),
        namespace: [],
        config: _config,
    };
    //integrate loading
    if (app.config.integrateLoading) {
        app.reducers.loading = loadingReducer;
        app.namespace.push(loading_name);
    }

    if (app.config.effectStatusWatch) {
        app.reducers[effectStatus_name] = effectStatusReducer;
        app.namespace.push(effectStatus_name);
    }

    function addModel(model) {
        _addModel(app, model);
    }

    init(app);

    if (isArray(_config.model)) {
        _config.model.forEach((model) => {
            addModel(model);
        });
    }
    // eslint-disable-next-line
    const { replaceReducer, ...other } = app.store;
    return {
        addModel,
        ...other,
    };
}

// helper

/**
 *app init :createStore & rewrite handleError
 * @param app
 */
function init(app) {
    const reducer = getCombinedReducer(app),
        enhancers = getEnhancers(app);
    app.store = createStore(reducer, compose(...enhancers));
    app.handleError = function(desc) {
        const { onError } = app.config;
        if (isString(desc)) {
            onError(new Error(desc));
        } else {
            onError(desc);
        }
    };
}

/**
 * add model to app
 *
 * @param app
 * @param config
 * @param model
 * @private
 */
function _addModel(app, model) {
    assert(isPlainObject(model), 'model should be a object');
    assert(
        isString(model.namespace),
        `namespace should be string but got ${typeof namespace}`,
    );
    assert(
        app.namespace.indexOf(model.namespace) < 0,
        `The model(${model.namespace}) is already in use`,
    );
    assert(
        isPlainObject(model.reducers),
        `The reducers of model(${model.namespace}) should be object`,
    );
    assert(
        isPlainObject(model.state),
        `The state of model(${model.namespace}) should be object`,
    );

    const _model = extend(
        {
            effects: {},
            state: {},
        },
        model,
    );

    app.namespace.push(_model.namespace);

    //create reducer and replace reducer
    const _reducer = wrapReducers(app, _model);
    app.reducers = extend({}, app.reducers, { [_model.namespace]: _reducer });
    app.store.replaceReducer(getCombinedReducer(app));

    //create saga
    if (isPlainObject(_model.effects)) {
        app.sagaMiddleware.run(createSaga(app, _model));
    }
}

/**
 * getCombinedReducer
 * @param app
 * @returns {*}
 */
function getCombinedReducer(app) {
    if (app.reducers) {
        return combineReducers(app.reducers);
    } else {
        return (state = {}) => state;
    }
}

/**
 * getEnhancers
 * @param app
 * @param config
 * @returns {Array.<*>}
 */
function getEnhancers(app) {
    const { extraEnhancers } = app.config,
        { sagaMiddleware } = app,
        devtools = [];

    if (process.env.NODE_ENV !== 'production') {
        try {
            if (
                isWindow(window) &&
                isFunction(window.__REDUX_DEVTOOLS_EXTENSION__)
            ) {
                devtools.push(window.__REDUX_DEVTOOLS_EXTENSION__());
            } else if (app.config.loggerMiddleware) {
                devtools.push(applyMiddleware(logger));
            }
        } catch (e) {
            //Ignore the error: 'window is not defined'
        }
    }
    //__REDUX_DEVTOOLS_EXTENSION__ will change the actions that created by sagamiddleware ,so i put it to the end
    return [applyMiddleware(sagaMiddleware), ...extraEnhancers].concat(
        devtools,
    );
}

/**
 * wrapReducers
 * @param app
 * @param model
 * @returns {Function}
 */
function wrapReducers(app, model) {
    const {
        config: { initialState, separator },
    } = app;
    const { namespace, reducers } = model;
    const _initialState = extend(
        model.state,
        isPlainObject(initialState) ? initialState[namespace] : {},
    );
    return function(state = _initialState, { type, ...other }) {
        const names = type.split(separator);
        let newState = state;
        if (
            names.length === 2 &&
            namespace === names[0] &&
            isFunction(reducers[names[1]])
        ) {
            newState = reducers[names[1]](state, other) || state;
        }
        return newState;
    };
}

/**
 * createSaga
 * @param app
 * @param model
 * @returns {Function}
 */
function createSaga(app, model) {
    const { namespace, effects } = model;

    return function*() {
        let keys = Object.keys(effects);
        for (let key of keys) {
            yield sagaEffects.fork(
                createWatcher(namespace, key, effects[key], app),
            );
        }
    };
}

/**
 * wrapPutFn
 * @param namespace
 * @returns {{put: put}}
 */
function wrapPutFn(namespace, separator) {
    return function put(action) {
        if (isPlainObject(action)) {
            //no prefix only when action.prefix === false
            if (action.prefix === false) return sagaEffects.put(action);

            let { type } = action;
            if (isString(type)) {
                if (type.indexOf(separator) > 0) {
                    return sagaEffects.put(action);
                } else {
                    action.type = `${namespace}${separator}${type}`;
                    return sagaEffects.put(action);
                }
            } else {
                throw new Error(`action's type is not string!`);
            }
        } else {
            throw new Error('action is not a plain object!');
        }
    };
}

/**
 * createWatcher
 * @param namespace
 * @param key
 * @param effect
 * @param app
 * @returns {Function}
 */
function createWatcher(namespace, key, effect, app) {
    let type = 'takeEvery',
        time,
        fn;
    const {
        handleError,
        config: { integrateLoading, separator, effectStatusWatch },
    } = app;
    const actionType = namespace + separator + key;

    if (isFunction(effect)) {
        fn = effect;
    } else if (isArray(effect)) {
        fn = effect[0];
        type = effect[1].type || 'takeEvery';
        time = effect[1].time || 0;
    }

    const wrapper = function*(action) {
        let err;
        try {
            if (integrateLoading) {
                yield sagaEffects.put({
                    type: loading_name,
                    payload: {
                        effects: { [actionType]: true },
                    },
                });
            }

            if (effectStatusWatch) {
                yield sagaEffects.put({
                    type: effectStatus_name,
                    payload: {
                        [actionType]: {
                            status: status_loading,
                        },
                    },
                });
            }

            yield fn(action, {
                ...sagaEffects,
                put: wrapPutFn(namespace, separator),
            });
        } catch (e) {
            err = e;
        }
        if (integrateLoading) {
            yield sagaEffects.put({
                type: loading_name,
                payload: {
                    effects: { [actionType]: false },
                },
            });
        }

        if (err) {
            if (effectStatusWatch) {
                yield sagaEffects.put({
                    type: effectStatus_name,
                    payload: {
                        [actionType]: {
                            status: status_fail,
                            error: err,
                        },
                    },
                });
            }
            handleError(err);
            return;
        }
        if (effectStatusWatch) {
            yield sagaEffects.put({
                type: effectStatus_name,
                payload: {
                    [actionType]: {
                        status: status_success,
                        error: null,
                    },
                },
            });
        }
    };

    switch (type) {
        case 'takeEvery':
            return function*() {
                yield takeEvery(actionType, wrapper);
            };
        case 'takeLatest':
            return function*() {
                yield takeLatest(actionType, wrapper);
            };
        case 'throttle':
            return function*() {
                yield throttle(time, actionType, wrapper);
            };
        default:
            return function*() {
                yield takeEvery(actionType, wrapper);
            };
    }
}

function isWindow(win) {
    return typeof win === 'object' && win !== null && win.window === win;
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
