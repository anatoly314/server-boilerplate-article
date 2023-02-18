import {authRequired} from "../../decorators/auth-decorator.js";

class UsersResolvers {

    @authRequired("admin")
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

