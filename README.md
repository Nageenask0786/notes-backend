# Note-Taking Application
This is a simple note-taking web application built with Node.js and SQLite, inspired by Google Keep. Users can create, read, update, and delete notes, manage tags, and authenticate using JSON Web Tokens (JWT).

### Technologies Used
- Node.js
- Express.js
- SQLite
- bcrypt (for password hashing)
- JSON Web Tokens (JWT) for authentication

### Features
User Authentication

- Register new users (POST /users/signup)
- Login existing users (POST /login)

### Note Management

- Create a new note (POST /notes)
- Retrieve all notes or search notes (GET /notes)
- Retrieve a specific note by ID (GET /note/:noteId)
- Update a note by ID (PUT /note/:noteId)
- Delete a note by ID (DELETE /note/:noteId)

### Tag Management

- Create a new tag (POST /tags)
- Retrieve all tags (GET /tags)
- Update a tag by ID (PUT /tags/:id)
- Delete a tag by ID (DELETE /tags/:id)

##Setup Instructions

###Clone the repository

```bash
git clone https://github.com/your/repository.git
cd repository-name
```

### Install dependencies

```bash
Copy code
npm install
```
