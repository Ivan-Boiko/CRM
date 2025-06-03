# CRM

## Backend server

A simple Express server with a SQLite database is located in the `server` folder.
It exposes two endpoints:

* `POST /api/register` – register a new user
* `POST /api/login` – login with email and password

To start the server:

```bash
cd server
npm install
npm start
```

The React client uses these endpoints for registration and login.
