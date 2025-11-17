-- Migration script to add phone_number column to existing users table
-- Run this if you have an existing database without the phone_number column

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) NULL;

