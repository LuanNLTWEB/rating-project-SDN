const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const apiRoutes = require("./src/routes/api");
const path = require("path");
const startRankingCron = require("./src/cron/rankingCron");

dotenv.config();
connectDB();
startRankingCron();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(express.static("public"));