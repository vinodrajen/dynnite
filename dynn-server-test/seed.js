const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/selforderkiosk";

// --- Schemas (must match server.js) ---

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

// --- Seed Data ---

// 100x100 orange PNG placeholder (visible image)
const placeholderImage = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA/klEQVR4nO3RMQ0AMAzAsPJHMLYtjOXw4T9SZt8sHfM7AEPSDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIkxJMaQGENiDIk5NMYJTCTSZTQAAAAASUVORK5CYII=",
  "base64"
);

const products = [
  {
    name: "Butter Chicken",
    desc: "Creamy tomato-based curry with tender chicken pieces",
    category: "Main Course",
    price: 280,
    time: 20,
    image: placeholderImage,
  },
  {
    name: "Paneer Tikka",
    desc: "Grilled cottage cheese marinated in spiced yogurt",
    category: "Starters",
    price: 220,
    time: 15,
    image: placeholderImage,
  },
  {
    name: "Masala Dosa",
    desc: "Crispy rice crepe filled with spiced potato filling",
    category: "South Indian",
    price: 120,
    time: 12,
    image: placeholderImage,
  },
  {
    name: "Mango Lassi",
    desc: "Sweet yogurt drink blended with fresh mango pulp",
    category: "Beverages",
    price: 80,
    time: 5,
    image: placeholderImage,
  },
  {
    name: "Gulab Jamun",
    desc: "Deep-fried milk dumplings soaked in sugar syrup",
    category: "Desserts",
    price: 100,
    time: 5,
    image: placeholderImage,
  },
  {
    name: "Garlic Naan",
    desc: "Soft flatbread topped with garlic and butter",
    category: "Breads",
    price: 60,
    time: 8,
    image: placeholderImage,
  },
  {
    name: "Chicken Biryani",
    desc: "Fragrant basmati rice layered with spiced chicken",
    category: "Main Course",
    price: 250,
    time: 25,
    image: placeholderImage,
  },
  {
    name: "Samosa",
    desc: "Crispy pastry filled with spiced potatoes and peas",
    category: "Starters",
    price: 40,
    time: 10,
    image: placeholderImage,
  },
];

// --- Run Seed ---

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await Admin.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared existing admins and products");

    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await Admin.create({ username: "admin", password: hashedPassword });
    console.log("Created admin user (username: admin, password: admin123)");

    // Insert sample products
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} sample products`);

    console.log("\nSeed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
