# 使用官方 Node.js 20 镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖
RUN npm install --production

# 关键：创建 cert 目录，防止云托管 CA 注入失败
RUN mkdir -p /app/cert

# 复制全部代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "src/app.js"]
