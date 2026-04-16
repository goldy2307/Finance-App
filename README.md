# Finance-App
Creating a Finance App for the client

## Admin bootstrap (MongoDB)

Create (or promote) an admin user in the configured Mongo DB:

```powershell
$env:ADMIN_EMAIL='admin@kashly.in'
$env:ADMIN_PHONE='9000000000'
$env:ADMIN_PASSWORD='Password1'
npm.cmd run create:admin
```

Notes:
- Do not pre-hash `ADMIN_PASSWORD` (the Mongo user model hashes on save).
- Use the same `MONGO_URI` as your server (from `.env`).
