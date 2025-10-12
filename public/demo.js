/**
 * Demo Page JavaScript
 * 边缘计算演示页面交互逻辑
 */

// ==================== 全局变量 ====================
let selectedApp = null;
let isDeployed = false;
let selectedData = null;
let inferCount = 0;
let nodeData = null;
let nodeMetrics = null;
let currentNodeName = 'node-009';
let currentAppUrl = 'http://localhost:8000';
let modelReady = false;
let config = null; // 从API加载的配置

// 模拟测试结果(用于API调用失败时的降级)
const testResults = [
    { message: "lost circulation", prediction: 1, probability: 0.8803 },
    { message: "normal", prediction: 0, probability: 0.9215 },
    { message: "lost circulation", prediction: 1, probability: 0.7654 },
    { message: "stuck pipe risk", prediction: 2, probability: 0.8921 },
    { message: "normal", prediction: 0, probability: 0.9543 },
    { message: "pressure anomaly", prediction: 3, probability: 0.8176 },
    { message: "lost circulation", prediction: 1, probability: 0.9012 },
    { message: "normal", prediction: 0, probability: 0.8765 },
    { message: "stuck pipe risk", prediction: 2, probability: 0.7891 },
    { message: "lost circulation", prediction: 1, probability: 0.9234 }
];

// ==================== 配置加载 ====================

/**
 * 从Next.js API加载配置
 */
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            config = await response.json();
            console.log('Configuration loaded:', config);

            // 更新全局变量
            currentNodeName = config.nodeName;
            currentAppUrl = config.modelServiceUrl;

            return true;
        } else {
            console.error('Failed to load config:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error loading config:', error);
        return false;
    }
}

// ==================== Node Exporter 指标解析 ====================

/**
 * 从Next.js API获取Node Exporter指标
 */
async function fetchNodeMetrics() {
    try {
        const response = await fetch('/api/metrics');

        if (response.ok) {
            const metricsText = await response.text();
            console.log('Node Exporter metrics fetched successfully');

            // 解析Prometheus格式的指标
            parsePrometheusMetrics(metricsText);
            updateNodeDisplay();
        } else {
            console.warn('Failed to fetch metrics from Node Exporter, using mock data');
            useMockNodeData();
        }
    } catch (error) {
        console.error('Error fetching node metrics:', error);
        useMockNodeData();
    }
}

/**
 * 解析Prometheus格式的指标数据
 * @param {string} metricsText - Prometheus文本格式的指标
 */
function parsePrometheusMetrics(metricsText) {
    const lines = metricsText.split('\n');
    const metrics = {};

    // 解析指标行
    lines.forEach(line => {
        // 跳过注释和空行
        if (line.startsWith('#') || line.trim() === '') {
            return;
        }

        // 解析指标行: metric_name{label1="value1"} value timestamp
        const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*){.*?}\s+([\d.]+)/);
        if (match) {
            const metricName = match[1];
            const value = parseFloat(match[2]);

            if (!metrics[metricName]) {
                metrics[metricName] = [];
            }
            metrics[metricName].push(value);
        }
    });

    console.log('Parsed Prometheus metrics:', metrics);

    // 计算CPU使用率
    // node_cpu_seconds_total 是累计值,需要计算差值
    // 这里简化处理,使用模拟值
    const cpuMetrics = metrics['node_cpu_seconds_total'];
    if (cpuMetrics && cpuMetrics.length > 0) {
        // 简化计算: 取平均值的方式估算CPU使用率
        // 实际应该使用rate()函数计算变化率
        nodeMetrics = nodeMetrics || {};
        nodeMetrics.cpuUsagePercent = Math.min(100, Math.random() * 30 + 20); // 暂时使用随机值
    }

    // 计算内存使用率
    const memTotal = getMetricValue(metrics, 'node_memory_MemTotal_bytes');
    const memAvailable = getMetricValue(metrics, 'node_memory_MemAvailable_bytes');

    if (memTotal && memAvailable) {
        const memUsed = memTotal - memAvailable;
        const memPercent = (memUsed / memTotal) * 100;

        nodeMetrics = nodeMetrics || {};
        nodeMetrics.memoryUsagePercent = Math.max(0, Math.min(100, memPercent));
        console.log('Calculated memory usage:', nodeMetrics.memoryUsagePercent.toFixed(2) + '%');
    }

    // 如果没有获取到任何指标,使用模拟数据
    if (!nodeMetrics || (nodeMetrics.cpuUsagePercent === undefined && nodeMetrics.memoryUsagePercent === undefined)) {
        console.warn('No valid metrics found, using mock data');
        useMockNodeData();
    }
}

/**
 * 从指标集合中获取单个值
 * @param {Object} metrics - 指标对象
 * @param {string} metricName - 指标名称
 * @returns {number|null} - 指标值
 */
function getMetricValue(metrics, metricName) {
    const values = metrics[metricName];
    if (values && values.length > 0) {
        // 返回第一个值
        return values[0];
    }
    return null;
}

/**
 * 使用模拟数据
 */
function useMockNodeData() {
    nodeData = {
        status: {
            conditions: [
                { type: 'Ready', status: 'True' }
            ]
        }
    };
    nodeMetrics = {
        cpuUsagePercent: 25,
        memoryUsagePercent: 45
    };
    updateNodeDisplay();
    updateNodeMetrics();
}

// ==================== 应用状态检查 ====================

/**
 * 检查模型服务健康状态
 * 通过Next.js API代理避免CORS问题
 */
async function checkAppStatus() {
    console.log('=== checkAppStatus START ===');
    console.log('currentAppUrl:', currentAppUrl);

    try {
        // 使用Next.js API代理而不是直接访问
        const healthUrl = '/api/health';
        console.log('Checking health via proxy:', healthUrl);

        const response = await fetch(healthUrl, {
            method: 'GET'
        });

        console.log('Response received, status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Health check response:', data);
            modelReady = true;
            console.log(`✅ Model service is ready (backend status: ${data.serviceStatus})`);
        } else {
            modelReady = false;
            console.log(`❌ Model service is offline (status: ${response.status})`);
        }
    } catch (error) {
        // API代理不可达
        modelReady = false;
        console.log(`❌ Failed to check app status:`, error);
        console.error('Fetch error details:', error.message);
    }

    console.log('modelReady final value:', modelReady);
    console.log('=== checkAppStatus END, calling updateModelStatus ===');
    updateModelStatus();
}

// ==================== UI更新函数 ====================

/**
 * 更新节点显示状态
 */
function updateNodeDisplay() {
    // 默认显示在线状态
    const isOnline = nodeMetrics && (nodeMetrics.cpuUsagePercent !== undefined || nodeMetrics.memoryUsagePercent !== undefined);

    document.getElementById('nodeOnlineStatus').innerHTML = isOnline ?
        '在线 <span class="status-indicator online"></span>' :
        '离线 <span class="status-indicator offline"></span>';

    // 更新初始指标显示
    if (nodeMetrics) {
        updateNodeMetrics();
    }
}

/**
 * 更新模型状态显示
 */
function updateModelStatus() {
    const statusElement = document.getElementById('modelStatus');
    const nodeStatusElement = document.getElementById('nodeStatus');

    if (modelReady) {
        statusElement.innerHTML = '已加载 <span class="status-indicator online"></span>';
        nodeStatusElement.textContent = '模型已就绪';
        document.getElementById('nodeIcon').textContent = '🚀';
        document.getElementById('sendDataBtn').disabled = false;
        isDeployed = true;
    } else {
        statusElement.innerHTML = '未加载 <span class="status-indicator offline"></span>';
        nodeStatusElement.textContent = '模型未就绪';
        document.getElementById('nodeIcon').textContent = '🔧';
        document.getElementById('sendDataBtn').disabled = true;
        isDeployed = false;
    }
}

/**
 * 更新节点指标显示
 */
function updateNodeMetrics() {
    if (!nodeMetrics) return;

    document.getElementById('nodeCpuUsage').textContent =
        Math.round(nodeMetrics.cpuUsagePercent || 0) + '%';
    document.getElementById('nodeMemUsage').textContent =
        Math.round(nodeMetrics.memoryUsagePercent || 0) + '%';
}

/**
 * 显示提示消息
 * @param {string} message - 提示内容
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * 更新步骤状态
 * @param {string} step - 步骤ID
 */
function updateStep(step) {
    document.querySelectorAll('.step-item').forEach(item => {
        item.classList.remove('active');
    });
    if (step) {
        document.getElementById(step).classList.add('active');
    }
}

// ==================== API调用 ====================

/**
 * 调用真实API进行推理
 * 通过Next.js API代理避免CORS问题
 * @param {string} imageId - 图像ID
 * @returns {Promise<Object>} - 推理结果
 */
async function callPredictionAPI(imageId) {
    try {
        // 使用Next.js API代理
        const predictUrl = '/api/predict';

        // 获取实际的图片URL
        const imageUrl = `http://idc.thingsdao.com/cnpc-demo/test_image_${imageId.padStart(3, '0')}.png`;

        // 构建请求数据
        const requestData = {
            imageUrl: imageUrl,
            imageId: imageId
        };

        console.log('Calling prediction API via proxy:', predictUrl, requestData);

        const response = await fetch(predictUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Prediction result from API:', result);
            return result;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Prediction API failed:', response.status, errorData);
            throw new Error(`API调用失败: ${response.status}`);
        }
    } catch (error) {
        console.warn('⚠️ API调用失败，使用模拟数据:', error);
        // 如果API调用失败，使用模拟数据
        return testResults[parseInt(imageId) || 0] || testResults[0];
    }
}

// ==================== 系统初始化 ====================

/**
 * 初始化系统 - 加载配置和数据
 */
async function initializeSystem() {
    // 1. 加载配置
    await loadConfig();

    // 2. 加载节点指标数据
    await fetchNodeMetrics();

    // 3. 检查应用端口状态
    await checkAppStatus();

    updateStep('step1');

    if (modelReady) {
        showToast('边缘计算系统已就绪，可开始数据采集');
    } else {
        showToast('节点在线，但应用模型未就绪');
    }
}

// ==================== 事件处理 ====================

/**
 * 设置按钮点击事件
 */
function setupSettingsButton() {
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('nodeNameInput').value = currentNodeName;
        document.getElementById('appUrlInput').value = currentAppUrl;
        document.getElementById('settingsModal').classList.add('show');
    });

    // 关闭模态框
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('show');
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('show');
    });

    // 点击遮罩层关闭
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            document.getElementById('settingsModal').classList.remove('show');
        }
    });

    // 保存设置
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const newNodeName = document.getElementById('nodeNameInput').value.trim();
        const newAppUrl = document.getElementById('appUrlInput').value.trim();

        if (!newNodeName) {
            showToast('节点名称不能为空');
            return;
        }

        if (!newAppUrl) {
            showToast('应用地址不能为空');
            return;
        }

        // 验证URL格式
        try {
            new URL(newAppUrl);
        } catch (e) {
            showToast('请输入有效的URL地址，如: http://localhost:8000');
            return;
        }

        // 更新配置
        currentNodeName = newNodeName;
        currentAppUrl = newAppUrl;

        // 关闭模态框
        document.getElementById('settingsModal').classList.remove('show');

        // 显示提示
        showToast(`设置已更新：节点 ${currentNodeName}，应用 ${currentAppUrl}`);

        // 重新加载数据
        await fetchNodeMetrics();
        await checkAppStatus();
    });
}

/**
 * 缩略图点击事件
 */
function setupThumbnailClicks() {
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.addEventListener('click', function() {
            if (!isDeployed) {
                showToast('请先部署模型');
                return;
            }

            document.querySelectorAll('.thumbnail-item').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            selectedData = this.dataset.id;

            // 更新主图片
            const mainImage = document.getElementById('mainImage');
            mainImage.src = this.dataset.url;

            showToast('已选择数据: 图像' + selectedData);
        });
    });
}

/**
 * 发送数据按钮点击事件
 */
function setupSendDataButton() {
    const sendBtn = document.getElementById('sendDataBtn');

    sendBtn.addEventListener('click', async function() {
        if (!selectedData) {
            showToast('请先选择数据');
            return;
        }

        this.disabled = true;
        this.textContent = '处理中...';
        updateStep('step2');

        // 数据流动画 - 从钻井平台到边缘节点
        const flow3 = document.getElementById('flowLine3');
        flow3.classList.add('flowing-right');
        flow3.style.opacity = '1';

        document.getElementById('nodeIcon').classList.add('processing');
        document.getElementById('processingIndicator').classList.add('active');

        setTimeout(async () => {
            flow3.style.opacity = '0';
            flow3.classList.remove('flowing-right');

            // 从边缘节点到结果
            const flow4 = document.getElementById('flowLine4');
            flow4.classList.add('flowing-right');
            flow4.style.opacity = '1';

            // 调用真实或模拟API
            const result = await callPredictionAPI(selectedData);

            setTimeout(() => {
                flow4.style.opacity = '0';
                flow4.classList.remove('flowing-right');

                // 显示结果
                inferCount++;
                document.getElementById('inferCount').textContent = inferCount;

                // 更新结果图片
                const resultImage = document.getElementById('resultImage');
                const mainImage = document.getElementById('mainImage');
                resultImage.src = mainImage.src;
                resultImage.style.display = 'block';

                // 显示JSON结果
                document.getElementById('resultJson').innerHTML = `{
  "message": "${result.message}",
  "prediction": ${result.prediction},
  "probability": ${result.probability.toFixed(4)}
}`;

                // 显示诊断结果和叠加效果
                const diagMap = {
                    'normal': '正常',
                    'lost circulation': '失循环故障',
                    'stuck pipe risk': '卡钻风险',
                    'pressure anomaly': '压力异常'
                };

                const resultOverlay = document.getElementById('resultOverlay');
                const resultText = document.getElementById('resultText');
                const diagnosis = document.getElementById('diagnosis');

                // 确定状态类型
                let statusType = 'normal';
                if (result.message.includes('lost circulation')) {
                    statusType = 'danger';
                } else if (result.message.includes('stuck pipe') || result.message.includes('pressure')) {
                    statusType = 'warning';
                }

                // 更新叠加层样式
                resultOverlay.className = `result-overlay show ${statusType}`;
                resultText.textContent = diagMap[result.message];

                // 更新诊断详情
                diagnosis.style.display = 'block';
                diagnosis.className = `result-diagnosis ${statusType}`;
                document.getElementById('diagText').textContent = '诊断: ' + diagMap[result.message];
                document.getElementById('diagConf').textContent = '置信度: ' + (result.probability * 100).toFixed(1) + '%';

                document.getElementById('nodeIcon').classList.remove('processing');
                document.getElementById('processingIndicator').classList.remove('active');

                this.disabled = false;
                this.textContent = '发送数据到边缘节点';

                showToast('推理完成');
            }, 1000);
        }, 1500);
    });
}

// ==================== 定时任务 ====================

/**
 * 启动定时刷新任务
 */
function startPeriodicTasks() {
    // 定期刷新节点指标（每5秒）
    setInterval(async () => {
        await fetchNodeMetrics();
    }, 5000);

    // 定期检查应用状态（每10秒）
    setInterval(async () => {
        await checkAppStatus();
    }, 10000);

    // 定期更新延时显示（每3秒）
    setInterval(() => {
        document.getElementById('avgLatency').textContent = (100 + Math.random() * 50).toFixed(0) + 'ms';
    }, 3000);
}

// ==================== 入口点 ====================

/**
 * 页面加载完成后初始化
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('Demo page loaded, initializing...');

    // 设置事件监听
    setupSettingsButton();
    setupThumbnailClicks();
    setupSendDataButton();

    // 初始化步骤显示
    updateStep(null);

    // 延迟启动系统初始化
    setTimeout(initializeSystem, 1000);

    // 启动定时任务
    startPeriodicTasks();
});
