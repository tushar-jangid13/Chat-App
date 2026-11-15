# tChat database

tChat uses MongoDB. The backend connects with the `MONGODB_URI` value in
`backend/.env` and creates these collections from its Mongoose models:

This folder is the database access package (connection lifecycle and Mongoose
schemas), not a MongoDB server. Provision MongoDB separately, preferably as a
managed database, and set its connection string in the backend environment.
Local database files under `data/` are development state and are excluded from
version control and deployment.

- `users` — account details and password hashes
- `conversations` — conversation members and the latest message
- `messages` — message text, sender, conversation, and read status

For a local MongoDB server on port `27017`, use:

```text
mongodb://localhost:27017/
```

The backend selects the `tchat` database with the `MONGODB_DATABASE` setting.

The collections are created when the backend first writes data. This folder
contains the database connection and model implementations:

- `db.js` — connects and disconnects from MongoDB
- `models/User.js` — user model and password hashing
- `models/Message.js` — chat message model
- `models/Conversation.js` — conversation model
- `index.js` — exports the connection and models

The backend's `config/db.js` and `models/` files re-export these implementations
to preserve the backend folder layout from the project structure reference.
