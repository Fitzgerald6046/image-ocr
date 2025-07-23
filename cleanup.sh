#!/bin/bash

# 智能图片识别系统 - Linux/Mac 清理脚本
# 用于终止所有相关的前后端进程和释放端口

echo "🧹 正在清理前后端进程和端口占用..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 停止所有Node.js进程
echo -e "${CYAN}🔍 查找Node.js进程...${NC}"
NODE_PIDS=$(pgrep -f "node")

if [ -n "$NODE_PIDS" ]; then
    echo -e "${YELLOW}发现以下Node.js进程:${NC}"
    ps -p $NODE_PIDS -o pid,ppid,cmd --no-headers
    
    echo -e "${CYAN}正在终止Node.js进程...${NC}"
    pkill -f node
    sleep 2
    
    # 检查是否还有残留进程
    REMAINING_PIDS=$(pgrep -f "node")
    if [ -n "$REMAINING_PIDS" ]; then
        echo -e "${YELLOW}强制终止残留进程...${NC}"
        pkill -9 -f node
    fi
    
    echo -e "${GREEN}✅ 已停止所有Node.js进程${NC}"
else
    echo -e "${GREEN}✅ 没有发现Node.js进程${NC}"
fi

# 停止npm进程
echo -e "${CYAN}🔍 查找npm进程...${NC}"
NPM_PIDS=$(pgrep -f "npm")

if [ -n "$NPM_PIDS" ]; then
    echo -e "${YELLOW}发现npm进程，正在终止...${NC}"
    pkill -f npm
    sleep 1
    echo -e "${GREEN}✅ 已停止npm进程${NC}"
else
    echo -e "${GREEN}✅ 没有发现npm进程${NC}"
fi

# 清理特定端口占用
echo -e "${CYAN}🔍 检查端口占用情况...${NC}"
ports=(3000 3001 5173 8080)

for port in "${ports[@]}"; do
    # 检查端口是否被占用
    if command -v lsof > /dev/null; then
        PID=$(lsof -ti :$port)
        if [ -n "$PID" ]; then
            echo -e "${YELLOW}端口 $port 被进程 $PID 占用，正在终止...${NC}"
            kill -9 $PID 2>/dev/null
            sleep 1
            
            # 再次检查
            NEW_PID=$(lsof -ti :$port)
            if [ -z "$NEW_PID" ]; then
                echo -e "${GREEN}✅ 端口 $port 已释放${NC}"
            else
                echo -e "${RED}⚠️ 端口 $port 仍被占用${NC}"
            fi
        else
            echo -e "${GREEN}✅ 端口 $port 未被占用${NC}"
        fi
    else
        # 如果没有lsof，使用netstat
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            echo -e "${YELLOW}⚠️ 端口 $port 可能被占用（无法自动清理，请手动检查）${NC}"
        else
            echo -e "${GREEN}✅ 端口 $port 未被占用${NC}"
        fi
    fi
done

# 查找项目相关进程
echo -e "${CYAN}🔍 查找项目相关进程...${NC}"
PROJECT_PIDS=$(pgrep -f "onebyone-ocr")

if [ -n "$PROJECT_PIDS" ]; then
    echo -e "${YELLOW}发现项目相关进程，正在终止...${NC}"
    pkill -f "onebyone-ocr"
    sleep 1
    echo -e "${GREEN}✅ 已清理项目相关进程${NC}"
fi

# 最终验证
echo -e "${CYAN}🔍 最终验证...${NC}"

# 检查是否还有Node.js进程
FINAL_NODE_CHECK=$(pgrep -f "node")
if [ -n "$FINAL_NODE_CHECK" ]; then
    echo -e "${YELLOW}⚠️ 仍有以下Node.js进程在运行:${NC}"
    ps -p $FINAL_NODE_CHECK -o pid,ppid,cmd --no-headers
else
    echo -e "${GREEN}✅ 所有Node.js进程已清理${NC}"
fi

# 检查端口状态
echo -e "${CYAN}端口状态检查:${NC}"
for port in "${ports[@]}"; do
    if command -v lsof > /dev/null; then
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "${RED}❌ 端口 $port 仍被占用${NC}"
        else
            echo -e "${GREEN}✅ 端口 $port 已释放${NC}"
        fi
    else
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            echo -e "${RED}❌ 端口 $port 可能仍被占用${NC}"
        else
            echo -e "${GREEN}✅ 端口 $port 已释放${NC}"
        fi
    fi
done

echo -e "${GREEN}🎉 清理完成！${NC}"
echo -e "${CYAN}提示: 如果需要重新启动项目，请运行 'npm run dev'${NC}"