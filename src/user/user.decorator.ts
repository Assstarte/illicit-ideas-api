import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, req) => {
    /*
        If there is a data prop which is added in @User decorator,
        we are getting that specific property from the user object.

        If not - we simply return the whole user object.
     */
    return data ? req.user[data] : req.user;
});
