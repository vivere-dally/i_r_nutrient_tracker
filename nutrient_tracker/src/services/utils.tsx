export const getLogger: (tag: string) => (...args: any) => void = tag => (...args) => console.log(tag, ...args);

export function execWithLogs<T>(promise: Promise<T>, caller: string, log: (...args: any) => void): Promise<T> {
    log(`${caller} - start`);
    return promise
        .then(result => {
            log(`${caller} - success`);
            return Promise.resolve(result);
        })
        .catch(error => {
            log(`${caller} - failure`);
            return Promise.reject(error);
        });
}