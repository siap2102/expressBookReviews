const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Helper: find books where a field matches a value (case-insensitive). Returns a Promise.
const filterBooks = (field, value) => {
  return new Promise((resolve) => {
    const matches = {};
    Object.keys(books).forEach((isbn) => {
      if (books[isbn][field].toLowerCase() === value.toLowerCase()) {
        matches[isbn] = books[isbn];
      }
    });
    resolve(matches);
  });
};

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }
  users.push({ username: username, password: password });
  return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

// Get all books (async/await with a Promise)
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await new Promise((resolve) => resolve(books));
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books" });
  }
});

// Get book details by ISBN (Promise callbacks)
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject("Book not found");
    }
  })
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(404).json({ message: err }));
});

// Get books by author (async/await)
public_users.get('/author/:author', async (req, res) => {
  const result = await filterBooks("author", req.params.author);
  if (Object.keys(result).length === 0) {
    return res.status(404).json({ message: "No books found for this author" });
  }
  return res.status(200).send(JSON.stringify(result, null, 4));
});

// Get books by title (async/await)
public_users.get('/title/:title', async (req, res) => {
  const result = await filterBooks("title", req.params.title);
  if (Object.keys(result).length === 0) {
    return res.status(404).json({ message: "No books found with this title" });
  }
  return res.status(200).send(JSON.stringify(result, null, 4));
});

// Get book reviews by ISBN
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

// Client functions that use Axios with async/await and Promise callbacks

// Get all books (async/await)
const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (err) {
    console.error("Error fetching all books:", err.message);
  }
};

// Get book by ISBN (Promise callbacks)
const getBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((err) => console.error("Error fetching book by ISBN:", err.message));
};

// Get books by author (async/await)
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching books by author:", err.message);
  }
};

// Get books by title (async/await)
const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching books by title:", err.message);
  }
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
