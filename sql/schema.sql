-- Create DB in lowercase to match the error/app
CREATE DATABASE IF NOT EXISTS nbdh DEFAULT CHARACTER SET utf8mb4;
USE nbdh;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(120) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  weight VARCHAR(60) NOT NULL,
  flavor VARCHAR(60) NULL,
  gst DECIMAL(5,2) NOT NULL DEFAULT 0,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_created ON products(created_at);
