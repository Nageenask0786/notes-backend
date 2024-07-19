const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { request } = require("http");
const app = express();
app.use(express.json());
const port = process.env.port || 3000;
let db = null;
const dbPath = path.join(__dirname, "notesApplication.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}`);
    });
  } catch (error) {
    console.log(`Some Error Occured ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const authenticationTokenMiddleware = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  console.log(authHeader);
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(200).send("Invalid Access Token");
  } else {
    jwt.verify(jwtToken, "ACCESS_TOKEN", async (error, payload) => {
      if (error) {
        response.send("Invalid Access Token");
      } else {
        next();
      }
    });
  }
};

//register or signup user api
app.post("/users/signup", async (request, response) => {
  const { username, name, password, phonenumber, gender, location } =
    request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const encryptedPassword = await bcrypt.hash(password, 10);

  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, phonenumber, gender, location) 
      VALUES 
        (
          ?,?,?,?,?,?
        )`;
    const dbResponse = await db.run(createUserQuery, [
      username,
      name,
      encryptedPassword,
      phonenumber,
      gender,
      location,
    ]);
    const newUserId = dbResponse.lastID;
    response.send(`Created new user with id ${newUserId}`);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

//login api

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
  const dbUser = await db.get(selectUserQuery, [username]);
  if (dbUser === undefined) {
    response.status(400).send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "ACCESS_TOKEN");
      response.status(200).send({ jwt_token: jwtToken });
    } else {
      response.status(400).send("Invalid Password");
    }
  }
});

//get notes

app.get("/notes", authenticationTokenMiddleware, async (request, response) => {
  const {search=""} = request.query
  try {
    const getNotesQuery = `SELECT * FROM note WHERE title LIKE '%' || ? || '%' OR content LIKE '%' || ? || '%' ORDER BY id`;
    const notesArray = await db.all(getNotesQuery,[search,search]);
    response.send(notesArray);
  } catch (e) {
    console.log(`Some Error Occured ${e.message}`);
  }
});

app.get(
  "/note/:noteId",
  authenticationTokenMiddleware,
  async (request, response) => {
    const { noteId } = request.params;
    try {
      const getNoteQuery = `SELECT * FROM note WHERE id = ?`;
      const notesArray = await db.get(getNoteQuery, [noteId]);
      response.send(notesArray);
    } catch (e) {
      console.log(`Some Error Occured ${e.message}`);
    }
  }
);

app.post("/notes", authenticationTokenMiddleware, async (request, response) => {
  const { title, content, creation_date } = request.body;
  try {
    const createNoteQuery = `INSERT INTO note (title,content,creation_date)
    VALUES(?,?,?)`;
    const note = await db.run(createNoteQuery, [title, content, creation_date]);
    response.send(note.lastID);
  } catch (e) {
    console.log(`Some Error Occured ${e.message}`);
  }
});

app.put("/note/:noteId", authenticationTokenMiddleware,async (request, response) => {
  const { noteId } = request.params;
    const { title, content } = request.body;
  try {
    const updateNoteQuery = `UPDATE note SET title = ?,content = ?`;
    const updatedNote = await db.run(updateNoteQuery, [title, content]);
    if (updatedNote.changes === 0) {
      return response.status(404).send("Note not found");
    }

    response.send("Note updated successfully");
    response.send(`Updated note with id ${updatedNote.lastID}`);
  } catch (e) {
    console.log(`Some Error Occured ${e.message}`);
  }
});

//delete note
app.delete(
  "/note/:noteId",
  authenticationTokenMiddleware,
  async (request, response) => {
    const { noteId } = request.params;
    try {
      const deleteNoteQuery = `DELETE * FROM note WHERE id = ?`;
      const deletedNote = await db.get(getNoteQuery, [noteId]);
      if (deletedNote.changes === 0) {
        return response.status(404).send("Note not found");
      }

      response.send("Note deleted successfully");
    } catch (e) {
      console.log(`Some Error Occured ${e.message}`);
    }
  }
);

//create tags
app.post("/tags", authenticationTokenMiddleware,async (request, response) => {
  const { name } = request.body;

  try {
    const insertTagQuery = `
      INSERT INTO tags (name)
      VALUES (?)
    `;
    const dbResponse = await db.run(insertTagQuery, [name]);
    const newTagId = dbResponse.lastID;
    response.status(200).send({ id: newTagId, name });
  } catch (error) {
    console.error("Error creating tag:", error);
  }
});

//get tags
app.get("/tags", authenticationTokenMiddleware, async (request, response) => {
  try {
    const selectTagsQuery = `
      SELECT id, name
      FROM tags
    `;
    const tags = await db.all(selectTagsQuery);
    response.send(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
  }
});

//update tag
app.put("/tags/:id",authenticationTokenMiddleware,async (request, response) => {
  const { id } = request.params;
  const { name } = request.body;
  
  try {
    const updateTagQuery = `
      UPDATE tags
      SET name = ?
      WHERE id = ?
    `;
    await db.run(updateTagQuery, [name, id]);
    response.send("Tag updated successfully");
  } catch (error) {
    console.error("Error updating tag:", error);
  }
});

//delete tag
app.delete("/tags/:id",authenticationTokenMiddleware, async (request, response) => {
  const { id } = request.params;
  
  try {
    const deleteTagQuery = `
      DELETE FROM tags
      WHERE id = ?
    `;
    await db.run(deleteTagQuery, [id]);
    response.send("Tag deleted successfully");
  } catch (error) {
    console.error("Error deleting tag:", error);
  }
});
