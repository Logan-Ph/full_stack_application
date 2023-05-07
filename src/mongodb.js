const mongoose = require("mongoose");


mongoose.connect("mongodb+srv://s3978387:bull1001@cluster0.uuhro1a.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log("mongodb connected");
})
.catch (()=> {
    console.log("failed to connect");
})

const LogInSchema = new mongoose.Schema({
    name:{
        type:String,
        require:true,
    },

    password:{
        type:String,
        require:true,
    }
})

const collection = new mongoose.model("LogInCollection",LogInSchema)

module.exports = collection