const express = require("express");
const app = express();
const path = require("path");
const port = 3000;
const handlebars = require('express-handlebars');
const async = require("hbs/lib/async");
const templatePath = path.join(__dirname,'resources/views')
const user = require("./mongodb-user");
const { error } = require("console");
const bcrypt = require('bcrypt');
const publicPath = path.join(__dirname, "/public");



app.engine('handlebars', handlebars.engine({
    extname:'.hbs'
}));
app.use(express.static(publicPath));
app.use(express.json());
app.set("view engine", "handlebars");
app.set("views", templatePath);
app.use(express.urlencoded({extended:false}));


app.get("/",(req,res) => {
    res.render("login")
})

app.get("/signup-user",(req,res) => {
    res.render("signup-user")
})

app.post("/signup-user",async (req,res) => {
    try{
        const check = await user.findOne({username:req.body.username})

        if (check){
            res.json('username already existed!')
        }
        else{
            try{
                const salt = await bcrypt.genSalt();
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                const data={
                    username:req.body.username,
                    password:hashedPassword,
                    name:req.body.name,
                    address:req.body.address,
                }
                await user.insertMany([data]);
            
                res.render("login");
                
            }
        
            catch{
                console.log("error 1 ")
            }
        
        }

    }
    catch{
        console.log("error 2 ")
    }

})

app.post("/login",async (req,res) => {
    try{
        const check = await user.findOne({username:req.body.username})
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

