const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many export requests. Please wait.",
});

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`✅ Loaded ${envFile}`);
} else {
  console.warn(`⚠️ ${envFile} not found, using default .env`);
  dotenv.config();
}

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL?.trim(), "http://localhost:5173"],
    credentials: true,
  },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

const allowedOrigins = [
  process.env.FRONTEND_URL?.trim(),
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:8080"],
      },
    },
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  "/public",
  cors({ origin: process.env.FRONTEND_URL, credentials: true }),
  express.static(path.join(__dirname, "public"))
);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/invoice", require("./routes/invoice"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/export", exportLimiter, require("./routes/exportRoutes"));
app.use("/api", require("./routes/itemRoutes"));
app.use("/api/Chart", require("./routes/ChartRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/notifications", require("./routes/notificationsRoutes"));

app.get("/", (req, res) =>
  res.send(`✅ Server running in ${process.env.NODE_ENV} mode!`)
);

require("./services/sendWhatsAppBills");
const PORT = process.env.PORT || 8000;

server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`)
);
