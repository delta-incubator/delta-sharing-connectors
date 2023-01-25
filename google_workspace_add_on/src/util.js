export function assert(condition, message) {
    if (!condition) {
        if (!message) {
            throw Error('Assertion failed');
        }
        throw Error(message);
    }
}