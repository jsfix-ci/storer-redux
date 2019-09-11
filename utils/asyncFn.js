export default function asyncFn(n) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(n), 100);
    });
}