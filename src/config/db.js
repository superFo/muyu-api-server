// 数据库连接配置
// TODO: 使用 mysql2/knex 初始化数据库连接 

import knex from 'knex';

// 兼容微信云托管环境变量
function parseMysqlAddress(addr) {
  if (!addr) return { host: 'localhost', port: 3306 };
  const [host, port] = addr.split(':');
  return { host, port: Number(port) || 3306 };
}

const { host, port } = parseMysqlAddress(process.env.MYSQL_ADDRESS);

const db = knex({
  client: 'mysql2',
  connection: {
    host: host,
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    port: port,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  }
});

export default db; 