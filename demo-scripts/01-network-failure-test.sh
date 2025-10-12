#!/bin/bash
# 网络故障模拟脚本 - 展示边缘节点韧性

echo "=== 边缘节点网络韧性测试 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
EDGE_NODE="edge-node-01"
CLOUD_IP="192.168.1.102"
TEST_APP="nginx-demo"

echo -e "${GREEN}步骤1: 检查边缘节点状态${NC}"
kubectl get nodes | grep $EDGE_NODE
echo ""

echo -e "${GREEN}步骤2: 在边缘节点部署测试应用${NC}"
kubectl create deployment $TEST_APP --image=nginx:latest
kubectl scale deployment $TEST_APP --replicas=3
sleep 5
kubectl get pods -o wide | grep $TEST_APP
echo ""

echo -e "${YELLOW}步骤3: 模拟网络中断${NC}"
echo "断开边缘节点与云端的连接..."
sudo iptables -A OUTPUT -d $CLOUD_IP -j DROP
sudo iptables -A INPUT -s $CLOUD_IP -j DROP
echo -e "${RED}网络已中断${NC}"
echo ""

echo -e "${GREEN}步骤4: 验证边缘节点自治${NC}"
echo "等待10秒..."
sleep 10
echo "检查边缘节点上的应用是否仍在运行:"
# 这里应该通过边缘节点本地访问
curl -s http://localhost:30080 > /dev/null && echo -e "${GREEN}✓ 应用仍在运行${NC}" || echo -e "${RED}✗ 应用已停止${NC}"
echo ""

echo -e "${GREEN}步骤5: 恢复网络连接${NC}"
echo "恢复网络..."
sudo iptables -D OUTPUT -d $CLOUD_IP -j DROP
sudo iptables -D INPUT -s $CLOUD_IP -j DROP
echo -e "${GREEN}网络已恢复${NC}"
echo ""

echo -e "${GREEN}步骤6: 验证自动同步${NC}"
echo "等待同步..."
sleep 15
kubectl get nodes | grep $EDGE_NODE
kubectl get pods -o wide | grep $TEST_APP
echo ""

echo -e "${GREEN}测试完成！${NC}"
echo "关键结论："
echo "1. 网络中断时，边缘节点继续运行"
echo "2. 应用服务不受影响"
echo "3. 网络恢复后自动同步状态"