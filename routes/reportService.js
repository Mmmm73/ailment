const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const getReportsByUserid = async (db, localStorageToken) => {
  try {

    const decodedToken = jwt.verify(localStorageToken, 'whistleblowing');
    console.log("decodedToken:", decodedToken);
    const userId = decodedToken.userId;
    console.log("userIdxx", userId);
  
    const reportsQuery = 'SELECT * FROM reports WHERE reportuserid = $1 ORDER BY reporttimecreated ASC';
    const reportsValues = [userId];
    const reportsResult = await db.query(reportsQuery, reportsValues);
    const reports = reportsResult.rows;

    console.log("reports: ", reports);

    return reports;
  } catch (error) {
    throw new Error('Error.');
  }
};

const getReports = async (db) => {
  try {
  
    const reportsQuery = 'SELECT * FROM reports  ORDER BY reporttimecreated ASC';
    const reportsResult = await db.query(reportsQuery);
    const reports = reportsResult.rows;

    console.log("reports: ", reports);

    return reports;
  } catch (error) {
    throw new Error('Error.');
  }
};

const getreportsorderbynewest = async (db) => {
  try {
  
    const reportsQuery = 'SELECT * FROM reports  ORDER BY reporttimecreated DESC';
    const reportsResult = await db.query(reportsQuery);
    const reports = reportsResult.rows;

    console.log("xxxx 3333");

    console.log("reports: ", reports);

    console.log("xxxx 4444");

    return reports;
  } catch (error) {
    throw new Error('Error.');
  }
};

const getreportsorderbyoldest = async (db) => {
  try {
  
    const reportsQuery = 'SELECT * FROM reports  ORDER BY reporttimecreated ASC';
    const reportsResult = await db.query(reportsQuery);
    const reports = reportsResult.rows;

    console.log("reports: ", reports);

    return reports;
  } catch (error) {
    throw new Error('Error.');
  }
};


const updatereportstatus = async (pool, status, reportid) => {
  try {
    const query = 'UPDATE reports SET reportstatus = $1 WHERE reportid = $2';

    await pool.query(query, [status, reportid]);

    console.log(`Report status updated successfully for report ID ${reportid}`);

    return { success: true };
  } catch (error) {
    // Log any errors
    console.error('Error updating report status:', error);
    throw error; // Rethrow the error for handling in the caller
  }
}



module.exports = {
    getReportsByUserid, getReports, getreportsorderbyoldest, getreportsorderbynewest, updatereportstatus
};
