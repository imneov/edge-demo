#!/bin/bash
# 停止演示环境脚本

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}正在停止演示环境...${NC}"

# 停止 apiserver
if pgrep -f "apiserver.*8080" > /dev/null; then
    pkill -f "apiserver.*8080"
    echo -e "${GREEN}✓ 停止 apiserver${NC}"
else
    echo "• apiserver 未运行"
fi

# 停止 controller
if pgrep -f "controller.*8082" > /dev/null; then
    pkill -f "controller.*8082"
    echo -e "${GREEN}✓ 停止 controller${NC}"
else
    echo "• controller 未运行"
fi

# 停止前端
if pgrep -f "next.*3000" > /dev/null; then
    pkill -f "next.*3000"
    echo -e "${GREEN}✓ 停止前端${NC}"
else
    echo "• 前端未运行"
fi

# 停止 Prometheus（如果运行）
if pgrep -f "prometheus.*9090" > /dev/null; then
    pkill -f "prometheus.*9090"
    echo -e "${GREEN}✓ 停止 Prometheus${NC}"
fi

echo ""
echo -e "${GREEN}演示环境已停止${NC}"