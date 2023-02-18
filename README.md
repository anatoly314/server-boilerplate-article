A few months ago, I began working on a personal project that involved client-server communication. To take advantage of this, I tried using GraphQL. While I generally liked the approach of having a single API endpoint and resolvers, the overhead of setting up and maintaining a GraphQL server was too much for a one-person operation like mine.

That's when I came up with the idea of replacing GraphQL with a more lightweight and easier-to-manage approach. My solution, which I'll describe in more detail below, has proven to be a game-changer for me and has significantly improved my efficiency and speed of development.

Unlike GraphQL, my solution does not require the overhead of setting up and maintaining multiple schemas which need to be set for the client and server. Instead, it defines resolver functions to provide flexible alternative. In this article, I'll walk you through the details of my solution and the benefits it has brought to my pet project."

### Step 1 - Creating Basic Express App
At the beginning let's define a basic expressjs application which will have a single endpoint.

### app.js
```js
import express from 'express';
import apiRouter from "./api-route.js";
import cors from "cors";

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use('cors');
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});
```

and

### api-route.js
```javascript
import express from "express";
const router = express.Router();

router.get('*', async (req, res, next) => {
    const response = {
        text: 'Hello World!'
    };
    return res.json(response);
})

export default router;
```

This is simplest express app possible, every GET request to localhost:5000/api/* will be responded with body:

```json
{
  "text": "Hello World"
}
```

You can find this code at the following GitHub repository in branch **step-1**: [anatoly314/server-boilerplate-article](https://github.com/anatoly314/server-boilerplate-article)

### Step 2 - A Better Approach to API Development: Resolvers Provider 
To add more endpoints to our app, we could follow the traditional approach of grouping all the endpoints into route files and importing them one by one. 
However, I'd like to suggest a new way that simplifies this process. 
Instead, we can create an `api` folder and define a new file within it called `resolvers-provider.js`, which will contain the following content:

### resolvers-provider.js
```javascript
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
            registerResolver(resolver);
        })
    }
}
```

To invoke `resolver-provider.js`, simply add the following code to your `api-route.js` file:"

```javascript
...
const __dirname = dirname(fileURLToPath(import.meta.url));
await registerResolvers(__dirname);
...
```

When you invoke `registerResolver`, it will search for all files that end with `-resolvers.js` within the `api` directory and its subdirectories. 
It will then register all of the exported functions from those files as resolvers.

Next, add a new file called `users-resolvers.js` to the `api/users` directory, and include the following content:

### users-resolvers.js
```javascript
export const getUsersByName = ({body}) => {
    const {name} = body;
    const allUsers = [{
        id: 1,
        name: 'Anatoly',
        age: 42
    }, {
        id: 2,
        name: 'Yulia',
        age: 34
    }, {
        id: 3,
        name: 'John',
        age: 55
    }];

    const filteredUsers = allUsers.filter(user => user.name === name);
    return filteredUsers;
}
```

When you run your server, all exported functions from files that match the pattern `api/*-resolvers.js` will automatically be registered as resolvers.

To use the registered resolvers, there's one last step we need to take. We need to replace the existing GET endpoint in `api-route.js` with the following POST endpoint:

```javascript
router.post('*', async (req, res, next) => {
    try {
        const body = req.body;
        const authorizedUser = req.header('Authorization');
        const resolverName = req.url.substring(1);
        const resolver = getResolver(resolverName);
        const result = await resolver({body, authorizedUser});
        return res.json(result);
    } catch (err) {
        if (err.message === 'Unauthenticated') {
            res.status(401);
            res.send(err.message);
        } else {
            res.status(500);
            res.send("Server error");
        }
    }
});
```

To invoke our resolver, we can make a POST request to the following URL template: 
`localhost:5000/api/<RESOLVER_NAME>`. 
For example, to invoke the `getUsersByName` resolver, we would make a request to 
`localhost:5000/api/getUsersByName`. The body of the request should contain 
the necessary input data for the resolver to process.

```json
{
    "name": "Anatoly"
}
```
When our server receives this request, it will invoke the resolver 
with the name `getUsersByName` that's defined in the `users-resolvers.js` file 
located in the `api/users` directory. 
The contents of the body will be passed to the resolver as input.

So what have we gained from this approach? Although there was some effort required at the beginning to set up the resolvers provider, the benefits are significant. Now, if we need to add another endpoint, instead of defining the entire endpoint code in the old way, we can simply add a new function to the existing resolvers provider or create a new resolvers provider. This results in less code, fewer bugs, and less time spent on development overall.

### Step 3 - Secure Your Resolvers with JavaScript Decorators
With the boilerplate we've created, we've replaced the traditional 
ExpressJS API endpoints with a Resolvers approach that simplifies our 
codebase and makes developers' lives much easier. However, this 
approach lacks middleware support, which means we need to find an 
alternative way to handle tasks like authentication and authorization 
that would normally be done with middleware. One option is to use 
JavaScript decorators. We will create a JavaScript decorator that 
requires authentication for requests to a resolver. 
One possible implementation is to check that the `Authentication` 
header of the request contains the word `admin`.

<details>
  <summary>Javascript Decorators considered safe to use now that they're at stage 3 proposal</summary>

> Stage 3 is the "Candidate" stage. At this stage, the proposal has been accepted by TC39 as a potential addition to the language and has been approved for inclusion in a future ECMAScript version. The proposal is considered mostly complete and has been reviewed and refined by TC39 members, but it may still undergo some changes based on feedback from implementers and developers. Proposals at Stage 3 are generally considered safe to use and are available in some experimental JavaScript runtimes, but they are not yet officially part of the language.

For more details look here: [tc39/proposal-decorators](https://github.com/tc39/proposal-decorators)
</details>

Since JavaScript decorators are still considered an experimental feature 
and Node.js currently does not have built-in support for them, 
we will need to use Babel to transpile our code. 
To do this, we will create a `.babelrc` file in the root of our project, 
which will allow us to configure Babel and use its transpiling capabilities:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": false
      }
    ]
  ],
  "env": {
    "development": {
      "sourceMaps": "inline",
      "retainLines": true
    }
  },
  "plugins": [
    "@babel/plugin-syntax-top-level-await",
    ["@babel/plugin-proposal-decorators", {
      "version": "2022-03"
    }]
  ]
}
```

To implement the necessary changes, you should first include the code block below in the script section of your `package.json` file:
```json
{
    "build": "babel src -d dist",
    "start": "npm run build && node dist/app.js",
    "start-nodemon": "nodemon --watch './src/**/*.js' --exec npm run start"
}
```
Then, execute the following command to install the required `devDependencies`:

`npm install --save-dev @babel/core @babel/cli @babel/preset-env @babel/plugin-proposal-decorators`

Once this is done, you can start the app by running `npm run start-nodemon`. 
Babel will transpile the code in the `src` folder to a new `dist` folder, 
execute it, and automatically recompile it upon any changes made 
to the project.
Before we can start using JavaScript decorators, we need to make some 
changes to our code. Specifically, the following files need to be modified:
`src/api/users/users-resolvers.js` and `src/api/resolvers-provider.js`

As per the [proposal](https://github.com/tc39/proposal-decorators), 
decorators can be used with Classes and their elements such as fields, 
methods, and accessors. To leverage this feature, we need to ensure that 
our resolvers provider is an instance of a Class. 
Therefore, we will modify the code in `src/api/users/users-resolvers.js` 
to the following:

```javascript
class UsersResolvers {
    getUsersByName ({body}) {
        const {name} = body;
        const allUsers = [{
            id: 1,
            name: 'Anatoly',
            age: 42
        }, {
            id: 2,
            name: 'Yulia',
            age: 34
        }, {
            id: 3,
            name: 'John',
            age: 55
        }];

        const filteredUsers = allUsers.filter(user => user.name === name);
        return filteredUsers;
    }
}

export default UsersResolvers;
```

We also need to make changes to our `src/api/resolvers-provider.js` 
to allow it to create instances of a class and retrieve references to 
its class methods:

```javascript
...
for (const resolverFile of resolverFiles) {
    const module = await import(resolverFile);
    const instantiatedResolver = new module.default();
    Object.getOwnPropertyNames(module.default.prototype).forEach(key => {
        if (key !== 'constructor') {
            const resolver = instantiatedResolver[key];
            registerResolver(key, resolver.bind(instantiatedResolver.self));
        }
    })
}
...
```

Now that all the preparations have been completed,
we can start writing our first JavaScript decorator.
Let's create a new folder called `src/decorators` and add a file to it
called `auth-decorator.js`:

### auth-decorator.js
```javascript
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
```

And we can apply it to the `getUsersByName` 
method in `users-resolvers.js` as follows:

```javascript
...
@authRequired("admin")
getUsersByName ({body}) {
 ...
}
...
```

By adding the `authRequired` decorator to a resolver function, such as 
`getUsersByName` in `users-resolvers.js`, requests to that resolver will 
require authentication. This means that the request must contain a value 
of `admin` in the `Authentication` header, or else the request will be 
rejected with a `401` error indicating that it is unauthenticated. 
This is just a basic example of what can be done with decorators. 
In general, anything that can be achieved with middleware can be 
achieved with decorators, offering great flexibility in the way you 
handle requests in your application.

### Step 4 - Creating React Hook which will seamlessly invoke resolvers
We have implemented server side approach which replaces regular API with endpoints
by approach with resolvers, let's create ReactJS hook which will call
to these resolvers seamlessly:

```javascript
import axios from "axios";
import {useState} from "react";

const RESOLVER_API_URL = "http://localhost:4000/api";

export const useResolver = (resolverName) => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(null);

    const invokeResolver = async data => {
        setLoading(true);
        try {
            const url = `${RESOLVER_API_URL}/${resolverName}`;
            const config = {
                url,
                headers: {
                    Authorization: 'admin'
                },
                method: 'POST',
                data: data
            }
            const response = await axios(config);
            setResult(response.data);
            return response.data;
        } catch (err) {
            const errText = `Error invoking resolver ${resolverName}`;
            console.log(errText, err);
            throw new Error(errText);
        } finally {
            setLoading(false);
        }
    }

    return [invokeResolver, result, loading];
}
```

A call to any resolver can now be as simple as the following:

```javascript
const [getUsersByName, users, loadingUsers] = useResolver("getUsersByName");
```
The `getUsersByName` function can now be called using a simple syntax. 
The results of the invocation are stored in the `users` property, 
while the `loadingUsers` boolean flag indicates the current invocation state.

Here's the complete example of a React component that uses this hook:

```javascript
import React, {useState} from "react";
import {useResolver} from "../../resolvers/resolvers-hook";

const Users = () => {

    const [getUsersByName, users, loadingUsers] = useResolver("getUsersByName");
    const [inputValue, setInputValue] = useState('');
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    }

    return (
        <div>
            {
                loadingUsers && <div>LOADING</div>
            }
            Users with the name:
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
            />
            <button onClick={() => getUsersByName({
                name: inputValue
            })}>Load Users</button>
            <pre>
                {JSON.stringify(users, null, 2)}
            </pre>
        </div>
    )
}

export default Users;
```

Credits:
- ChatGPT, I would like to express my gratitude to **ChatGPT** for the incredible help provided to me. The chatbot was instrumental in guiding me through various questions and tasks, and helped me to improve my English writing skills. The examples and explanations given were invaluable in understanding complex concepts. I would like to thank **the entire team behind ChatGPT** for creating such an amazing resource.
- GraphQL developer community, I would like to acknowledge the contributions of the **GraphQL developer community**, including **Facebook** and **Apollo**. Much of what I have accomplished in this project has been inspired by their codebase."
