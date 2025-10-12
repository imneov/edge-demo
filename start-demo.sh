#!/bin/bash
# 边缘计算平台演示快速启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  边缘计算平台演示环境启动器  ${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查环境依赖...${NC}"

    # 检查 kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}✗ kubectl 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ kubectl 已安装${NC}"

    # 检查 Go
    if ! command -v go &> /dev/null; then
        echo -e "${RED}✗ Go 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Go 已安装${NC}"

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}! pnpm 未安装，使用 npm${NC}"
        NPM_CMD="npm"
    else
        echo -e "${GREEN}✓ pnpm 已安装${NC}"
        NPM_CMD="pnpm"
    fi

    echo ""
}

# 停止已运行的服务
stop_services() {
    echo -e "${YELLOW}停止已运行的服务...${NC}"

    # 停止 apiserver
    if pgrep -f "apiserver.*8080" > /dev/null; then
        pkill -f "apiserver.*8080"
        echo "✓ 停止 apiserver"
    fi

    # 停止 controller
    if pgrep -f "controller.*8082" > /dev/null; then
        pkill -f "controller.*8082"
        echo "✓ 停止 controller"
    fi

    # 停止前端
    if pgrep -f "next.*3000" > /dev/null; then
        pkill -f "next.*3000"
        echo "✓ 停止前端"
    fi

    sleep 2
    echo ""
}

# 启动后端服务
start_backend() {
    echo -e "${YELLOW}启动后端服务...${NC}"

    # 进入 edge-apiserver 目录
    cd ../edge-apiserver

    # 编译
    echo "编译 apiserver..."
    GOSUMDB=off GOPROXY=direct go build -o bin/apiserver cmd/apiserver/main.go

    echo "编译 controller..."
    GOSUMDB=off GOPROXY=direct go build -o bin/controller cmd/controller/main.go

    # 启动服务
    echo "启动 apiserver (端口 8080)..."
    nohup ./bin/apiserver --kubeconfig=/Users/neov/.kube/config --authorization-mode=AlwaysAllow > ../logs/apiserver.log 2>&1 &

    echo "启动 controller (端口 8082)..."
    nohup METRICS_ADDR=:8082 ./bin/controller --kubeconfig=/Users/neov/.kube/config > ../logs/controller.log 2>&1 &

    # 等待服务启动
    sleep 3

    # 检查服务状态
    if curl -s http://localhost:8080/healthz > /dev/null; then
        echo -e "${GREEN}✓ apiserver 启动成功${NC}"
    else
        echo -e "${RED}✗ apiserver 启动失败${NC}"
        tail -n 20 ../logs/apiserver.log
        exit 1
    fi

    cd ..
    echo ""
}

# 启动前端服务
start_frontend() {
    echo -e "${YELLOW}启动前端服务...${NC}"

    cd edge-console

    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo "安装前端依赖..."
        $NPM_CMD install
    fi

    # 启动前端
    echo "启动前端 (端口 3000)..."
    nohup $NPM_CMD run dev > ../logs/console.log 2>&1 &

    # 等待服务启动
    sleep 5

    # 检查服务状态
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ 前端启动成功${NC}"
    else
        echo -e "${RED}✗ 前端启动失败${NC}"
        tail -n 20 ../logs/console.log
        exit 1
    fi

    cd ..
    echo ""
}

# 创建测试数据
create_test_data() {
    echo -e "${YELLOW}创建测试数据...${NC}"

    # 创建测试集群
    echo "创建测试集群..."
    kubectl apply -f - <<EOF
apiVersion: cluster.theriseunion.io/v1alpha1
kind: Cluster
metadata:
  name: dev-cluster
spec:
  displayName: "开发集群"
  provider: "edge"
  region: "cn-north"
---
apiVersion: cluster.theriseunion.io/v1alpha1
kind: Cluster
metadata:
  name: staging-cluster
spec:
  displayName: "预发布集群"
  provider: "edge"
  region: "cn-east"
---
apiVersion: cluster.theriseunion.io/v1alpha1
kind: Cluster
metadata:
  name: prod-cluster
spec:
  displayName: "生产集群"
  provider: "edge"
  region: "cn-south"
EOF

    echo -e "${GREEN}✓ 测试数据创建完成${NC}"
    echo ""
}

# 显示演示信息
show_demo_info() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}    演示环境启动成功！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo -e "${BLUE}服务地址：${NC}"
    echo "• API服务器: http://localhost:8080"
    echo "• 控制台: http://localhost:3000"
    echo "• Prometheus: http://localhost:9090"
    echo ""
    echo -e "${BLUE}默认账号：${NC}"
    echo "• 用户名: admin"
    echo "• 密码: admin123"
    echo ""
    echo -e "${BLUE}演示脚本：${NC}"
    echo "• 网络故障测试: ./demo-scripts/01-network-failure-test.sh"
    echo "• 多集群部署: ./demo-scripts/02-multi-cluster-deploy.sh"
    echo "• 规模测试: ./demo-scripts/03-scale-test.sh"
    echo "• 权限管理: ./demo-scripts/04-rbac-demo.sh"
    echo ""
    echo -e "${YELLOW}提示：${NC}"
    echo "• 查看日志: tail -f ../logs/*.log"
    echo "• 停止服务: ./stop-demo.sh"
    echo "• 重启服务: ./restart-demo.sh"
    echo ""
    echo -e "${GREEN}准备开始演示吧！${NC}"
}

# 主流程
main() {
    # 创建日志目录
    mkdir -p ../logs

    # 执行步骤
    check_dependencies
    stop_services
    start_backend
    start_frontend
    create_test_data
    show_demo_info
}

# 捕获退出信号
trap 'echo -e "\n${YELLOW}正在清理...${NC}"; stop_services; exit' INT TERM

# 执行主流程
main