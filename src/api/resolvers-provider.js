import glob from 'glob';

const __registeredResolvers = {};

export const registerResolver = (resolverName, resolver) => {
    if (__registeredResolvers[resolverName]) {
        throw new Error(`Resolver with ${resolverName} name already exists`);
    }
    __registeredResolvers[resolverName] = resolver;
}

export const getResolver = resolverName => {
    const resolver = __registeredResolvers[resolverName];
    if (!resolver) {
        throw new Error(`Resolver with ${resolverName} wasn't registered`);
    }
    return resolver;
}

export const registerResolvers = async directoryName => {
    const files = glob.sync(directoryName + '/**/*.js', {
        absolute: true
    });
    const resolverFiles = files.filter(file => file.endsWith('-resolvers.js'));
    for (const resolverFile of resolverFiles) {
        const module = await import(resolverFile);
        Object.keys(module).forEach(key => {
            const resolver = module[key];
            registerResolver(key, resolver);
        })
    }
}
