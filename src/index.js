import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import * as sagaEffects from 'redux-saga/effects';
import { isFunction, isPlainObject, isString, extend, isArray } from 'lodash';

const { takeEvery, takeLatest, throttle } = sagaEffects;

function isWindow(win) {
    return typeof win === 'object' && win.window === win;
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

//namespace reserved word
const reservedWord = ['router', 'loading'],
    separator = '/';

export function createStorer(config = {}) {
    let _config = {
        initialState: {},
        onError: () => void 0,
        extraEnhancers: [],
        model: [],
        usedInVue: false,
        integrateLoading: false,
    };
    if (isPlainObject(config)) {
        _config = extend(_config, config);
    }

    const app = {
        reducers: {},
        sagaMiddleware: createSagaMiddleware(),
        namespace: reservedWord.slice(0),
        config: _config,
    };
    //integrate loading
    if (app.config.integrateLoading) {
        app.reducers.loading = (state = { effects: {} }, { type, payload }) => {
            if (type === 'loading') {
                let { effects, ...other } = payload;
                return {
                    ...state,
                    effects: { ...state.effects, ...effects },
                    ...other,
                };
            }
            return state;
        };
    }

    init(app, _config);

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

    function addModel(model) {
        _addModel(app, model);
    }
}

// helper

/**
 *app init :createStore & rewrite handleError
 * @param app
 * @param config
 */
function init(app) {
    const reducer = getReducer(app),
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
    assert(isPlainObject(model), 'model should be object');
    assert(
        isString(model.namespace),
        `namespace should be string but got ${typeof namespace}`,
    );
    assert(
        reservedWord.indexOf(model.namespace) < 0,
        `The namespace of model(${
            model.namespace
        }) should not be one of  '${reservedWord.join(' ')}'`,
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
    const _reducer = createReducer(app, _model);
    app.reducers = extend({}, app.reducers, { [_model.namespace]: _reducer });
    app.store.replaceReducer(getReducer(app));

    //create saga
    if (isPlainObject(_model.effects)) {
        app.sagaMiddleware.run(createSaga(app, _model));
    }
}

/**
 * combineReducers
 * @param app
 * @returns {*}
 */
function getReducer(app) {
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

    const logger = (store) => (next) => (action) => {
        // eslint-disable-next-line
        console.log('dispatching:', action);
        const result = next(action);
        // eslint-disable-next-line
        console.log('next state:', store.getState());
        return result;
    };

    if (process.env.NODE_ENV !== 'production') {
        try {
            if (
                isWindow(window) &&
                isFunction(window.__REDUX_DEVTOOLS_EXTENSION__)
            ) {
                devtools.push(window.__REDUX_DEVTOOLS_EXTENSION__());
            } else {
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
 * createReducer
 * @param app
 * @param model
 * @returns {Function}
 */
function createReducer(app, model) {
    const { config } = app;
    const { namespace, reducers } = model;
    const initialState = extend(
        model.state,
        isPlainObject(config.initialState)
            ? config.initialState[namespace]
            : {},
    );
    return function(state = initialState, { type, ...other }) {
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
 * prefixActionType
 * @param namespace
 * @returns {{put: put}}
 */
function prefixActionType(namespace) {
    function put(action) {
        if (isPlainObject(action)) {
            //no prefix only when action.prefix === false
            if (action.prefix === false) return sagaEffects.put(action);

            let { type } = action;
            if (isString(type)) {
                if (type.indexOf(separator) > 0) {
                    return sagaEffects.put(action);
                } else {
                    action.type = namespace + separator + type;
                    return sagaEffects.put(action);
                }
            } else {
                throw new Error('action type is not string!');
            }
        } else {
            throw new Error('action is not a plain object!');
        }
    }

    return { put };
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
        config: { integrateLoading },
    } = app;

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
                    type: 'loading',
                    payload: {
                        effects: { [namespace + separator + key]: true },
                    },
                });
            }

            yield fn(action, {
                ...sagaEffects,
                ...prefixActionType(namespace),
            });
        } catch (e) {
            err = e;
        }
        if (integrateLoading) {
            yield sagaEffects.put({
                type: 'loading',
                payload: {
                    effects: { [namespace + separator + key]: false },
                },
            });
        }

        if (err) {
            handleError(err);
        }
    };

    switch (type) {
        case 'takeEvery':
            return function*() {
                yield takeEvery(namespace + separator + key, wrapper);
            };
        case 'takeLatest':
            return function*() {
                yield takeLatest(namespace + separator + key, wrapper);
            };
        case 'throttle':
            return function*() {
                yield throttle(time, namespace + separator + key, wrapper);
            };
        default:
            return function*() {
                yield takeEvery(namespace + separator + key, wrapper);
            };
    }
}
