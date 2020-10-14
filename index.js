const express = require('express')
const bodyParser=require('body-parser');
const cors =require('cors');
const fs=require('fs-extra')
const fileUpload = require('express-fileupload');
const { ObjectID } = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sbjn6.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const app = express()
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cors());
app.use(express.static('service'));
app.use(fileUpload());
const client = new MongoClient(uri, { useNewUrlParser: true,useUnifiedTopology: 
    true });
client.connect(err => {
  const serviceCollection = client.db("agency").collection("services");
  const reviewCollection = client.db("agency").collection("reviews");
  const ordersCollection=client.db("agency").collection("orders");
  const adminCollection=client.db("agency").collection("admins");
  app.post('/addServices',(req,res)=>{
    const file=req.files.file;
    const title=req.body.title;
    const description=req.body.description;
    const filePath=`${__dirname }/service/${file.name}`
    file.mv(filePath,err=>{
      if(err){
        console.log(err)
         res.status(5000).send({msg:'failed'});
      }
      const newImg=fs.readFileSync(filePath);
      const enImg=newImg.toString('base64');
      var image={
        contentType:req.files.file.mimetype,
        size:req.files.file.size,
        img:Buffer(enImg,'base64')
      };
      serviceCollection.insertOne({title,description,image})
      .then(result=>{
        fs.remove(filePath,error=>{
          if(error){
            res.status(5000).send({msg:'failed'})
          }
          res.send(result.insertedCount>0);
        })
      })

    })
  })
  app.get('/services',(req,res)=>{
    serviceCollection.find({})
    .toArray((err,document)=>{
      res.send(document)
    })  
   })
   app.post('/addReview', (req,res)=>{
    const name=req.body.name;
    const description=req.body.description;
    const designation=req.body.designation;
    reviewCollection.insertOne({name,description,designation})
    .then(result=>{
      res.send(result.insertedCount>0)
    })
   })
   app.get('/services/:id',(req,res)=>{
    const id=req.params.id;
    serviceCollection.find({_id:ObjectID(id)})
    .toArray((err,document)=>{
      res.send(document[0])
      console.log(document[0])
    })  
   })
   app.post('/Addorders',(req,res)=>{
    const order=req.body;
    ordersCollection.insertOne(order)
    .then(result=>{
      res.send(result.insertedCount>0)
    })
  })
  app.get('/orders',(req,res)=>{
    ordersCollection.find({email:req.query.email})
    .toArray((err,document)=>{
      res.send(document)
    })  
   })
   app.post('/addAdmin', (req,res)=>{
    const email=req.body.email;
    adminCollection.insertOne({email})
    .then(result=>{
      res.send(result.insertedCount>0)
    })
   })
});
app.listen(process.env.PORT|| 5000)