-- Migration: Create combos table
-- Description: Add combos table for bundled products

CREATE TABLE combos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description LONGTEXT,
  comboPrice DECIMAL(10, 2) NOT NULL,
  originalPrice DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  images JSON DEFAULT '[]',
  categoryId INT,
  productCount INT DEFAULT 0,
  tag VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  stock INT DEFAULT 0 CHECK (stock >= 0),
  sold INT DEFAULT 0 CHECK (sold >= 0),
  metaTitle VARCHAR(255),
  metaDescription LONGTEXT,
  seoKeywords JSON DEFAULT '[]',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_slug (slug),
  INDEX idx_categoryId (categoryId),
  INDEX idx_isActive (isActive),
  INDEX idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
