-- 创建 music 表，存储所有可兑换音乐
CREATE TABLE IF NOT EXISTS music (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(64) NOT NULL,
  url           VARCHAR(255) NOT NULL,
  required_hits INT NOT NULL DEFAULT 0, -- 兑换所需敲击数
  is_default    BOOLEAN DEFAULT FALSE   -- 是否为默认音乐
) ENGINE=InnoDB;

-- 创建 user_music 表，记录用户已兑换音乐
CREATE TABLE IF NOT EXISTS user_music (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  open_id      VARCHAR(64) NOT NULL,
  music_id     BIGINT NOT NULL,
  exchanged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (open_id, music_id),
  FOREIGN KEY (open_id) REFERENCES users(open_id) ON DELETE CASCADE,
  FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE
) ENGINE=InnoDB; 