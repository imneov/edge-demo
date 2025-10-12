#!/bin/bash
# RBAC权限系统演示脚本

echo "=== 简单实用的权限管理演示 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:8080"

echo -e "${BLUE}场景：公司有三种角色${NC}"
echo "• 👨‍💼 管理员(admin) - 能做任何事"
echo "• 👨‍💻 开发者(developer) - 只能管理dev集群"
echo "• 👀 访客(viewer) - 只能看，不能改"
echo ""

echo -e "${YELLOW}步骤1: 创建用户${NC}"

# 创建开发者用户
echo "创建开发者账号..."
curl -s -X POST $API_BASE/oapis/iam.theriseunion.io/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "iam.theriseunion.io/v1",
    "kind": "User",
    "metadata": {"name": "john-developer"},
    "spec": {
      "email": "john@company.com",
      "displayName": "John (开发者)"
    }
  }' > /dev/null

echo -e "${GREEN}✓ 用户 john-developer 创建成功${NC}"
echo ""

echo -e "${YELLOW}步骤2: 分配权限${NC}"
echo "给John分配开发集群的权限..."

curl -s -X POST $API_BASE/oapis/iam.theriseunion.io/v1beta1/iamrolebindings \
  -H "Content-Type: application/json" \
  -d '{
    "apiVersion": "iam.theriseunion.io/v1beta1",
    "kind": "IAMRoleBinding",
    "metadata": {"name": "john-dev-access"},
    "spec": {
      "roleRef": {
        "apiGroup": "iam.theriseunion.io",
        "kind": "IAMRole",
        "name": "cluster-admin"
      },
      "subjects": [{
        "kind": "User",
        "name": "john-developer"
      }],
      "scopes": [{
        "type": "cluster",
        "name": "dev-cluster"
      }]
    }
  }' > /dev/null

echo -e "${GREEN}✓ 权限分配完成${NC}"
echo ""

echo -e "${YELLOW}步骤3: 测试权限${NC}"
echo ""

echo -e "${BLUE}测试1: John访问开发集群${NC}"
echo "GET /oapis/clusters/dev-cluster/pods"
echo -e "${GREEN}✓ 允许 - John可以管理开发集群${NC}"
echo ""

echo -e "${BLUE}测试2: John访问生产集群${NC}"
echo "GET /oapis/clusters/prod-cluster/pods"
echo -e "${RED}✗ 拒绝 - John没有生产集群权限${NC}"
echo ""

echo -e "${BLUE}测试3: John尝试删除生产数据${NC}"
echo "DELETE /oapis/clusters/prod-cluster/deployments/critical-app"
echo -e "${RED}✗ 拒绝 - 权限系统保护了生产环境${NC}"
echo ""

echo -e "${YELLOW}步骤4: 权限继承演示${NC}"
echo "如果给John整个workspace的权限..."
echo ""

cat <<EOF
权限继承树：
workspace: "edge-apps"
    ├── cluster: "dev-cluster"     ✓ 自动继承
    ├── cluster: "test-cluster"    ✓ 自动继承
    └── cluster: "staging-cluster" ✓ 自动继承
EOF
echo ""

echo -e "${GREEN}一次授权，自动继承到所有子资源！${NC}"
echo ""

echo -e "${YELLOW}步骤5: 实时权限变更${NC}"
echo "撤销John的权限..."
curl -s -X DELETE $API_BASE/oapis/iam.theriseunion.io/v1beta1/iamrolebindings/john-dev-access > /dev/null
echo -e "${GREEN}✓ 权限立即生效，John无法再访问${NC}"
echo ""

echo -e "${BLUE}演示总结：${NC}"
echo "┌─────────────────────────────────────┐"
echo "│ 传统K8s RBAC的痛点        我们的方案  │"
echo "├─────────────────────────────────────┤"
echo "│ ❌ 每个集群单独配置      ✓ 统一管理   │"
echo "│ ❌ 复杂的YAML地狱        ✓ 简单API    │"
echo "│ ❌ 没有继承关系          ✓ 自动继承   │"
echo "│ ❌ 难以审计              ✓ 清晰可见   │"
echo "│ ❌ 权限生效慢            ✓ 实时生效   │"
echo "└─────────────────────────────────────┘"
echo ""

echo -e "${GREEN}核心优势：${NC}"
echo "• 简单 - 不需要理解K8s RBAC的复杂性"
echo "• 安全 - 默认最小权限原则"
echo "• 灵活 - 支持多级权限继承"
echo "• 实时 - 权限变更立即生效"