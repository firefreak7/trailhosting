// index.js

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Import the path module
const stream = require('stream');


const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const dbUrl =
  'mongodb://dina:Dina_0987@ac-9ruu58i-shard-00-00.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-01.u74yfnc.mongodb.net:27017,ac-9ruu58i-shard-00-02.u74yfnc.mongodb.net:27017/Jobboard?ssl=true&replicaSet=atlas-k42jhx-shard-0&authSource=admin&retryWrites=true&w=majority';

const connectionp = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const fileSchema = new mongoose.Schema({
  fileName: String,
  fileData: Buffer,
});

const User = mongoose.model('User', userSchema);
const File = mongoose.model('File', fileSchema);

mongoose.connect(dbUrl, connectionp);
const db = mongoose.connection;

db.on('error', () => console.log('error in connecting'));
db.once('open', () => console.log('connected successfully'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'index.html'));
});


app.listen(3000, () => {
  console.log('Listening on port 3000');
});

// Setup Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create a new File document
  const newFile = new File({
    fileName: file.originalname,
    fileData: file.buffer,
  });

  // Save the file to MongoDB Atlas using promises
  newFile.save()
    .then(savedFile => {
      console.log('File saved successfully:', savedFile);

      // Display the binary/BSON code of the uploaded PDF in the console
      console.log('Binary/BSON code of the uploaded PDF:', file.buffer.toString('base64'));

      res.status(200).send('File uploaded successfully.');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error saving file to database.');
    });
});

app.get('/download', async (req, res) => {
  try {
    const fileName = req.query.fileName;

    if (!fileName) {
      return res.status(400).send('Please provide a file name for download.');
    }

    // Find the file in the database based on the provided file name
    const file = await File.findOne({ fileName });

    if (!file) {
      return res.status(404).send('File not found for download.');
    }

    // Create a readable stream from the file data
    const fileStream = new stream.PassThrough();
    fileStream.end(file.fileData);

    // Set the response headers for download
    res.setHeader('Content-disposition', 'attachment; filename=' + file.fileName);
    res.setHeader('Content-type', 'application/pdf');

    // Pipe the file stream to the response
    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error downloading file.');
  }
});

app.get('/pdfs', async (req, res) => {
  try {
    // Fetch all uploaded PDFs from the database
    const pdfs = await File.find({}, { fileName: 1, _id: 0 }); // Projection to only retrieve fileName

    res.json(pdfs);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching PDFs.');
  }
});
