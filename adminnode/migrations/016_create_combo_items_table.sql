-- Migration: Create combo_items table
-- Description: Add combo_items table for products in combos

CREATE TABLE combo_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  comboId INT NOT NULL,
  productId INT NOT NULL,
  variantId INT,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (comboId) REFERENCES combos(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variantId) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_comboId (comboId),
  INDEX idx_productId (productId),
  INDEX idx_variantId (variantId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
