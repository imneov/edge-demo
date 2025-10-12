# Docker 多架构镜像构建指南

## 快速开始

### 1. 构建和推送镜像

```bash
cd edge-demo
./build-and-push.sh
```

脚本会自动:
- ✅ 检查 Docker buildx
- ✅ 创建多架构 builder
- ✅ 登录镜像仓库 `quanzhenglong.com`
- ✅ 构建 `linux/amd64` 和 `linux/arm64` 架构的镜像
- ✅ 推送镜像到仓库

### 2. 镜像信息

**仓库地址**: `quanzhenglong.com/edge/demo`

**版本标签**:
- `1.0.0` - 版本标签
- `latest` - 最新版本

**支持架构**:
- `linux/amd64` - x86_64 架构
- `linux/arm64` - ARM64 架构

### 3. 拉取和运行镜像

```bash
# 拉取指定版本
docker pull quanzhenglong.com/edge/demo:1.0.0

# 拉取最新版本
docker pull quanzhenglong.com/edge/demo:latest

# 运行容器
docker run -d \
  --name edge-demo \
  -p 4003:4003 \
  -e MODEL_SERVICE_URL=http://localhost:19000 \
  -e NODE_EXPORTER_URL=http://localhost:9100 \
  -e NODE_NAME=hw002 \
  quanzhenglong.com/edge/demo:1.0.0
```

### 4. 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MODEL_SERVICE_URL` | 模型推理服务地址 | `http://localhost:19000` |
| `NODE_EXPORTER_URL` | Node Exporter 监控地址 | `http://localhost:9100` |
| `NODE_NAME` | 节点名称 | `hw002` |
| `PORT` | 服务端口 | `4003` |

### 5. 修改版本号

编辑 `build-and-push.sh` 中的版本号:

```bash
VERSION="1.0.0"  # 修改为新版本,如 1.0.1, 2.0.0 等
```

### 6. 仅构建本地镜像(不推送)

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag quanzhenglong.com/edge/demo:1.0.0 \
  --file Dockerfile \
  .
```

### 7. 验证镜像

```bash
# 查看镜像架构信息
docker buildx imagetools inspect quanzhenglong.com/edge/demo:1.0.0

# 查看镜像清单
docker manifest inspect quanzhenglong.com/edge/demo:1.0.0
```

## 故障排查

### 问题: buildx 命令不存在

**解决方案**:
```bash
# 安装 Docker Desktop (推荐)
# 或手动安装 buildx
mkdir -p ~/.docker/cli-plugins
wget https://github.com/docker/buildx/releases/latest/download/buildx-linux-amd64 \
  -O ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx
```

### 问题: 登录失败

**解决方案**:
```bash
# 手动登录
docker login quanzhenglong.com

# 输入用户名: edge_admin
# 输入密码: [您的密码]
```

### 问题: 构建速度慢

**解决方案**:
1. 使用国内 Docker Hub 镜像加速器
2. 使用 `--cache-from` 参数复用缓存
3. 减少构建的架构数量(仅构建需要的架构)

## 高级用法

### 添加更多架构

编辑 `build-and-push.sh`:

```bash
# 添加 ARM v7 支持
PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"
```

### 使用构建缓存

```bash
# 第一次构建后,后续构建会自动使用缓存
# 如需清理缓存:
docker buildx prune -a
```

### 并行构建加速

Docker buildx 默认会并行构建多个架构,无需额外配置。

## 参考文档

- [Docker Buildx 文档](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-platform 镜像](https://docs.docker.com/build/building/multi-platform/)
- [Next.js Dockerfile](https://nextjs.org/docs/app/building-your-application/deploying/docker-image)
