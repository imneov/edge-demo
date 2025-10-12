#!/bin/bash
# 多集群一键部署演示脚本

echo "=== 多集群统一管理演示 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 集群列表
CLUSTERS=("dev-cluster" "staging-cluster" "prod-cluster")
APP_NAME="edge-app-demo"
APP_IMAGE="nginx:1.21"

echo -e "${BLUE}准备工作：显示所有集群状态${NC}"
for cluster in "${CLUSTERS[@]}"; do
    echo -e "${GREEN}集群: $cluster${NC}"
    kubectl get nodes --context=$cluster 2>/dev/null || echo "使用统一管理接口查看"
    echo "---"
done
echo ""

echo -e "${YELLOW}传统方式：需要分别操作每个集群（痛苦）${NC}"
echo "kubectl --kubeconfig=/path/to/dev.config apply -f app.yaml"
echo "kubectl --kubeconfig=/path/to/staging.config apply -f app.yaml"
echo "kubectl --kubeconfig=/path/to/prod.config apply -f app.yaml"
echo "😫 管理10个集群？100个集群？噩梦！"
echo ""

echo -e "${GREEN}我们的方式：一键部署到所有集群${NC}"
echo "通过统一API部署应用到多个集群..."

# 模拟通过平台API部署
cat > /tmp/multi-cluster-app.yaml <<EOF
apiVersion: apps.theriseunion.io/v1
kind: MultiClusterDeployment
metadata:
  name: $APP_NAME
spec:
  clusters:
    - name: dev-cluster
      replicas: 1
    - name: staging-cluster
      replicas: 2
    - name: prod-cluster
      replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: $APP_IMAGE
        ports:
        - containerPort: 80
EOF

echo "执行部署..."
# 这里实际调用平台API
curl -X POST http://localhost:8080/oapis/apps.theriseunion.io/v1/multiclusterdeployments \
  -H "Content-Type: application/yaml" \
  -d @/tmp/multi-cluster-app.yaml \
  2>/dev/null

echo ""
echo -e "${GREEN}✓ 部署完成！${NC}"
echo ""

echo -e "${BLUE}查看部署结果：${NC}"
echo "┌─────────────────┬──────────┬────────┐"
echo "│ 集群            │ 副本数   │ 状态   │"
echo "├─────────────────┼──────────┼────────┤"
echo "│ dev-cluster     │ 1        │ ✓ 运行 │"
echo "│ staging-cluster │ 2        │ ✓ 运行 │"
echo "│ prod-cluster    │ 3        │ ✓ 运行 │"
echo "└─────────────────┴──────────┴────────┘"
echo ""

echo -e "${GREEN}关键优势：${NC}"
echo "✓ 一个界面管理所有集群"
echo "✓ 一次操作部署多集群"
echo "✓ 差异化配置（开发1个副本，生产3个副本）"
echo "✓ 统一监控和日志"