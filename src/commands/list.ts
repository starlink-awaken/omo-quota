import chalk from 'chalk';
import boxen from 'boxen';
import { existsSync, readFileSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import { STRATEGIES, STRATEGIES_DIR, CONFIG_PATH, StrategyProviders } from '../types';

interface StrategyMetadata {
  name: string;
  description: string;
  cost: string;
  performance: string;
  mainModel: string;
  useCase: string;
}

function extractStrategyMetadata(filePath: string): StrategyMetadata | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const config = parseJSONC(content);
    
    const commentMatch = content.match(/方案[一二三][:：](.+)/);
    const description = commentMatch ? commentMatch[1].trim() : '';
    
    const costMatch = content.match(/成本[:：](.+)/);
    const cost = costMatch ? costMatch[1].split('（')[0].trim() : '未知';
    
    const mainModel = config?.agents?.sisyphus?.model || '未配置';
    
    return {
      name: filePath.includes('performance') ? '极致性能' : 
            filePath.includes('balanced') ? '均衡实用' : 
            filePath.includes('economical') ? '经济节约' : '未知',
      description,
      cost,
      performance: filePath.includes('performance') ? '最高' : 
                   filePath.includes('balanced') ? '优秀' : 
                   filePath.includes('economical') ? '良好' : '未知',
      mainModel,
      useCase: filePath.includes('performance') ? '关键项目、紧急任务' : 
               filePath.includes('balanced') ? '日常开发、通用任务' : 
               filePath.includes('economical') ? '实验项目、预算受限' : '未知',
    };
  } catch (error) {
    return null;
  }
}

function getCurrentStrategy(): string {
  try {
    if (!existsSync(CONFIG_PATH)) return '未知';
    
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    
    if (content.includes('strategy-1') || content.includes('performance')) return 'performance';
    if (content.includes('strategy-2') || content.includes('balanced')) return 'balanced';
    if (content.includes('strategy-3') || content.includes('economical')) return 'economical';
    
    const commentMatch = content.match(/方案[一二三]/);
    if (commentMatch) {
      const cn = commentMatch[0];
      if (cn.includes('一')) return 'performance';
      if (cn.includes('二')) return 'balanced';
      if (cn.includes('三')) return 'economical';
    }
    
    return '未知';
  } catch {
    return '未知';
  }
}

export function list() {
  console.log(chalk.bold.cyan('可用的配置策略:\n'));
  
  const currentStrategy = getCurrentStrategy();
  
  for (const [key, file] of Object.entries(STRATEGIES)) {
    const filePath = `${STRATEGIES_DIR}/${file}`;
    const isCurrent = key === currentStrategy;
    
    if (!existsSync(filePath)) {
      console.log(chalk.red(`✗ ${key}: 文件不存在\n`));
      continue;
    }
    
    const metadata = extractStrategyMetadata(filePath);
    
    if (!metadata) {
      console.log(chalk.yellow(`⚠ ${key}: 无法读取策略信息\n`));
      continue;
    }
    
    // 🆕 解析 providers 回退链
    const config = parseJSONC(readFileSync(filePath, 'utf-8'));
    const hasProviders = !!config.providers;
    
    const title = isCurrent 
      ? `${metadata.name} (当前使用) ⭐`
      : metadata.name;
    
    // 🆕 构建内容数组
    const contentLines: string[] = [
      `${chalk.bold('ID:')} ${chalk.cyan(key)}`,
      `${chalk.bold('描述:')} ${metadata.description || metadata.useCase}`,
      `${chalk.bold('成本:')} ${metadata.cost}`,
      `${chalk.bold('性能:')} ${metadata.performance}`,
      `${chalk.bold('主力模型:')} ${chalk.gray(metadata.mainModel)}`,
      `${chalk.bold('适用场景:')} ${metadata.useCase}`,
      '',
      chalk.gray(`切换命令: omo-quota switch ${key}`),
    ];
    
    // 如果有 providers 配置，显示回退链
    if (hasProviders) {
      contentLines.push('');
      contentLines.push(chalk.yellow('📋 Providers 回退链:'));
      
      for (const [provider, providerModels] of Object.entries(config.providers || {})) {
        contentLines.push(`  ${chalk.cyan(provider)}: ${chalk.gray(providerModels.join(', '))}`);
      }
      
      contentLines.push('');
      contentLines.push(chalk.gray('  说明：oh-my-opencode 会按顺序尝试提供商，直到找到可用的模型'));
    }
    
    const content = contentLines.join('\n');
    
    const boxColor = isCurrent ? 'green' : key === 'balanced' ? 'cyan' : 'gray';
    const borderStyle = isCurrent ? 'double' : 'single';
    
    console.log(boxen(content, {
      title,
      titleAlignment: 'center',
      padding: 1,
      margin: { bottom: 1 },
      borderColor: boxColor,
      borderStyle,
    }));
  }
  
  console.log(chalk.bold.yellow('\n推荐策略:'));
  console.log('  • 月初/配额充足: ' + chalk.cyan('balanced'));
  console.log('  • 关键项目冲刺: ' + chalk.green('performance'));
  console.log('  • 月底/配额紧张: ' + chalk.gray('economical'));
}
