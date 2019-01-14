export function getActionCreatorsAndTypes(model) {
    const { namespace, effects, reducers } = model;
    const creators = {};
    const types = {};
    [...Object.keys(effects), ...Object.keys(reducers)].forEach((key) => {
        const type = `${namespace}/${key}`;
        creators[key] = (payload) => {
            return { type, payload };
        };
        types[key] = type;
    });
    return { actionCreators: creators, actionTypes: types };
}
