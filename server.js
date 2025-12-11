const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'nathir26#',
  database: 'report',
  port: 3306
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    connection.release();
    res.json({ success: true, message: 'Database connection successful', data: rows });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Check if daily_summary2 table exists
app.get('/check-table', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT 
        TABLE_NAME 
      FROM 
        INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = 'report' 
        AND TABLE_NAME = 'daily_summary2'`);
    connection.release();
    
    if (rows.length > 0) {
      res.json({ exists: true, message: 'Table exists' });
    } else {
      res.status(404).json({ exists: false, message: 'Table does not exist' });
    }
  } catch (error) {
    console.error('Error checking table:', error);
    res.status(500).json({ success: false, message: 'Error checking table', error: error.message });
  }
});

// API endpoint to fetch data
app.get('/api/:table/:period', async (req, res) => {
  const { table, period } = req.params;
  let query;
  
  try {
    // Validate table name to prevent SQL injection
    const validTables = [
      'rides_summary',
      'daily_summary', 'daily_summary2', 'driver_performance', 'city_report', 
      'customer_metrics', 'service_quality', 'payment_summary',
      'driver_incentives', 'operational_efficiency', 'marketing_roi', 'financials'
    ];
    
    if (!validTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // First, check the table structure
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${dbConfig.database}' 
      AND TABLE_NAME = '${table}'
      AND COLUMN_NAME IN ('date', 'period')
    `);

    const hasDateColumn = columns.some(col => col.COLUMN_NAME === 'date');
    const hasPeriodColumn = columns.some(col => col.COLUMN_NAME === 'period');
    
    // Build query based on table structure
    if (hasDateColumn) {
      // Tables with date column (daily_summary, etc.)
      if (period === 'today') {
        query = `SELECT * FROM ${table} WHERE date = CURDATE()`;
      } else if (period === 'week') {
        query = `SELECT * FROM ${table} WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)`;
      } else if (period === 'month') {
        query = `SELECT * FROM ${table} WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())`;
      } else {
        return res.status(400).json({ error: 'Invalid period' });
      }
    } else if (hasPeriodColumn) {
      // Tables with period column (operational_efficiency, marketing_roi, financials, etc.)
      query = `SELECT * FROM ${table} WHERE period = '${period}'`;
    } else {
      // For tables without date or period column, apply specific logic
      if (table === 'driver_performance') {
        query = `SELECT * FROM ${table} ORDER BY rides_completed DESC LIMIT 5`;
      } else if (table === 'payment_summary') {
        query = `SELECT * FROM ${table} ORDER BY amount DESC`;
      } else if (table === 'driver_incentives') {
        query = `SELECT * FROM ${table} ORDER BY incentive_amount DESC LIMIT 10`;
      } else {
        // Default fallback for other tables
        query = `SELECT * FROM ${table} LIMIT 100`;
      }
    }

    // Execute query
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching ${table} data:`, error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Endpoint for daily_summary2 with better error handling
app.get('/api/daily_summary2/:period', async (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/daily_summary2/${req.params.period}`);
  console.log('Received request for daily_summary2 with period:', req.params.period);
  const { period } = req.params;
  
  try {
    // Calculate date ranges based on period
    let startDate = new Date();
    let endDate = new Date();
    
    switch(period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        console.error('Invalid period requested:', period);
        return res.status(400).json([{ error: 'Invalid period. Use today, week, or month.' }]);
    }

    console.log(`Querying daily_summary2 from ${startDate} to ${endDate}`);
    
    const query = `
      SELECT 
        SUM(total_rides) as total_rides,
        SUM(completed_rides) as completed_rides,
        SUM(cancelled_rides) as cancelled_rides,
        ROUND((SUM(completed_rides) / NULLIF(SUM(total_rides), 0)) * 100, 1) AS completion_rate,
        ROUND((SUM(cancelled_rides) / NULLIF(SUM(total_rides), 0)) * 100, 1) AS cancellation_rate
      FROM 
        daily_summary2
      WHERE 
        date BETWEEN ? AND ?
      ORDER BY 
        date DESC
      LIMIT 1`;

    console.log('Executing query:', query);
    const [rows] = await pool.query(query, [startDate, endDate]);
    console.log('Query results:', rows);
    
    if (!rows || rows.length === 0) {
      console.log('No data found for the specified period');
      return res.json([{
        total_rides: 0,
        completed_rides: 0,
        cancelled_rides: 0,
        completion_rate: 0,
        cancellation_rate: 0
      }]);
    }

    const result = {
      total_rides: parseInt(rows[0].total_rides) || 0,
      completed_rides: parseInt(rows[0].completed_rides) || 0,
      cancelled_rides: parseInt(rows[0].cancelled_rides) || 0,
      completion_rate: parseFloat(rows[0].completion_rate) || 0,
      cancellation_rate: parseFloat(rows[0].cancellation_rate) || 0
    };
    
    console.log('Sending response:', result);
    res.json([result]);

    } catch (error) {
        console.error('Error in /api/daily_summary2:', error);
        res.status(500).json([{
            error: 'Error fetching data from database',
            details: error.message,
            sqlError: error.sqlMessage
        }]);
    }
});


app.post ('/login', (req, res) => {
    const mysql = "INSERT INTO User (username, password) VALUES (?, ?)";
    const values = [req.body.username, req.body.password];
    db.query(mysql, values, (err, result) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ success: false, message: 'Login failed', error: err });
        }
        res.json({ success: true, message: "Login Successful" });
    }
);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});