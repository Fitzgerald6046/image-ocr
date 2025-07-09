# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an intelligent image recognition system built with React + TypeScript frontend and Node.js Express backend. The system supports multiple AI models (Gemini, DeepSeek, OpenAI, etc.) for OCR and image analysis tasks.

## Architecture

The project follows a client-server architecture:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js Express server with REST API endpoints
- **Communication**: HTTP REST API between frontend and backend
- **File Storage**: Local uploads directory on backend
- **State Management**: React state with localStorage for AI model configurations

### Key Components

- **Frontend (`/`)**: Main React application with image upload, preview, and recognition UI
- **Backend (`/backend/`)**: Express server handling file uploads, AI model integration, and image processing
- **Services (`/backend/services/`)**: Specialized processors for different recognition types (ancient text, receipts, tables, etc.)
- **Routes (`/backend/routes/`)**: API endpoints for upload, recognition, and model management

## Common Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (runs on localhost:3000 or localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server (runs on localhost:3001)
npm run dev

# Start production server
npm start
```

### Full Application
```bash
# Start both frontend and backend (use PowerShell scripts)
./start.ps1    # Starts both services
./restart.ps1  # Restarts both services
./cleanup.ps1  # Cleans up processes
```

## Key Architecture Patterns

### AI Model Integration
- Models are configured via localStorage in frontend
- Backend receives model config and routes to appropriate service
- Each recognition type has its own processor in `/backend/services/`
- Custom API endpoints supported for various AI providers

### File Upload Flow
1. Frontend uploads image to `/api/upload`
2. Backend saves file with UUID to `/uploads/` directory
3. Returns file metadata and URL to frontend
4. Recognition requests reference file by ID

### Recognition Types
The system supports multiple recognition types, each with specialized prompts:
- `auto`: Intelligent type detection
- `ancient`: Ancient text and literature
- `receipt`: Receipt and invoice processing
- `document`: General document OCR
- `id`: ID card and certificate recognition
- `table`: Table and chart analysis
- `handwriting`: Handwritten content
- `prompt`: AI art prompt generation

### Error Handling
- Comprehensive error handling with user-friendly messages
- Token limit detection and suggestions
- Model configuration validation
- File upload validation (size, type, etc.)

## Development Notes

### Frontend State Management
- Main app state in `App.tsx`
- AI model configurations stored in localStorage
- Image upload state includes file metadata and backend URL
- Recognition results include confidence scores and model information

### Backend API Structure
- `/api/upload`: File upload endpoint
- `/api/recognition`: Image recognition processing
- `/api/models`: Model configuration management
- Static file serving for uploaded images

### Environment Configuration
- Backend uses dotenv for configuration
- Frontend connects to backend on localhost:3001
- CORS configured for development ports (3000, 5173)

## Testing

The project currently has basic testing setup but no comprehensive test suite. When adding tests:
- Use the existing ESLint configuration
- Frontend tests should use React Testing Library patterns
- Backend tests should test API endpoints and service functions
CLAUDE.md

项目概述

这是一个智能图像识别系统，前端使用React + TypeScript，后端使用Node.js Express。该系统支持多种AI模型（Gemini、DeepSeek、OpenAI等）进行OCR和图像分析任务。
架构

该项目遵循客户端-服务器架构：
前端：React 18 + TypeScript + Vite + Tailwind CSS
后端：Node.js Express服务器，提供REST API端点
通信：前端与后端之间使用HTTP REST API
文件存储：后端的本地上传目录
状态管理：React状态与localStorage用于AI模型配置

关键组件

前端 (/)：主要的React应用程序，包含图像上传、预览和识别UI
后端 (/backend/)：处理文件上传、AI模型集成和图像处理的Express服务器
服务 (/backend/services/)：不同识别类型的专用处理器（例如：古籍文本、收据、表格等）
路由 (/backend/routes/)：处理上传、识别和模型管理的API端点

常用开发命令

前端开发

bash
# 安装依赖
npm install

# 启动开发服务器（默认运行在localhost:3000或localhost:5173）
npm run dev

# 打包生产版本
npm run build

# 预览生产版本
npm run preview

# 运行代码检查
npm run lint
bash

后端开发

bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 启动开发服务器（默认运行在localhost:3001）
npm run dev

# 启动生产服务器
npm start
bash

完整应用

bash
# 启动前后端（使用PowerShell脚本）
./start.ps1    # 启动两个服务
./restart.ps1  # 重启两个服务
./cleanup.ps1  # 清理进程

关键架构模式

AI模型集成

前端通过localStorage配置模型
后端接收模型配置并路由到相应的服务
每种识别类型有一个独立的处理器，位于/backend/services/中
支持不同AI提供商的自定义API端点

文件上传流程

前端将图像上传至/api/upload
后端将文件保存为UUID命名，存储在/uploads/目录
返回文件元数据和URL给前端
识别请求通过文件ID来引用该文件

识别类型

系统支持多种识别类型，每种类型有专门的提示：
auto：智能类型检测
ancient：古籍和文学文本
receipt：收据和发票处理
document：一般文档OCR
id：身份证件识别
table：表格和图表分析
handwriting：手写内容识别
prompt：AI艺术提示生成

错误处理

详尽的错误处理，提供用户友好的消息
令牌限制检测和建议
模型配置验证
文件上传验证（如文件大小、类型等）

开发笔记

前端状态管理

主要应用状态在App.tsx中
AI模型配置存储在localStorage中
图像上传状态包括文件元数据和后端URL
识别结果包含置信度分数和模型信息

后端API结构

/api/upload：文件上传端点
/api/recognition：图像识别处理
/api/models：模型配置管理
静态文件服务用于上传的图像

环境配置

后端使用dotenv进行配置
前端连接到localhost:3001上的后端
开发端口（3000、5173）已配置CORS

测试

项目目前有基础的测试设置，但没有全面的测试套件。在添加测试时：
使用现有的ESLint配置
前端测试应使用React Testing Library的模式
后端测试应测试API端点和服务函数
