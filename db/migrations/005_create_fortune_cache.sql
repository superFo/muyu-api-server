CREATE TABLE IF NOT EXISTS fortune_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  fortune_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_openid_date (open_id, date)
) ENGINE=InnoDB; 