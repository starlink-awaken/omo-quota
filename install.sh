#!/bin/bash

set -e

echo "🚀 安装 omo-quota..."

cd ~/Workspace/Tools/omo-quota

echo "📦 安装依赖..."
bun install

echo "🔨 编译项目..."
bun run build

echo "🔗 创建全局软链接..."
bun link

echo ""
echo "✅ 安装完成！"
echo ""
echo "现在你可以使用以下命令："
echo "  omo-quota init      # 初始化追踪文件"
echo "  omo-quota status    # 查看资源状态"
echo "  omo-quota --help    # 查看所有命令"
echo ""
echo "或者直接使用 bun:"
echo "  bun run ~/Workspace/Tools/omo-quota/src/index.ts status"
