# 五子棋在线对战平台

一个基于 React + Supabase 的实时五子棋在线对战平台，支持多人同时游戏。

## 功能特性

- 🎮 **实时对战**: 基于 Supabase Realtime 的实时游戏体验
- 👥 **多桌游戏**: 支持8个游戏桌同时进行（可配置）
- ⏱️ **智能计时**: 每手棋10秒限时，超时自动判负
- 🚀 **自动匹配**: 30秒内未准备自动踢出游戏桌
- 📱 **响应式设计**: 支持桌面端和移动端
- 🎨 **现代UI**: 美观的渐变背景和卡片式设计

## 技术栈

- **前端**: React 18 + Vite
- **数据库**: Supabase (PostgreSQL)
- **实时通信**: Supabase Realtime
- **部署**: Vercel
- **样式**: CSS3 (Grid + Flexbox)

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd Gobang
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Game Configuration
VITE_GAME_TABLES_COUNT=8
VITE_MOVE_TIMEOUT_SECONDS=10
VITE_IDLE_TIMEOUT_MINUTES=10
VITE_START_GAME_TIMEOUT_SECONDS=30
```

### 4. 设置 Supabase 数据库

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在 SQL Editor 中执行 `supabase-schema.sql` 文件中的 SQL 语句
3. 确保 Realtime 功能已启用

### 5. 本地开发

```bash
npm run dev
```

访问 `http://localhost:5173` 开始游戏！

## 部署到 Vercel

### 1. 连接 GitHub

1. 将代码推送到 GitHub 仓库
2. 在 [Vercel](https://vercel.com) 导入项目

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GAME_TABLES_COUNT` (可选，默认8)
- `VITE_MOVE_TIMEOUT_SECONDS` (可选，默认10)
- `VITE_IDLE_TIMEOUT_MINUTES` (可选，默认10)
- `VITE_START_GAME_TIMEOUT_SECONDS` (可选，默认30)

### 3. 部署

Vercel 会自动构建和部署你的应用。

## 游戏规则

### 基本规则
- 15x15 棋盘
- 黑子先行
- 连成5子获胜
- 支持横、竖、斜四个方向

### 时间规则
- 每手棋限时10秒（可配置）
- 超时自动判负
- 开始游戏等待时间30秒（可配置）
- 连续10分钟无操作自动踢出（可配置）

### 匹配规则
- 进入大厅选择空闲游戏桌
- 两名玩家都点击"开始游戏"后开始
- 游戏结束后返回大厅，可继续下一局

## 项目结构

```
src/
├── components/          # React 组件
│   ├── PlayerLogin.jsx  # 玩家登录
│   ├── GameLobby.jsx    # 游戏大厅
│   └── GameBoard.jsx    # 游戏棋盘
├── contexts/            # React Context
│   └── GameContext.jsx  # 游戏状态管理
├── lib/                 # 工具库
│   └── supabase.js      # Supabase 客户端
├── App.jsx              # 主应用组件
├── App.css              # 样式文件
└── main.jsx             # 应用入口
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_GAME_TABLES_COUNT` | 游戏桌数量 | 8 |
| `VITE_MOVE_TIMEOUT_SECONDS` | 每手棋超时时间（秒） | 10 |
| `VITE_IDLE_TIMEOUT_MINUTES` | 无操作踢出时间（分钟） | 10 |
| `VITE_START_GAME_TIMEOUT_SECONDS` | 开始游戏等待时间（秒） | 30 |

### 数据库表结构

`game_tables` 表存储游戏状态：
- 玩家信息（ID、昵称、头像）
- 游戏状态（等待、进行中、结束）
- 棋盘状态（15x15 JSON 数组）
- 当前玩家、获胜者等

## 开发指南

### 添加新功能

1. **新增游戏模式**: 修改 `GameContext.jsx` 中的状态管理
2. **UI 优化**: 编辑 `App.css` 样式文件
3. **游戏逻辑**: 在 `GameBoard.jsx` 中修改游戏规则

### 性能优化

- 使用 React.memo 优化组件渲染
- 合理使用 useCallback 和 useMemo
- Supabase 查询优化和索引

## 故障排除

### 常见问题

1. **连接 Supabase 失败**
   - 检查环境变量是否正确
   - 确认 Supabase 项目状态

2. **实时更新不工作**
   - 确保 Realtime 功能已启用
   - 检查 RLS 策略设置

3. **部署失败**
   - 检查 Vercel 环境变量
   - 查看构建日志

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
