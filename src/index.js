const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const hbs = require("hbs");
const async = require("hbs/lib/async");

const templatePath = path.join(__dirname, "../templates");
const partialsPath = path.join(__dirname, "../templates/partials");
const publicPath = path.join(__dirname, "../public");

const collection = require("./mongodb");
const { error } = require("console");
const bcrypt = require("bcrypt");

app.use(express.json());
app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: false }));

app.set("views", templatePath);
app.set("view engine", "hbs");

hbs.registerPartials(partialsPath);

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(salt);
    console.log(hashedPassword);
    const data = {
      name: req.body.name,
      password: hashedPassword,
    };
    await collection.insertMany([data]);

    res.render("login");
  } catch {
    console.log("error");
  }
});

app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.name });

    if (await bcrypt.compare(req.body.password, check.password)) {
      res.render("home");
    } else {
      res.send("Wrong password");
    }
  } catch {
    res.send("Wrong passwords or username");
  }

  res.render("home");
});

app.listen(port, () => {
  console.log("port connected");
});
