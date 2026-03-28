const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const multer = require("multer");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Models ---

const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    username: String,
    password: String,
  })
);

const Product = mongoose.model(
  "products",
  new mongoose.Schema({
    name: String,
    desc: String,
    category: String,
    image: Buffer,
    price: Number,
    time: Number,
  })
);

const Order = mongoose.model(
  "Order",
  new mongoose.Schema(
    {
      number: { type: Number, default: 0 },
      orderType: String,
      paymentType: String,
      tableno: String,
      isPaid: { type: Boolean, default: false },
      isReady: { type: Boolean, default: false },
      inProgress: { type: Boolean, default: false },
      isCanceled: { type: Boolean, default: false },
      isServed: { type: Boolean, default: false },
      isDelivered: { type: Boolean, default: false },
      itemsPrice: Number,
      taxPrice: Number,
      totalPrice: Number,
      orderItems: [
        {
          name: String,
          price: Number,
          quantity: Number,
        },
      ],
    },
    {
      timestamps: true,
    }
  )
);

// --- JWT Auth Middleware ---

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// --- Razorpay ---

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Auth Routes ---

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ message: "Login successful", isAdminLoggedIn: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/register", authMiddleware, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Product Routes ---

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    const products = await Product.find(category ? { category } : {});
    const productsWithBase64Image = products.map((product) => ({
      ...product._doc,
      image: product.image ? product.image.toString("base64") : null,
    }));
    res.json(productsWithBase64Image);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/products", authMiddleware, upload.single("image"), async (req, res) => {
  const { name, desc, price, time, category } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ message: "Name, price, and category are required" });
  }
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  try {
    const newProduct = new Product({
      name,
      desc,
      image: req.file.buffer,
      price: Number(price),
      time: time ? Number(time) : undefined,
      category,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.put("/api/products/:id", authMiddleware, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, price, desc, time, category } = req.body;

  try {
    const updatedProductData = { name, desc, price, time, category };

    if (req.file) {
      updatedProductData.image = req.file.buffer;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updatedProductData,
      { new: true }
    );

    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (deleted) {
      return res.json({ message: "Deleted an item" });
    }
    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// --- Order Routes ---

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find({ isDelivered: false, isCanceled: false });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/all-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/orders", async (req, res) => {
  if (
    !req.body.orderType ||
    !req.body.paymentType ||
    !req.body.orderItems ||
    req.body.orderItems.length === 0
  ) {
    return res.status(400).json({ message: "orderType, paymentType, and orderItems are required" });
  }

  try {
    const lastOrder = await Order.find().sort({ number: -1 }).limit(1);
    const lastNumber = lastOrder.length === 0 ? 0 : lastOrder[0].number;

    const { orderType, paymentType, tableno, orderItems } = req.body;

    const itemsPrice = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const taxPrice = Math.round(0.05 * itemsPrice * 100) / 100;
    const totalPrice = Math.round((itemsPrice + taxPrice) * 100) / 100;

    const order = await new Order({
      number: lastNumber + 1,
      orderType,
      paymentType,
      tableno,
      isPaid: false,
      isReady: false,
      inProgress: true,
      isCanceled: false,
      isServed: false,
      isDelivered: false,
      itemsPrice,
      taxPrice,
      totalPrice,
      orderItems,
    }).save();

    // Broadcast the new order to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(order));
      }
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { action, isServed, isDelivered } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Handle action-based updates (from kitchen screen)
    if (action === "ready") {
      order.isReady = true;
      order.inProgress = false;
    } else if (action === "cancel") {
      order.isCanceled = true;
      order.inProgress = false;
    } else if (action === "deliver") {
      order.isDelivered = true;
      order.inProgress = false;
    } else if (action === "serve") {
      order.isServed = true;
    }

    // Handle direct field updates (from admin screen)
    if (isServed !== undefined) {
      order.isServed = isServed;
    }
    if (isDelivered !== undefined) {
      order.isDelivered = isDelivered;
    }

    await order.save();

    // Broadcast the updated order to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(order));
      }
    });

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// --- Payment Routes ---

app.post("/api/initiate-payment", async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "A valid positive amount is required" });
  }

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now(),
    payment_capture: 1,
  };

  try {
    razorpay.orders.create(options, (err, order) => {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ error: "Payment initiation failed" });
      }
      res.json({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error initiating payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/capture-payment", async (req, res) => {
  const { paymentId, orderId, signature } = req.body;

  if (!paymentId || !orderId || !signature) {
    return res.status(400).json({ message: "paymentId, orderId, and signature are required" });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error capturing payment:", error);
    res.status(500).json({ success: false });
  }
});

// --- Start Server ---

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`Server running at Port ${port}`);
});

// --- WebSocket Server ---

const wss = new WebSocket.Server({ server });

wss.on("connection", (socket) => {
  console.log("WebSocket connection established");

  // Send initial orders data to the connected client
  Order.find({ isDelivered: false, isCanceled: false }).then((orders) => {
    socket.send(JSON.stringify(orders));
  });

  socket.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);
      const { orderId, action, isServed, isDelivered } = parsed;

      if (!orderId) return;

      Order.findById(orderId).then((order) => {
        if (!order) return;

        if (action === "ready") {
          order.isReady = true;
          order.inProgress = false;
        } else if (action === "cancel") {
          order.isCanceled = true;
          order.inProgress = false;
        } else if (action === "deliver") {
          order.isDelivered = true;
          order.inProgress = false;
        } else if (action === "serve") {
          order.isServed = true;
        }

        if (isServed !== undefined) order.isServed = isServed;
        if (isDelivered !== undefined) order.isDelivered = isDelivered;

        order.save().then((updatedOrder) => {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(updatedOrder));
            }
          });
        });
      });
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });
});
