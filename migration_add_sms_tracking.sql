-- Migration script to add sms_sent_at column to existing assignments table
-- Run this if you have an existing database without the sms_sent_at column

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP NULL;

