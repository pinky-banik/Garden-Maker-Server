const express = require ("express");
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const { MongoClient, ServerApiVersion} = require('mongodb');


const app = express();
const PORT = process.env.PORT || 4000;


//middleware/

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5f7tq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run (){
    try{
        await client.connect();
        console.log('database connected successfully');
        const database = client.db("Manufacturer");
        const toolsCollection = database.collection('Tools');
        const userCollection = database.collection('Users');
        const profileCollection = database.collection('Profile');

        //users.collection

        app.get("/user",async(req,res)=>{
            const users= await userCollection.find().toArray();
            res.send(users);
        })

        app.delete("/user/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id : ObjectId(id)};
            const result= await userCollection.deleteOne(filter);
            res.send(result);
        })
        

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            // const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); 
            // res.send({ result,token});
            res.send(result);
        })

        
        //Admin Api



        app.put('/user/admin/:email',async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
              $set: {role:'admin'}, //here we set a role for admins
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send({ result});
          })


          app.get('/admin/:email',async(req,res)=>{
            const email = req.params.email;
            const query = {email:email};
            const user = await userCollection.findOne(query);
            const isAdmin = user.role ==='admin';
            res.send({admin : isAdmin})
        })














        // tools

        app.get('/tools',async(req,res)=>{
            const query={};
            const cursor = toolsCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.post('/tools', async (req, res) => {
            const tools = req.body;
            const result = await toolsCollection.insertOne(tools);
            res.send(result);
        });
        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const updateTools = req.body;
            const filter ={_id : ObjectId(id)};
            const options={upsert:true};
            const updatedDoc ={
                $set:{
                    name : updateTools.name,
                    price : updateTools.price,
                    img : updateTools.img,
                    details : updateTools.details,
                    catagory : updateTools.catagory,
                    // or just - updateTools
                }
            };
            const result = await toolsCollection.updateOne(filter,updatedDoc,options);
            res.send(result);
        });

        app.delete('/tools/:name', async (req, res) => {
            const name = req.params.name;
            const filter ={name:name};
            const result = await toolsCollection.deleteOne(filter);
            res.send(result);
        });
        app.get('/tools/:catagory', async (req, res) => {
            const catagory = req.params.catagory;
            const filter ={catagory:catagory};
            const cursor = toolsCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/tools/product/:name', async (req, res) => {
            const name = req.params.name;
            const filter ={name:name};
            const result = await toolsCollection.findOne(filter);
            res.send(result);
        });
    }
    finally{

    }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('Hello World!')
});

app.listen(PORT, ()=>console.log(`server is running on Port ${PORT}`)) 