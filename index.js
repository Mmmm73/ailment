const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const reportService = require('./routes/reportService');

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

app.post('/node/auth/signup', async (req, res) => {
  const { username, userpassword, usertype } = req.body;

  console.log("username", username);
  console.log("userpassword", userpassword);
  console.log("usertype", usertype);
  try {

    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    console.log("xxx1");
    console.log("existingUser.rows", existingUser.rows);

    if (existingUser.rows.length > 0) {
      console.log("xxx2");
      console.log('Username already in use');
      return res.status(400).json({ error: 'Username already in use' });
    } else {
      console.log("xxx3");
      const hashedPassword = await bcrypt.hash(userpassword, 10);

      const newUser = await pool.query(
        'INSERT INTO users (username, userpassword, usertype) VALUES ($1, $2, $3) RETURNING userid',
        [username, hashedPassword, usertype]
      );

      const userId = newUser.rows[0].userid;
//      const userJwtToken = jwt.sign({userId}, 'whistleblowing');

//      await pool.query('UPDATE users SET userjwt = $1 WHERE userid = $2', [userJwtToken,userId]);

      res.status(201).json({ message: 'Successful', usertype: usertype});
    }
    console.log("usertype xxx");
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
});


app.post('/node/auth/login', async (req, res) => {
  const { username, userpassword } = req.body;
  console.log('req.body', req.body.username, req.body.userpassword);
  const usertype = 'User';

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1 AND usertype = $2', [username, usertype]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const hashedPassword = user.rows[0].userpassword;

    const passwordMatch = await bcrypt.compare(userpassword, hashedPassword);

    const userId = user.rows[0].userid;

    if (passwordMatch) {
      const userJwtToken = jwt.sign({userId}, 'whistleblowing');

      await pool.query('UPDATE users SET userjwt = $1 WHERE userid = $2', [userJwtToken, userId]);

      return res.status(200).json({userJwtToken: userJwtToken });
    } else {
      return res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});


app.post('/node/auth/adminlogin', async (req, res) => {
  const { username, userpassword } = req.body;
  console.log('req.body', req.body.username, req.body.userpassword);
  console.log('userpassword, username', userpassword, username);
  const usertype = 'Administrator';

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1 and usertype = $2', [username, usertype]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    const hashedPassword = user.rows[0].userpassword;

    const passwordMatch = await bcrypt.compare(userpassword, hashedPassword);

    const userId = user.rows[0].userid;


    if (passwordMatch) {
      const userJwtToken = jwt.sign({userId}, 'whistleblowing');

      await pool.query('UPDATE users SET userjwt = $1 WHERE userid = $2', [userJwtToken, userId]);

      return res.status(200).json({userJwtToken: userJwtToken });
    } else {
      return res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'An error occurred during login' });
  }
});


app.post('/node/report/createreport', upload.array('file'), async (req, res) => {
  //refactor
  const { title, description, organization, county, userJwtToken } = req.body;
  console.log("title, description, organization, county, userJwtToken", title, description, organization, county, userJwtToken);
  
  try {

    const decodedToken = jwt.verify(userJwtToken, 'whistleblowing');
    console.log("decodedToken:", decodedToken);
    const userId = decodedToken.userId;
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

    console.log("hjkhkhkjhk");

    // Respond with success message
    return res.status(201).json({ message: 'Successful' });

  } catch (error) {
    console.error('Error inserting housing data and images:', error);
    return res.status(500).json({ error: 'Error inserting housing data and images' });
  }
});

app.post('/node/report/editreport', upload.array('file'), async (req, res) => {
  //refactor
  const { title, description, organization, county, reportid, removedfiles } = req.body;
  console.log("title, description, organization, county, reportid, removedfiles", title, description, organization, county, reportid, removedfiles);
  
  try {
    const updateQuery = 
    `UPDATE reports 
    SET reporttitle = $1, reportdescription = $2, reportorganization = $3, reportcounty = $4
    WHERE reportid = $5`;
    
    const updateValues = [title, description, organization, county, reportid];
    await pool.query(updateQuery, updateValues);

    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimeType: file.mimetype,
      dataurl: file.dataurl,
    }));

    console.log("uploadedFiles", uploadedFiles);
    console.log("uploadedFileslength", uploadedFiles.length);

    for (const file of uploadedFiles) {

      console.log("filex", file);
      console.log("file", file.path);
      console.log("file.dataurl", file.dataurl);
      const fileurl = "http://localhost:8000/"+file.filename
      console.log("fileurl:", fileurl);
      console.log("filemimetype:", file.mimeType);
      console.log("fileoriginalname:", file.originalName);
      console.log("reportId:", reportid);

      const fileInsertQuery = `
       INSERT INTO files (fileurl, filemimetype, fileoriginalname, filereportid)
      VALUES ($1, $2, $3, $4)`;
      const fileValues = [fileurl, file.mimeType, file.originalName, reportid];
      await pool.query(fileInsertQuery, fileValues);
    }
    
    for (const removedfile of JSON.parse(removedfiles)) {
      console.log("removedfile:", removedfile);
      console.log("removedfile.id:", removedfile.fileid);

      const deleteQuery = `DELETE FROM files WHERE fileid = $1`;
      const deleteValues = [removedfile.fileid];
      await pool.query(deleteQuery, deleteValues);
    }
    
    return res.status(201).json({ message: 'Successful' });

  } catch (error) {
    console.error('Error editing reports and files:', error);
    return res.status(500).json({ error: 'Error editing reports and files.' });
  }
});

app.delete('/node/report/deletereportbyreportid/:reportid', async (req, res) => {
  const reportid = req.params.reportid;
  console.log("reportid:", reportid);
  

  try {

    await pool.query('BEGIN');

    const deleteReportQuery = 'DELETE FROM reports WHERE reportid = $1';
    const deleteReportValues = [reportid];
    await pool.query(deleteReportQuery, deleteReportValues);

    const deleteReportFilesQuery = 'DELETE FROM files WHERE filereportid = $1';
    const deleteReportFilesValues = [reportid];
    await pool.query(deleteReportFilesQuery, deleteReportFilesValues);

    await pool.query('COMMIT');

    res.status(200).json({ message: 'Reports and associated files deleted successfully' });

  } catch (error) {
    
    console.error('Error deleting reports and associated files:', error);
    res.status(500).json({ error: 'Failed to delete reports and associated files.' });
  }
});

app.post('/node/report/getreportsbyuserid', async (req, res) => {
  const { localStorageToken } = req.body;
  console.log("localStorageToken:", localStorageToken);
  try {

    const reports = await reportService.getReportsByUserid(pool, localStorageToken);
   
    return res.status(200).json({ success: true, reports:reports });
  
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, error: 'Error fetching reports.' });
  }

});


app.post('/node/report/getreports', async (req, res) => {
  try {

    const reports = await reportService.getReports(pool);
   
    return res.status(200).json({ success: true, reports:reports });
  
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, error: 'Error fetching reports.' });
  }
});


app.post('/node/report/getreportsorderbynewest', async (req, res) => {
  try {

    const reports = await reportService.getreportsorderbynewest(pool);
  
    return res.status(200).json({ success: true, reports:reports });
  
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, error: 'Error fetching reports.' });
  }
});


app.post('/node/report/getreportsorderbyoldest', async (req, res) => {
  try {

    const reports = await reportService.getreportsorderbyoldest(pool);
   
    return res.status(200).json({ success: true, reports:reports });
  
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ success: false, error: 'Error fetching reports.' });
  }
});

app.post('/node/report/updatestatus', async (req, res) => {
  const { status, reportid } = req.body;
  console.log("status:", status, "reportid:", reportid);

  await reportService.updatereportstatus(pool, status, reportid);
   
  return res.status(200).json({ success: true });
  res.sendStatus(200); 
});


app.post('/node/report/getreportbyreportid', async (req, res) => {
  const { reportid } = req.body;
  console.log("reportid:", reportid);

  try {
    const reportQuery = 'SELECT * FROM reports WHERE reportid = $1';
    const reportResult = await pool.query(reportQuery, [reportid]);
    const reportDetails = reportResult.rows[0];

    console.log("reportDetails:", reportDetails);

    const fileQuery = 'SELECT * FROM files WHERE filereportid = $1';
    const fileResult = await pool.query(fileQuery, [reportid]);
    const fileDetails = fileResult.rows;

    reportDetails.files = fileDetails;

    const dirname = path.resolve();
    console.log("dirname", dirname);
    const fullfilepath = path.join(dirname, 'images/' + 'filename');
    console.log("fullfilepath", fullfilepath);

    return res.status(200).json({ reportDetails: reportDetails });
  } catch (error) {
    console.error('Error fetching report details:', error);
    return res.status(500).json({ error: 'Error fetching report details' });
  }
});



const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});