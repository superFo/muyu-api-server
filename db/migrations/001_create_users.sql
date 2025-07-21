CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(32) NOT NULL,
  avatar VARCHAR(255),
  phone VARCHAR(20),
  role ENUM('user','admin','ops') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fortune_ask_count INT DEFAULT 3,
  fortune_ask_date DATE DEFAULT NULL,
  INDEX idx_open_id (open_id)
) ENGINE=InnoDB; 