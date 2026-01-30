#!/usr/bin/env bun
import { Command } from 'commander';
import { status } from './commands/status';
import { switchStrategy } from './commands/switch';
import { reset } from './commands/reset';
import { update } from './commands/update';
import { init } from './commands/init';
import { doctor } from './commands/doctor';
import { list } from './commands/list';
import { syncQuota } from './commands/sync';
import { reportDaily, reportMonthly } from './commands/report';
import { startDashboard } from './commands/dashboard';

const program = new Command();

program
  .name('omo-quota')
  .description('Oh-My-OpenCode 配额管理和策略切换工具')
  .version('1.0.0');

program
  .command('list')
  .description('列出所有可用的配置策略')
  .action(list);

program
  .command('status')
  .description('显示所有资源的当前状态')
  .action(status);

program
  .command('switch <strategy>')
  .description('切换配置策略 (performance|balanced|economical)')
  .action(switchStrategy);

program
  .command('reset <provider>')
  .description('手动标记资源已重置 (anthropic|google-1|google-2|zhipuai|all)')
  .action(reset);

program
  .command('update <provider> <usage>')
  .description('更新资源用量 (例如: github-copilot-premium 150)')
  .action(update);

program
  .command('init')
  .description('初始化配额追踪文件')
  .action(init);

program
  .command('doctor')
  .description('验证配置文件和策略')
  .action(doctor);

program
  .command('sync')
  .description('同步 oh-my-opencode 使用记录到配额追踪器')
  .action(syncQuota);

program
  .command('report <period>')
  .description('生成成本分析报告 (daily|monthly)')
  .option('--export', '导出为Markdown文件')
  .action((period: string, options: any) => {
    if (period === 'daily') {
      reportDaily(options);
    } else if (period === 'monthly') {
      reportMonthly();
    } else {
      console.error('Invalid period. Use: daily or monthly');
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('启动 Web 仪表盘')
  .option('-p, --port <port>', '端口号', '3737')
  .action((options: any) => {
    const port = parseInt(options.port);
    startDashboard(port);
  });

program.parse();
