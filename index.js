const express = require ("express");
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const { MongoClient, ServerApiVersion} = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();
const PORT = process.env.PORT || 5000;


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
        const blogsCollection = database.collection('Blogs');
        const reviewCollection = database.collection('Review');
        const profileCollection = database.collection('Profile');
        const ordersCollection = database.collection('Orders');
        const paymentCollection = database.collection('Payments');
        const messageCollection = database.collection('messages');

        //orders collection and payment method

        app.get("/orders",async(req,res)=>{
            const orders= await ordersCollection.find().toArray();
            res.send(orders);
        })

        
        app.get("/orders/:email",async(req,res)=>{
            const email = req.params.email;
            const filter ={email:email};
            const orders= await ordersCollection.find(filter).toArray();
            res.send(orders);
        })

        app.delete("/orders/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id:ObjectId(id)};
            const result= await ordersCollection.deleteOne(filter);
            res.send(result);
        })

        app.put('/orders', async (req, res) => {
            const email = req.query.email;
            const productName = req.query.productName;
            const order = req.body;
            const filter = { 
                email: email,
                productName : productName,
             };
            const options = { upsert: true };
            const updateDoc = {
              $set: order,
            };
            const result = await ordersCollection.updateOne(filter, updateDoc, options);
            // const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); 
            // res.send({ result,token});
            res.send(result);
        })
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const order = req.body;
            const filter = { 
                _id: (ObjectId(id)),
             };
            const updateDoc = {
              $set: {
                paymentStatus: "complete",
                transecionId : order.transecionId,
              },
            };
            const payments = await paymentCollection.insertOne(payment);
            const result = await ordersCollection.updateOne(filter, updateDoc);
            // const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); 
            // res.send({ result,token});
            res.send(updateDoc);
        });

        //client get with email api
        app.get('/orders/email/productName', async (req, res)=>{
            let query = {}
           const email = req.query.email;
           const productName = req.query.productName;
           if(email){
                query = {
                    email : email,
                    productName : productName,
                };
           }
            const result =await ordersCollection.findOne(query);
            res.send(result);
        });
        


        app.get("/paymentOrder/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id:ObjectId(id)};
            const result= await ordersCollection.findOne(filter);
            res.send(result);
        })

        // app.post('/orders', async (req, res) => {
        //     const order = req.body;
        //     const result = await ordersCollection.insertOne(order);
        //     // const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }); 
        //     // res.send({ result,token});
        //     res.send(result);
        // })
        


        // create payment-intent api
        
        app.post("/create-payment-intent", async (req, res) => {
            const service  = req.body;
            const price = service.price;
            const amount = price*100;
          
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: "usd",
              payment_method_types:['card'],
            //   automatic_payment_methods: {
            //     enabled: true,
            //   },
            });
          
            res.send({
              clientSecret: paymentIntent.client_secret,
            });
          });

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
       
        //messages

        app.post('/message', async (req, res) => {
            const message = req.body;
            const result = await messageCollection.insertOne(message);
            res.send(result);
        });


        app.get('/message', async (req, res) => {
            const message = await messageCollection.find().toArray();
            res.send(message);
        });

        app.delete("/message/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id : ObjectId(id)};
            const result= await messageCollection.deleteOne(filter);
            res.send(result);
        })
        
        //review

        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });


        app.get('/review', async (req, res) => {
            const review = await reviewCollection.find().toArray();
            res.send(review);
        });

        app.delete("/review/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id : ObjectId(id)};
            const result= await reviewCollection.deleteOne(filter);
            res.send(result);
        })

        //blogs

        app.post('/blog', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });


        app.get('/blog', async (req, res) => {
            const blog = await blogsCollection.find().toArray();
            res.send(blog);
        });

        app.delete("/blog/:id",async(req,res)=>{
            const id = req.params.id;
            const filter ={_id : ObjectId(id)};
            const result= await blogsCollection.deleteOne(filter);
            res.send(result);
        })



        app.put('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const updateBlog = req.body;
            const filter ={_id : ObjectId(id)};
            const options={upsert:true};
            const updatedDoc ={
                $set:{
                    title : updateBlog.title,
                    details : updateBlog.details,
                    img : updateBlog.img,
                    date : updateBlog.date,
                }
            };
            const result = await blogsCollection.updateOne(filter,updatedDoc,options);
            res.send(result);
        });
        

        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const filter ={_id:ObjectId(id)};
            const result = await blogsCollection.findOne(filter);
            res.send(result);
        });

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
                    pricePerUnit: updateTools.pricePerUnit,
                    minOrderQuantity :updateTools.minOrderQuantity,
                    availableQuantity : updateTools.availableQuantity,
                    img : updateTools.img,
                    details : updateTools.details,
                    catagory : updateTools.catagory,
                    // or just - updateTools
                }
            };
            const result = await toolsCollection.updateOne(filter,updatedDoc,options);
            res.send(result);
        });

        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const filter ={_id:ObjectId(id)};
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
        //history
        app.get('/history',async(req,res)=>{
            const query={};
            const cursor = paymentCollection.find(query);
            const payments = await cursor.toArray();
            res.send(payments);
        })
        app.get('/myhistory/:email', async (req, res) => {
            const email = req.params.email;
            const filter ={email:email};
            const cursor = paymentCollection.find(filter);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.delete('/history/:id', async (req, res) => {
            const id = req.params.id;
            const filter ={_id:ObjectId(id)};
            const result = await paymentCollection.deleteOne(filter);
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