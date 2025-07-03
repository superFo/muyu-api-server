CREATE TABLE IF NOT EXISTS records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL,
  timestamp DATETIME NOT NULL,
  device VARCHAR(64),
  city VARCHAR(64),
  longitude DECIMAL(10,6),
  latitude DECIMAL(10,6),
  FOREIGN KEY (open_id) REFERENCES users(open_id) ON DELETE CASCADE,
  INDEX idx_open_id_time (open_id, timestamp)
) ENGINE=InnoDB; 