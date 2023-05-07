const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require('express-handlebars');
const async = require("hbs/lib/async");
const templatePath = path.join(__dirname,'resources/views')
const collection = require("./mongodb");
const { error } = require("console");
const bcrypt = require('bcrypt');
// const publicPath = path.join(__dirname, "/public");

// app.use(express.static(publicPath));


app.engine('handlebars', handlebars.engine({
    extname:'.hbs'
}));

app.use(express.json());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));


app.get("/",(req,res) => {
    res.render("login")
})

app.get("/signup",(req,res) => {
    res.render("signup")
})

app.post("/signup",async (req,res) => {
    try{
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const data={
            username:req.body.username,
            password:hashedPassword,
            name:req.body.name,
            address:req.body.address,
        }
        await collection.insertMany([data]);
    
        res.render("login");
        
    }

    catch{
        console.log("error")
    }


})

app.post("/login",async (req,res) => {
    try{
        const check = await collection.findOne({username:req.body.username})
        console.log(`find it`);
        console.log(req.body.password);

        if (await bcrypt.compare(req.body.password, check.password)){
            res.render("home")
        }
        else{
            res.send("Wrong password");
        }
        
        console.log(check);
        console.log(req.body.password);
    }

    catch{
        res.send("Wrong passwords or username");
    }

    res.render("home")
})

app.listen(port, () => console.log(`Listening at http://localhost:${port}`));

