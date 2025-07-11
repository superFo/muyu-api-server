-- 强制所有用户重新登录的SQL脚本
-- 将nickname设置为null，avatar设置为空，强制用户重新上传

UPDATE users 
SET nickname = NULL, 
    avatar = NULL 
WHERE nickname IS NOT NULL OR avatar IS NOT NULL;

-- 或者只清空nickname，让用户重新设置
-- UPDATE users SET nickname = NULL WHERE nickname IS NOT NULL; 