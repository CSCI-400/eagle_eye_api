const z = require('zod');


const UserSchema = z.object({
    displayName: z.string().min(1, 'Display name is required'),
    email: z.string().email(),
    profilePicture: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
}).transform((data) => {
    const now = new Date().toISOString();
    return {
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now,
    };
});

const validateUser = (data) => {
    return UserSchema.parse(data);
};

const collectionPath = 'users';

module.exports = { validateUser, UserSchema, collectionPath };