import express from "express";
import "dotenv/config";
import connectDB from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import cors from "cors";

//MongoDB DNS Lookup issue(default was Windows, we set it to open DNS)
import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://retailkart.netlify.app"],
    credentials: true,
  }),
);

//Sample Route: http://localhost:8000/api/v1/user/register
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/cart", cartRoute);

app.listen(PORT, () => {
  connectDB();
  console.log("Server is running at PORT:", PORT);
});
