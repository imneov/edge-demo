#!/bin/bash

##############################################################################
# 多架构 Docker 镜像构建和推送脚本
#
# 用途: 使用 buildx 构建多架构镜像并推送到镜像仓库
# 架构: linux/amd64, linux/arm64
# 仓库: quanzhenglong.com/edge/demo
# 版本: 1.0.0
##############################################################################

set -e  # 遇到错误立即退出

# 配置变量
REGISTRY="quanzhenglong.com"
NAMESPACE="edge"
IMAGE_NAME="demo"
VERSION="1.0.0"
PLATFORMS="linux/amd64,linux/arm64"

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"
LATEST_IMAGE_NAME="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"

echo "=========================================="
echo "多架构镜像构建和推送"
echo "=========================================="
echo "镜像仓库: ${REGISTRY}"
echo "命名空间: ${NAMESPACE}"
echo "镜像名称: ${IMAGE_NAME}"
echo "版本标签: ${VERSION}"
echo "目标架构: ${PLATFORMS}"
echo "=========================================="

# 检查 Docker buildx
echo ""
echo "检查 Docker buildx..."
if ! docker buildx version &> /dev/null; then
    echo "❌ 错误: Docker buildx 未安装"
    echo "请安装 Docker Desktop 或手动安装 buildx 插件"
    exit 1
fi
echo "✅ Docker buildx 已就绪"

# 创建/使用 buildx builder
echo ""
echo "创建 buildx builder..."
BUILDER_NAME="multiarch-builder"

if docker buildx inspect ${BUILDER_NAME} &> /dev/null; then
    echo "✅ Builder '${BUILDER_NAME}' 已存在"
    docker buildx use ${BUILDER_NAME}
else
    echo "创建新的 builder '${BUILDER_NAME}'..."
    docker buildx create --name ${BUILDER_NAME} --use
    echo "✅ Builder '${BUILDER_NAME}' 已创建"
fi

# 启动 builder
echo ""
echo "启动 builder..."
docker buildx inspect --bootstrap

# 登录镜像仓库
echo ""
echo "登录镜像仓库 ${REGISTRY}..."
if ! docker login ${REGISTRY}; then
    echo "❌ 登录失败，请检查凭据"
    exit 1
fi
echo "✅ 登录成功"

# 构建和推送多架构镜像
echo ""
echo "开始构建多架构镜像..."
echo "目标镜像:"
echo "  - ${FULL_IMAGE_NAME}"
echo "  - ${LATEST_IMAGE_NAME}"
echo ""

# 获取脚本所在目录的上级目录(edge-demo)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

docker buildx build \
    --platform ${PLATFORMS} \
    --tag ${FULL_IMAGE_NAME} \
    --tag ${LATEST_IMAGE_NAME} \
    --push \
    --file "${SCRIPT_DIR}/Dockerfile" \
    "${SCRIPT_DIR}"

echo ""
echo "=========================================="
echo "✅ 构建和推送完成!"
echo "=========================================="
echo "镜像已推送到:"
echo "  ${FULL_IMAGE_NAME}"
echo "  ${LATEST_IMAGE_NAME}"
echo ""
echo "支持的架构:"
echo "  - linux/amd64"
echo "  - linux/arm64"
echo ""
echo "拉取命令:"
echo "  docker pull ${FULL_IMAGE_NAME}"
echo "  docker pull ${LATEST_IMAGE_NAME}"
echo "=========================================="
