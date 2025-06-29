const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
var cookieParser = require("cookie-parser");
require('dotenv').config();

const initializeApp = () => {
  const app = express();
  var corsOptions = {
    origin: "*",
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  
  app.use(cookieParser());
  // app.use("/api/v1", routes);

  app.get("/", (req, res) => {
    res.json({ message: "Appointment system" });
  });
  return app;
};

const app = initializeApp();

module.exports = app;
