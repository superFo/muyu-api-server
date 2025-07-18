-- 新增皮肤信息表
CREATE TABLE IF NOT EXISTS skins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(32) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 新增用户拥有皮肤表
CREATE TABLE IF NOT EXISTS user_skins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_id VARCHAR(64) NOT NULL,
  skin_id INT NOT NULL,
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_skin (open_id, skin_id)
) ENGINE=InnoDB;

-- 用户表增加当前皮肤字段
ALTER TABLE users ADD COLUMN current_skin_id INT DEFAULT NULL; 