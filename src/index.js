const express = require("express");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require("express-handlebars");
const async = require("hbs/lib/async");
const templatePath = path.join(__dirname, "resources/views");
const { shipper, user, vendor, product } = require("./mongodb");
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
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(function(username, password, done) {
    // Check username and password
    // Call done(err, user) with error or user object
  }));
  // Set up serialization and deserialization of user
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    // Retrieve user object from database using id
  });

app.get(["/", "/home"], (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home", { user: req.user });
  } else {
    res.render("home");
  }
});

app.get("/signup-user", (req, res) => {
  res.render("signup-user");
});

app.get("/add-product", (req, res) => {
  res.render("add-product");
});

app.get("/signup-vendor", (req, res) => {
  res.render("signup-vendor");
});

app.get("/signup-shipper", (req, res) => {
  res.render("signup-shipper");
});

app.get("/login", (req, res) => {
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
      const checkUser = await user.findOne({ username: req.body.username });
      const checkVendor = await vendor.findOne({ username: req.body.username });
      const checkShipper = await shipper.findOne({ username: req.body.username });
  
      if (checkUser && checkVendor && checkShipper) {
        const check = checkUser || checkVendor || checkShipper;
        if (await bcrypt.compare(req.body.password, check.password)) {
          res.render("home");
        } else {
          res.render("login", {
            showUser: true,
          });
        }
      } else {
        res.render("login", {
          showUser: true,
        });
      }
    } catch (err) {
      console.log(err);
      res.render("login", {
        showUser: true,
      });
    }
  });
  

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));
