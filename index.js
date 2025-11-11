require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// ---------------- Middleware ----------------
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(fileUpload());
app.use(express.static('service'));
app.use(express.static('reviews'));

// ---------------- MongoDB Setup ----------------
// IMPORTANT: Make sure to set MONGODB_URI in your .env file
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('ERROR: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

const client = new MongoClient(uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
});

async function startServer() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    
    // Verify connection
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connected successfully!");

    const db = client.db("creative_agency");
    const serviceCollection = db.collection("services");
    const reviewCollection = db.collection("reviews");
    const ordersCollection = db.collection("orders");
    const adminCollection = db.collection("admins");

    // ---------------- Routes ----------------

    // Add service
    app.post('/addServices', async (req, res) => {
      try {
        const file = req.files.file;
        const { title, description } = req.body;
        const enImg = file.data.toString('base64');
        const image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(enImg, 'base64')
        };
        const result = await serviceCollection.insertOne({ title, description, image });
        res.send(result.insertedCount > 0);
      } catch (err) {
        console.error('Error adding service:', err);
        res.status(500).send(err.message);
      }
    });

    // Get all services
    app.get('/services', async (req, res) => {
      try {
        const services = await serviceCollection.find({}).toArray();
        res.send(services);
      } catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).send(err.message);
      }
    });

    // Get single service by ID
    app.get('/services/:id', async (req, res) => {
      try {
        const service = await serviceCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(service);
      } catch (err) {
        console.error('Error fetching service:', err);
        res.status(500).send(err.message);
      }
    });

    // Add review
    app.post('/addReview', async (req, res) => {
      try {
        const file = req.files.file;
        const { name, description, designation } = req.body;
        const enImg = file.data.toString('base64');
        const image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(enImg, 'base64')
        };
        const result = await reviewCollection.insertOne({ name, description, designation, image });
        res.send(result.insertedCount > 0);
      } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).send(err.message);
      }
    });

    // Get all reviews
    app.get('/reviews', async (req, res) => {
      try {
        const reviews = await reviewCollection.find({}).toArray();
        res.send(reviews);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send(err.message);
      }
    });

    // Add order
    app.post('/Addorders', async (req, res) => {
      try {
        const result = await ordersCollection.insertOne(req.body);
        res.send(result.insertedCount > 0);
      } catch (err) {
        console.error('Error adding order:', err);
        res.status(500).send(err.message);
      }
    });

    // Get orders by email
    app.get('/orders', async (req, res) => {
      try {
        const orders = await ordersCollection.find({ email: req.query.email }).toArray();
        res.send(orders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).send(err.message);
      }
    });

    // Get all orders
    app.get('/orderList', async (req, res) => {
      try {
        const orders = await ordersCollection.find({}).toArray();
        res.send(orders);
      } catch (err) {
        console.error('Error fetching order list:', err);
        res.status(500).send(err.message);
      }
    });

    // Add admin
    app.post('/addAdmin', async (req, res) => {
      try {
        const { email } = req.body;
        const result = await adminCollection.insertOne({ email });
        res.send(result.insertedCount > 0);
      } catch (err) {
        console.error('Error adding admin:', err);
        res.status(500).send(err.message);
      }
    });

    // Get all admins
    app.get('/admins', async (req, res) => {
      try {
        const admins = await adminCollection.find({}).toArray();
        res.send(admins);
      } catch (err) {
        console.error('Error fetching admins:', err);
        res.status(500).send(err.message);
      }
    });

    // Update order status
    app.patch("/update/:id", async (req, res) => {
      try {
        const result = await ordersCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { status: req.body.status } }
        );
        res.send(result.modifiedCount > 0);
      } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).send(err.message);
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running' });
    });

    // ---------------- Start server ----------------
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  await client.close();
  process.exit(0);
});

startServer();