export const logger = (store) => (next) => (action) => {
    // eslint-disable-next-line
    console.log('dispatching:', action);
    const result = next(action);
    // eslint-disable-next-line
    console.log('next state:', store.getState());
    return result;
};
