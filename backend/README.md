Medicard Backend

This is a minimal Express backend intended for local development and prototyping.

Quick start

1. cd backend
2. npm install
3. npm run dev (requires nodemon) or npm start

Endpoints

- POST /api/signup
  body: { userType, fullName, email, password, extra }
  returns: { ok: true, user, token }

- POST /api/login
  body: { identifier, password } // identifier can be email or user ID
  returns: { ok: true, user, token }

- GET /api/me
  header: Authorization: Bearer <token>

Notes

- This stores users to backend/data/users.json as a simple file-backed store and uses JWT for auth.
- Do NOT use this in production. It's for local development and prototyping only.
