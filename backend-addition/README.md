# Backend addition: GET /users/me

Verified against the real WI-TP backend (`npm run build` and `npm run lint`
both pass clean with this added). Two files, both go in the backend repo:

1. `users.controller.ts` → `src/users/users.controller.ts` (new file)
2. `users.module.ts` → replaces `src/users/users.module.ts` (adds the
   `UsersController` import and registers it in `controllers: []` — that's
   the only change from what's on `main`)

Returns `{ id, githubLogin, avatarUrl }` for the signed-in user (JWT
required). `accessToken` is never selected onto the response, same
reasoning as `toPublicRepository` in `RepositoriesController`.
