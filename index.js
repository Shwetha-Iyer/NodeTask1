const express = require("express");
const mongodb = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.port || 3000;
const mongoClient = mongodb.MongoClient;
app.use(express.json());
const dbURL = process.env.DB_URL;
const objectId = mongodb.ObjectID;

// initial page
app.get("/",(req,res)=>{
    res.status(200).send("Hello there!<br> Access /student for all student details <br> Access /mentor for all mentor details");
});


//get all details of all students
app.get("/student",async(req,res)=>{
    try{
        let client = await mongoClient.connect(dbURL);
        let db = client.db("myDB");
        let data = await db.collection("student").find().toArray();
        if(data)
        res.status(200).json(data);
        else
        res.status(404).send("Oops! Something went wrong");
        client.close();
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message:"Internal Server Error"
        });
    }
});

// get all details of all mentor
app.get("/mentor",async(req,res)=>{
    try{
        let client = await mongoClient.connect(dbURL);
        let db = client.db("myDB");
        let data = await db.collection("mentor").find().toArray();
        if(data)
        res.status(200).json(data);
        else
        res.status(404).send("Oops! Something went wrong");
        client.close();
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message:"Internal Server Error"
        });
    }
});
//create a Mentor
app.post("/create-mentor",async(req,res)=>{
    try{
        let client = await mongoClient.connect(dbURL);
        let db = client.db("myDB");
        let check = await db.collection("mentor").insertOne(req.body);
        if(check.ops){
            res.status(200).json({
                message:"Mentor added Successfully"
            });
        }
        else{
            res.status(400).json({
                message:"Oops! Something went wrong!"
            });
        }
        client.close();
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message:"Internal Server Error"
        });
    }
});

//create a student
app.post("/create-student",async(req,res)=>{
    try{
        let client = await mongoClient.connect(dbURL);
        let db = client.db("myDB");
        let check = await db.collection("student").insertOne(req.body);
        if(check.ops){
            res.status(200).json({
                message:"Student added Successfully"
            });
        }
        else{
            res.status(400).json({
                message:"Oops! Something went wrong!"
            });
        }
        client.close();
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message:"Internal Server Error"
        });
    }
});

//show all students of a mentor
app.get("/mentor/:id",async(req,res)=>{
    if(req.params.id.length===24){
        try{
            let client = await mongoClient.connect(dbURL);
            let db = client.db("myDB");
            let data = await db.collection("mentor").findOne({_id:objectId(req.params.id)});
            console.log(data);
            if(data){
                res.status(200).send(data);
            }
            else{
                res.status(404).send("This mentor does not exist");
            }
            client.close();
        }
        catch(error){
            console.log(error);
            res.status(500).json({
                message:"Internal Server Error!"
            });
        }
    }
    else{
        res.status(403).send("You have given an invalid ID");
    }
    
});

app.put("/assign-change-mentor/:id",async (req,res)=>{
    if(req.params.id.length===24&&req.body.mentor.length===24){
        try{
            let client = await mongoClient.connect(dbURL);
            let db = client.db("myDB");
            let student_check = await db.collection("student").findOne({_id:objectId(req.params.id)});
            let mentor_check = await db.collection("mentor").findOne({_id:objectId(req.body.mentor)});
            if(student_check && mentor_check){
                if(student_check.mentor){
                    console.log("some mentor is already assigned");
                    if(req.body.mentor == student_check.mentor){
                        console.log("Same mentor nothing is changed");
                        res.status(202).send("Same mentor nothing is changed");
                    }
                    else{
                        console.log("mentor is different");
                        var old_m_id = student_check.mentor;
                        await db.collection("student").updateOne({_id:objectId(req.params.id)},{$set:{mentor:req.body.mentor}});
                        if(mentor_check.student){
                            console.log("some student already assigned");
                            await db.collection("mentor").updateOne({_id:objectId(req.body.mentor)},{$push:{student:req.params.id}});
                        }
                        else{
                            console.log("no student  assigned");
                            await db.collection("mentor").updateOne({_id:objectId(req.body.mentor)},{$set:{student:[req.params.id]}});
                        }
                        await db.collection("mentor").updateOne({_id:objectId(old_m_id)},{$pull:{student:req.params.id}});
                        res.status(200).send("Assigned! if");
                    }
                   
                }
                else{
                    console.log("no mentor assigned");
                    await db.collection("student").updateOne({_id:objectId(req.params.id)},{$set:req.body});
                    if(mentor_check.student){
                        console.log("some student already assigned");
                        await db.collection("mentor").updateOne({_id:objectId(req.body.mentor)},{$push:{student:req.params.id}});
                    }
                    else{
                        console.log("no student  assigned");
                        await db.collection("mentor").updateOne({_id:objectId(req.body.mentor)},{$set:{student:[req.params.id]}});
                    }
                    res.status(200).send("Assigned! else");
                }
                
            }
            else{
                res.status(404).send("Either mentor id or student id does not exist!");
            }
            client.close();
        }
        catch(error){
            console.log(error);
            res.status(500).json({
                message:"Internal Server Error"
            });
        }
    }
    else{
        res.status(401).send("Either mentor id or student id is invalid!");
    }
    
});

// assign a student to a mentor
app.get("/students-nomentor",async(req,res)=>{
    try {
        let client = await mongoClient.connect(dbURL);
        let db = client.db("myDB");
        let data = await db.collection("student").find({mentor:{$exists:false}}).toArray();
        if (data) {
            if(data.length>0)
            res.status(200).json(data);
            else
            res.status(404).send("No data found or all studends have a mentor assigned!")
        } 
        else {
            res.status(404).json({
                message: "Something is wrong! Data not found!",
            });
        }
        client.close();
    } 
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

app.put("/assign-students-to-mentor/:id",async(req,res)=>{
    console.log(req.params);
    console.log(req.body.student);
    var sid_check=-1;
    for(let i=0;i<req.body.student.length;i++){
        if(req.body.student[i].length!==24){
            sid_check=0;
            break;
        }
        else
            sid_check=1;
    }
    if(req.params.id.length===24&&sid_check){
        try{
            let client = await mongoClient.connect(dbURL);
            let db = client.db("myDB");
            let mentor_check= await db.collection("mentor").findOne({_id:objectId(req.params.id)});
            console.log(mentor_check);
            var student_check=1;
            for(var i=0;i<req.body.student.length;i++){
                var check = await db.collection("student").findOne({_id:objectId(req.body.student[i])});
                if(check) student_check = student_check && 1;
                else student_check = student_check && 0;
            }
            var result="";
            if(mentor_check && student_check){
                if(mentor_check.student){
                    console.log("some students assigned"); 
                    await db.collection("mentor").updateOne({_id:objectId(req.params.id)},{$push:{student:{$each:req.body.student}}});
                }
                else{
                    console.log("students not assigned");
                    await db.collection("mentor").updateOne({_id:objectId(req.params.id)},{$set:{student:req.body.student}});
                    console.log("mentor updated");
                }
                for(var i=0;i<req.body.student.length;i++){
                    var sid = req.body.student[i];
                    await db.collection("student").updateOne({_id:objectId(sid)},{$set:{mentor:req.params.id}});
                    result+="Added student"+sid;
                    console.log("Student added",sid);
                }
                var output="Students added to mentor!<br> And mentor added to student"+result;
                res.status(200).send(output);
                client.close();
            }
            else{
                res.status(404).send("Please check the student and Mentor IDs. One or more student ID or Mentor ID is not found!");
            }
            client.close();
        }
        catch (error) {
            console.log(error);
            res.status(500).json({
                message: "Internal Server Error",
            });
        }
    }
    else{
        res.status(400).send("Either mentor id or any of the student ID is invalid!");
    }
    
});
app.listen(port, () => console.log("App index.js inside Task is running on port:", port));