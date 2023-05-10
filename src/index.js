const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require("express-handlebars");
const async = require("hbs/lib/async");
const templatePath = path.join(__dirname, "resources/views");
const { shipper, user, vendor, product } = require("./mongodb");
const { connectionUrl } = require("./config"); // Import the connectionUrl from config.js
const { error } = require("console");
const bcrypt = require("bcrypt");
const publicPath = path.join(__dirname, "/public");

app.engine(
  "handlebars",
  handlebars.engine({
    extname: ".hbs",
  })
);
app.use(express.static(publicPath));
app.use(express.json());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "secretKey",
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }, // 1 hour
  store: MongoStore.create({
    mongoUrl: connectionUrl, // use the imported connectionUrl
    collectionName: 'sessions'
  })
}));

app.get("/", (req, res) => {
  res.render("home", {loggedInUser: req.session.user});
});

app.get("/home", (req, res) => {
  res.redirect("/");
});

app.get("/signup-user", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render("signup-user");
});

app.get("/add-product", (req, res) => {
  res.render("add-product");
});

app.get("/signup-vendor", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render("signup-vendor");
});

app.get("/signup-shipper", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render("signup-shipper");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render("login");
});

app.get("/privacy-policy", (req, res) => {
  res.render("privacy-policy");
});

app.post("/signup-user", async (req, res) => {
  try {
    const check =
      (await user.findOne({ username: req.body.username })) ||
      (await vendor.findOne({ username: req.body.username })) ||
      (await shipper.findOne({ username: req.body.username }));

    if (check) {
      res.render("signup-user", {
        showUser: true,
      });
    } else {
      try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const data = {
          username: req.body.username,
          password: hashedPassword,
          name: req.body.name,
          address: req.body.address,
        };
        await user.insertMany([data]);

        res.render("login");
      } catch {
        console.log("error 1 ");
      }
    }
  } catch {
    console.log("error 2 ");
  }
});

app.post("/signup-vendor", async (req, res) => {
  try {
    const check =
      (await user.findOne({ username: req.body.username })) ||
      (await vendor.findOne({ username: req.body.username })) ||
      (await shipper.findOne({ username: req.body.username }));
    const check_business = await vendor.findOne({
      bussiness_name: req.body.bussiness_name,
    });

    if (check && check_business) {
      res.render("signup-vendor", {
        showUser: true,
        showBussiness: true,
      });
    } else if (check) {
      res.render("signup-vendor", {
        showUser: true,
      });
    } else if (check_business) {
      res.render("signup-vendor", {
        showBussiness: true,
      });
    } else {
      try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const data = {
          username: req.body.username,
          password: hashedPassword,
          name: req.body.name,
          bussiness_name: req.body.bussiness_name,
          bussiness_address: req.body.bussiness_address,
        };
        await vendor.insertMany([data]);

        res.render("login");
      } catch {
        console.log("error 1 ");
      }
    }
  } catch {
    console.log("error 2 ");
  }
});

app.post("/signup-shipper", async (req, res) => {
  try {
    const check =
      (await user.findOne({ username: req.body.username })) ||
      (await vendor.findOne({ username: req.body.username })) ||
      (await shipper.findOne({ username: req.body.username }));

    if (check) {
      res.render("signup-shipper", {
        showUser: true,
      });
    } else {
      try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const data = {
          username: req.body.username,
          password: hashedPassword,
          name: req.body.name,
          distribution_hub: req.body.distribution_hub,
        };
        await shipper.insertMany([data]);

        res.render("login");
      } catch {
        console.log("error 1 ");
      }
    }
  } catch {
    console.log("error 2 ");
  }
});


app.post("/login", async (req, res) => {
  try {
    const check =
      (await user.findOne({ username: req.body.username })) ||
      (await vendor.findOne({ username: req.body.username })) ||
      (await shipper.findOne({ username: req.body.username }));

    if (check && await bcrypt.compare(req.body.password, check.password)) {
      // Store user information in session
      req.session.user = {
        username: check.username,
      };

      // console.log("User object stored in session:", req.session.user); 

      // Redirect to home route
      res.redirect("/home");
    } else {
      res.render("login", {
        showUser: true,
        message: "Wrong username or password", // Add a message for wrong username or password
      });
    }
  } catch (error) {
    // console.log("Error:", error); // Log the error for debugging purposes
    res.render("login", {
      showUser: true,
      message: "An error occurred. Please try again.", // Add a message for any other errors
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/home");
});

app.get('/user', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }
  res.render('account', {
    username: req.session.user.username,
  });
});


app.listen(port, () => console.log(`Listening at http://localhost:${port}`));