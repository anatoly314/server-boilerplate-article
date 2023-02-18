export function authRequired(userType){
    return function (value, { kind, name }) {
        if (kind === "method" || kind === "getter" || kind === "setter") {
            return function (...args) {
                const {authorizedUser} = args[0];
                if (authorizedUser !== userType) {
                    throw new Error("Unauthenticated");
                }
                const ret = value.call(this, ...args);
                return ret;
            };
        }
    }
}
