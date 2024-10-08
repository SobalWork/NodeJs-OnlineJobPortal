const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const adminRouter = require("./api/router/adminRouter");
const employerRouter = require("./api/router/employerRouter");
const jobSeekerRouter = require("./api/router/jobSeekerRouter");
const chatRouter = require("./api/router/chatRouter");

// Import socket.io setup
const initializeSocketServer = require("./socket/socketServer");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
initializeSocketServer(server);

// for env
require("dotenv").config();

// Disable 'X-Powered-By' header
app.disable("x-powered-by");

// enabling CORS for some specific origins only.
let corsOptions = {
  origin: [`${process.env.ALLOWED_ORIGINS}`],
};

app.use(cors(corsOptions));

// to use json data (post request data) it display data from body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose
  .connect(`${process.env.DB_URL}`)
  .then(() => {
    console.log(`Mongoose is connected`);
  })
  .catch((err) => {
    console.log(`Error to connect mongoose ${err.message}`);
  });

app.use(express.json());

app.get("/", (req, res, next) => {
  let myIp = req.ip?.replace(/^.*:/, "");
  res.status(200).json({
    message: "Home Page",
    port: `http://${myIp}:${process.env.PORT}`,
  });
});

app.use("/job-seeker", jobSeekerRouter);
app.use("/employer", employerRouter);
app.use("/admin", adminRouter);
app.use("/chat", chatRouter);

app.use((req, res, next) => {
  res.status(404).json({
    message: "Page Not Found!",
    error: "404",
  });
});

// app.listen(process.env.PORT, () => {
//   console.log(`Server started on port ${process.env.PORT}`);
// });
server.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

// npm init
// npm i express mongoose body-parser bcrypt jsonwebtoken nodemon dotenv
// npm i express-validator
// npm i cors
// npm i socket.io
