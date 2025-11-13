Frontend Integration
====================

Environment
-----------

Create/update `.env` next to `src/` (already used by the app):

```
PORT=3000
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:5173
```

The `CLIENT_ORIGIN` controls which frontend origin is allowed via CORS.

CORS
----

This backend enables CORS using the `cors` package:

- Install (in `backend/`):

```
npm install cors --save
```

- The server trusts the origin from `CLIENT_ORIGIN` and sets `credentials: true`.

Frontend .env
-------------

Example for a React/Vite app:

```
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=your_key
```

HTTP Client
-----------

Send the JWT in the `Authorization` header for all protected routes:

```
Authorization: Bearer <token>
```

Key Routes
----------

- Auth: `/auth/admin/login`, `/auth/teacher/login`, `/auth/student/login`
- Admin: `/admin/...`
- Teacher: `/teacher/...`
- Student: `/student/...`

Local Run
---------

```
npm run dev
```



