const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(express.static(__dirname + '/uploads'));
const uploadsFolder = path.join(__dirname, 'uploads');

// Ensure that the "uploads" folder exists
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whistleblowing',
  password: 'Melvin',
  port: 5432,
});

app.use(cors());
app.use(express.json());
/////////////////


//const express = require('express');
//const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const formData = require('express-form-data');
//const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(formData.parse()); // Parse form data
app.use(formData.format());
app.use(formData.stream());
app.use(formData.union());



app.get('/message', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

app.use('/node/auth', authRoutes);

app.use('/node/report', reportRoutes);

app.post('/node/report/createreport', upload.array('file'), async (req, res) => {
  const { title, description, organization, county, userJwtToken } = req.body;
  console.log("title, description, organization, county, userJwtToken", title, description, organization, county, userJwtToken);
  
  try {

    const decodedToken = jwt.verify(userJwtToken, 'whistleblowing');
    const userId = decodedToken.userid;
    console.log("userIdxx", userId);

    const reportInsertQuery = `
      INSERT INTO reports (reporttitle, reportdescription, reportorganization, reportcounty, reportuserid)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING reportid`;
    const reportValues = [title, description, organization, county, userId];
    const reportResult = await pool.query(reportInsertQuery, reportValues);
    const reportId = reportResult.rows[0].reportid;
    console.log("reportId:", reportId);

    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      dataurl: file.dataurl,
    }));

    for (const file of uploadedFiles) {
      console.log("filex", file);
      console.log("file", file.path);
      console.log("file.dataurl", file.dataurl);
      const fileurl = "http://localhost:8000/"+file.filename
      console.log("fileurl:", fileurl);
      console.log("filemimetype:", file.mimeType);
      console.log("fileoriginalname:", file.originalName);
      console.log("userId:", userId);
      console.log("reportId:", reportId);

      const fileInsertQuery = `
       INSERT INTO files (fileurl, filemimetype, fileoriginalname, fileuserid, filereportid)
      VALUES ($1, $2, $3, $4, $5)`;
      const fileValues = [fileurl, file.mimeType, file.originalName, userId, reportId];
      await pool.query(fileInsertQuery, fileValues);
    }

    // Respond with success message
    return res.status(201).json({ message: 'Successful' });

  } catch (error) {
    console.error('Error inserting housing data and images:', error);
    return res.status(500).json({ error: 'Error inserting housing data and images' });
  }
});



module.exports = app;
