
Airflow 任务管理 PWA 应用：需求文档 (技术栈: React + shadcn/ui)

本需求文档详细描述了前端 PWA（Progressive Web App）应用所需具备的功能、界面元素和技术要求。

1. 技术要求与架构

-   **应用类型**: Progressive Web App (PWA)。
-   **前端技术栈**:
    -   **框架**:  `React`  (推荐 Next.js 或 Vite React)。
    -   **UI 库**:  `shadcn/ui`  (基于 Radix UI 和 Tailwind CSS)。
    -   **样式**: Tailwind CSS。
-   **API 集成**: 使用标准的 Airflow REST API 和自定义的“通知管理插件” API。
-   **推送服务**: 集成 Firebase SDK for Web 以接收 FCM（Firebase Cloud Messaging）推送。

2. 核心功能需求

2.1. 用户认证与安全性

-   **登录界面**: 使用  `shadcn/ui`  的  `Card`,  `Input`  和  `Button`  组件构建美观的登录表单。
-   **认证支持**: （同前）。
-   **会话管理**: （同前）。

2.2. DAG 列表与搜索

-   **DAG 列表展示**: 使用  `shadcn/ui`  的  `Table`  或  `Card`  组件展示 DAG 列表。
-   **搜索与过滤**:
    -   使用  `Input`  组件实现搜索框。
    -   使用  `Select`  或  `Combobox`  组件实现按标签筛选。
-   **状态概览**: 使用  `Badge`  组件以不同颜色（如绿色表示成功、红色表示失败）直观显示 DAG 态。
-   **快速操作开关**:
    -   **启动/暂停开关**: 使用  `Switch`  组件（来自  `shadcn/ui`）实现一键切换功能。
    -   **通知开关**: 使用  `Button`  和  `Bell`  图标（来自 Lucide Icons）实现，通过  `aria-checked`  状态和颜色变化表示启用/禁用。

2.3. DAG 详情与监控

-   **详情页面**: 使用  `shadcn/ui`  的  `Tabs`  或  `Sidebar`  布局切换不同视图。
-   **核心视图**:
    -   **网格视图/图形视图**: 需要集成第三方 React 图表库（例如 Recharts 或专门的 DAG 可视化库）来实现复杂的图形展示，并结合  `shadcn/ui`  样式。
-   **手动触发**: 使用  `Button`  组件触发操作，可能结合  `Dialog`  组件输入配置 JSON。
-   **通知设定入口**: 使用  `Button`  或导航链接，链接到一个专用的配置页面/弹窗。

2.4. 任务操作与日志查看

-   **任务操作菜单**: 使用  `DropdownMenu`  组件（来自  `shadcn/ui`）在点击任务时弹出操作选项。
-   **支持的操作**: （同前）。
-   **日志查看器**:
    -   使用  `Dialog`  或  `Drawer`  组件（来自  `shadcn/ui`）作为日志查看弹窗。
    -   使用  `Textarea`  或自定义可滚动容器展示日志。
    -   前端实现日志高亮与格式化，确保样式与 Tailwind/shadcn 主题一致。

2.5. 实时通知管理 (PWA 特定功能)

-   **PWA 推送集成**: （同前）。
-   **设备注册**: （同前）。
-   **应用内通知中心**:
    -   使用  `Popover`  或  `Sheet`  组件展示通知列表。
    -   使用  `List`  和  `Avatar`  组件展示通知历史记录，并使用  `Badge`  区分通知类型（如 Error, Info）。
-   **通知配置界面**: 使用  `Form`  组件（来自  `shadcn/ui`）和后端 API 管理用户订阅设置。

3. 用户体验 (UX) 和设计

-   **响应式设计**: 确保所有组件在移动视图下表现良好，符合 PWA 的移动优先原则。
-   **一致性**: 严格遵循  `shadcn/ui`  和 Tailwind CSS 的设计规范，确保整个应用的视觉一致性。
-   **加载指示**: 使用  `Progress`  或  `Loader`  组件（来自  `shadcn/ui`）在 API 调用和数据加载时提供视觉反馈。
