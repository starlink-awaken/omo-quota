#!/usr/bin/env bun
import { Command } from 'commander';
import { status } from './commands/status';
import { switchStrategy } from './commands/switch';
import { reset } from './commands/reset';
import { update } from './commands/update';
import { init } from './commands/init';
import { doctor } from './commands/doctor';
import { list } from './commands/list';

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

program.parse();
