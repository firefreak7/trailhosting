const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); 
const multer = require("multer");
const app = express();

app.use(express.json());
app.use(cors());
app.use("/files", express.static("files"));

const mongoURI = "mongodb://dina:Dina_0987@ac-9ruu58i-shard-00-00.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-01.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-02.u74yfnc.mongodb.net:27017/?ssl=true&replicaSet=atlas-k42jhx-shard-0&authSource=admin&retryWrites=true&w=majority"; // Replace with your MongoDB Atlas connection string

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

// PDF Schema
const PdfSchema = mongoose.model("PdfDetails", {
  title: String,
  pdf: String,
});

// API Routes
app.post("/upload-files", upload.single("file"), async (req, res) => {
  console.log(req.file);
  const title = req.body.title;
  const fileName = req.file.filename;
  try {
    await PdfSchema.create({ title: title, pdf: fileName });
    res.send({ status: "ok" });
  } catch (error) {
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  try {
    const data = await PdfSchema.find({});
    res.send({ status: "ok", data: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error" });
  }
});

app.get("/", async (req, res) => {
    const htmlPath = path.join(__dirname, "index.html");
    console.log(htmlPath);
    // Send the HTML file
    res.sendFile(htmlPath);
});

app.listen(5000, () => {
  console.log("Server Started");
});
