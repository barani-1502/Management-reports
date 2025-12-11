CREATE DATABASE IF NOT EXISTS report;
USE report;

-- Drop existing table if it exists
DROP TABLE IF EXISTS metrics;

-- Create the rides_summary table
CREATE TABLE IF NOT EXISTS rides_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_type ENUM('today', 'week', 'month') NOT NULL,
  period_date DATE NOT NULL,
  total_rides INT NOT NULL,
  completed_rides INT NOT NULL,
  cancelled_rides INT NOT NULL,
  average_fare DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_period (period_type, period_date)
);

-- Insert sample data for today
INSERT INTO rides_summary 
(period_type, period_date, total_rides, completed_rides, cancelled_rides, average_fare)
VALUES 
('today', CURDATE(), 1250, 1175, 75, 14.50)
ON DUPLICATE KEY UPDATE
    total_rides = VALUES(total_rides),
    completed_rides = VALUES(completed_rides),
    cancelled_rides = VALUES(cancelled_rides),
    average_fare = VALUES(average_fare),
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample data for this week
INSERT INTO rides_summary 
(period_type, period_date, total_rides, completed_rides, cancelled_rides, average_fare)
VALUES 
('week', DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), 8500, 8000, 500, 15.25)
ON DUPLICATE KEY UPDATE
    total_rides = VALUES(total_rides),
    completed_rides = VALUES(completed_rides),
    cancelled_rides = VALUES(cancelled_rides),
    average_fare = VALUES(average_fare),
    updated_at = CURRENT_TIMESTAMP;

-- Insert sample data for this month
INSERT INTO rides_summary 
(period_type, period_date, total_rides, completed_rides, cancelled_rides, average_fare)
VALUES 
('month', DATE_FORMAT(CURDATE(), '%Y-%m-01'), 35000, 33000, 2000, 14.80)
ON DUPLICATE KEY UPDATE
    total_rides = VALUES(total_rides),
    completed_rides = VALUES(completed_rides),
    cancelled_rides = VALUES(cancelled_rides),
    average_fare = VALUES(average_fare),
    updated_at = CURRENT_TIMESTAMP;

-- Create daily_summary table
CREATE TABLE IF NOT EXISTS daily_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  label VARCHAR(20),
  rides INT,
  revenue DECIMAL(12,2)
);

-- Insert daily summary data
INSERT INTO daily_summary VALUES
(NULL, 'today', '12 AM', 120, 9500),
(NULL, 'today', '3 AM', 320, 26500),
(NULL, 'today', '5 AM', 520, 42500),
(NULL, 'today', '7 AM', 850, 46500),
(NULL, 'today', '10 AM', 850, 52500),
(NULL, 'today', '3 PM', 850, 58500);

-- Insert weekly summary data
INSERT INTO daily_summary VALUES
(NULL, 'week', 'Mon', 4500, 340000),
(NULL, 'week', 'Tue', 4500, 347000),
(NULL, 'week', 'Wed', 4500, 374000),
(NULL, 'week', 'Thu', 5100, 383000),
(NULL, 'week', 'Fri', 4500, 393000),
(NULL, 'week', 'Sat', 4500, 410000),
(NULL, 'week', 'Sun', 6200, 420000);

-- Insert monthly summary data
INSERT INTO daily_summary VALUES
(NULL, 'month', 'Week 1', 18200, 1350000),
(NULL, 'month', 'Week 2', 18200, 1350000),
(NULL, 'month', 'Week 3', 20500, 1527500),
(NULL, 'month', 'Week 4', 22000, 1650000);

-- Create driver_performance table
CREATE TABLE IF NOT EXISTS driver_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  driver_name VARCHAR(50),
  rides_completed INT,
  rating DECIMAL(3,1)
);

-- Insert driver performance data
INSERT INTO driver_performance VALUES
(NULL, 'today', 'John D.', 122, 4.9),
(NULL, 'today', 'Sarah M.', 90, 4.8),
(NULL, 'today', 'Mike R.', 78, 4.8),
(NULL, 'today', 'Lisa K.', 58, 4.6),
(NULL, 'today', 'David P.', 28, 4.4);

-- Create city_report table
CREATE TABLE IF NOT EXISTS city_report (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  city VARCHAR(50),
  rides INT,
  revenue DECIMAL(12,2),
  growth DECIMAL(4,1)
);

-- Insert city report data
INSERT INTO city_report VALUES
(NULL, 'today', 'Delhi', 850, 125000, 3.1),
(NULL, 'today', 'Mumbai', 720, 98000, 2.7),
(NULL, 'today', 'Bangalore', 680, 92000, 2.5),
(NULL, 'today', 'Hyderabad', 680, 92000, 2.5),
(NULL, 'today', 'Chennai', 680, 92000, 2.5),
(NULL, 'today', 'Kolkata', 680, 92000, 2.5);

-- Create customer_metrics table
CREATE TABLE IF NOT EXISTS customer_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  label VARCHAR(20),
  new_customers INT,
  returning_customers INT
);

-- Insert customer metrics data
INSERT INTO customer_metrics VALUES
(NULL, 'today', 'Today', 320, 860);

-- Create service_quality table
CREATE TABLE IF NOT EXISTS service_quality (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  reason VARCHAR(50),
  count INT
);

-- Insert service quality data
INSERT INTO service_quality VALUES
(NULL, 'today', 'Driver Cancelled', 120),
(NULL, 'today', 'Rider Cancelled', 150),
(NULL, 'today', 'Not show', 180),
(NULL, 'today', 'Payment Issue', 150),
(NULL, 'today', 'Other', 180);

-- Create payment_summary table
CREATE TABLE IF NOT EXISTS payment_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  method VARCHAR(30),
  transactions INT,
  amount DECIMAL(10,2)
);

-- Insert payment summary data
INSERT INTO payment_summary VALUES
(NULL, 'today', 'Credit', 1200, 185000),
(NULL, 'today', 'UPI', 600, 95000),
(NULL, 'today', 'Wallet', 600, 95000),
(NULL, 'today', 'Cash', 600, 95000),
(NULL, 'today', 'NetBanking', 600, 95000);

-- Create operational_efficiency table
CREATE TABLE IF NOT EXISTS operational_efficiency (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  metric VARCHAR(50),
  current_value DECIMAL(5,2),
  target_value DECIMAL(5,2)
);

-- Insert operational efficiency data
INSERT INTO operational_efficiency VALUES
(NULL, 'today', 'Ride Completion (%)', 93.8, 95.0),
(NULL, 'today', 'On-time Performance (%)', 91.5, 95.0),
(NULL, 'today', 'Vehicle Utilization (%)', 79.6, 80.0),
(NULL, 'today', 'Driver Utilization (%)', 81.7, 85.0),
(NULL, 'today', 'Fuel Efficiency (km/l)', 18.2, 20.0);

-- Create marketing_roi table
CREATE TABLE IF NOT EXISTS marketing_roi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  campaign VARCHAR(50),
  spend DECIMAL(12,2),
  revenue DECIMAL(12,2),
  roi DECIMAL(5,2)
);

-- Insert marketing ROI data
INSERT INTO marketing_roi VALUES
(NULL, 'today', 'Summer Sale', 2000.00, 8500.00, 4.25),
(NULL, 'today', 'Referral Bonus', 2000.00, 8500.00, 4.25),
(NULL, 'today', 'New User Offer', 3000.00, 12800.00, 4.27),
(NULL, 'today', 'Weekend Special', 2000.00, 8500.00, 4.25),
(NULL, 'today', 'Loyalty Rewards', 2000.00, 8500.00, 4.25);

-- Create financials table
CREATE TABLE IF NOT EXISTS financials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period ENUM('today','week','month'),
  label VARCHAR(20),
  revenue DECIMAL(14,2),
  costs DECIMAL(14,2),
  profit DECIMAL(14,2)
);

-- Insert financials data
INSERT INTO financials VALUES
(NULL, 'today', 'Today', 525000.00, 452000.00, 73000.00),
(NULL, 'today', 'Yesterday', 498000.00, 433000.00, 65000.00);