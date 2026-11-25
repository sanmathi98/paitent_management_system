-- MySQL Database Schema for CareLedger Patient Management System
CREATE DATABASE IF NOT EXISTS patient_management_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE patient_management_db;

-- 1. Users Table (Clinic Staff / Administrators)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL DEFAULT 'Clinic Staff',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_staff TINYINT(1) NOT NULL DEFAULT 0,
  is_superuser TINYINT(1) NOT NULL DEFAULT 0,
  last_login DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- 2. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INT UNSIGNED NOT NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_patients_email UNIQUE (email),
  INDEX idx_patients_name (name),
  INDEX idx_patients_gender (gender)
) ENGINE=InnoDB;

-- 3. Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('Pending', 'Paid', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_bills_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_bills_status (payment_status)
) ENGINE=InnoDB;

-- 4. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bill_id BIGINT NOT NULL,
  razorpay_order_id VARCHAR(120) NOT NULL,
  razorpay_payment_id VARCHAR(120) NULL,
  razorpay_signature VARCHAR(255) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('Pending', 'Paid', 'Failed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_payments_order_id UNIQUE (razorpay_order_id),
  CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id)
    REFERENCES bills(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_payments_status (payment_status)
) ENGINE=InnoDB;
