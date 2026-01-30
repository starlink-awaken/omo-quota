#!/usr/bin/env bun
import { Command } from 'commander';
import { existsSync, readFileSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import { STRATEGIES, STRATEGIES_DIR, CONFIG_PATH } from '../types';
import chalk from 'chalk';

// 获取当前策略的函数（从 list.ts 复用）
function getCurrentStrategy(): string {
  try {
    if (!existsSync(CONFIG_PATH)) return 'unknown';
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    
    // Method 1: 检查策略文件引用
    if (content.includes('strategy-1') || content.includes('performance')) return 'performance';
    if (content.includes('strategy-2') || content.includes('balanced')) return 'balanced';
    if (content.includes('strategy-3') || content.includes('economical')) return 'economical';
    
    // Method 2: 检查中文方案注释
    const cnMatch = content.match(/方案[一二三]/);
    if (cnMatch) {
      const cn = cnMatch[0];
      if (cn.includes('一')) return 'performance';
      if (cn.includes('二')) return 'balanced';
      if (cn.includes('三')) return 'economical';
    }
    
    return '未知';
  } catch {
    return 'unknown';
  }
}

function validateModels(strategy: string): void {
  const targetStrategy = strategy || getCurrentStrategy();
  const strategyFile = STRATEGIES[targetStrategy as keyof typeof STRATEGIES];
  const strategyPath = `${STRATEGIES_DIR}/${strategyFile}`;
  
  if (!existsSync(strategyPath)) {
    console.error(chalk.red(`✗ 策略文件不存在: ${strategyPath}`));
    process.exit(1);
  }
  
  console.log(chalk.bold(`验证策略: ${targetStrategy}\n`));
  
  try {
    const strategy = parseJSONC(readFileSync(strategyPath, 'utf-8')) as any;
    let hasModelConfig = false;
    let modelErrors: string[] = [];
    
    // 检查是否有 providers 配置
    if (strategy.providers) {
      console.log(chalk.gray(`  ✓ 已配置 providers 回退链`));
      hasModelConfig = true;
    } else {
      console.log(chalk.gray(`  ℹ️  未配置 providers 回退链`));
    }
    
    // 验证每个 agent 的模型配置
    console.log(chalk.yellow('\n模型层级结构:\n'));
    for (const [agentName, agentConfig] of Object.entries(strategy.agents || {})) {
      const model = agentConfig.model;
      console.log(chalk.cyan(`  ${agentName}:`));
      console.log(chalk.gray(`    主模型: ${model}`));
      
      // 如果有 providers 配置，验证模型是否在提供商列表中
      if (strategy.providers && agentConfig.fallback_providers) {
        const provider = model.split('/')[0];
        const providerModels = strategy.providers[provider];
        
        console.log(chalk.gray(`    回退链: ${(agentConfig.fallback_providers as string[]).join(' → ')}`));
        
        if (providerModels && providerModels.includes(model.split('/')[1])) {
          console.log(chalk.green(`      ✓ 主模型可用`));
        } else {
          const fallbackModels = (agentConfig.fallback_providers as string[]).filter(fp => providerModels?.includes(fp.split('/')[1]));
          
          if (fallbackModels.length > 0) {
            console.log(chalk.yellow(`      ⚠️  主模型不可用，可通过 ${fallbackModels.join(' → ')} 获取`));
          } else {
            modelErrors.push(`${agentName} (${model}): 提供商 ${provider} 不支持此模型，且无有效的回退链`);
            allOk = false;
          }
        }
      }
      
      // 显示 primary_provider
      if (agentConfig.primary_provider) {
        console.log(chalk.gray(`    primary_provider: ${agentConfig.primary_provider}`));
      }
      
      console.log();
    }
    
    // 如果有 providers 配置，显示提供商回退链
    if (strategy.providers) {
      console.log(chalk.yellow('\n提供商回退链:\n'));
      
      for (const [provider, providerModels] of Object.entries(strategy.providers)) {
        console.log(chalk.cyan(`  ${provider}:`));
        console.log(chalk.gray(`    可用模型: ${(providerModels as string[]).join(', ')}`));
      }
    }
    
    // 显示模型配置错误
    if (modelErrors.length > 0) {
      console.log(chalk.red('\n✗ 模型配置错误:\n'));
      for (const error of modelErrors) {
        console.log(chalk.red(`  - ${error}`));
      }
      process.exit(1);
    }
    
    console.log(chalk.green('\n✓ 所有模型配置验证通过\n'));
    
    // 显示回退路径预览
    if (hasModelConfig) {
      console.log(chalk.yellow('\n📋 Fallback 路径预览:\n'));
      console.log(chalk.gray('当主模型不可用时，oh-my-opencode 会按以下顺序尝试:\n'));
      
      // 显示每个 agent 的 fallback 路径
      for (const [agentName, agentConfig] of Object.entries(strategy.agents || {})) {
        if (agentConfig.fallback_providers) {
          const fallbackChain = (agentConfig.fallback_providers as string[]).join(' → ');
          console.log(chalk.cyan(`  ${agentName}:`));
          console.log(chalk.gray(`    ${agentConfig.model}`));
          console.log(chalk.gray(`    → ${fallbackChain}`));
        }
      }
    } else {
      console.log(chalk.gray('\nℹ️  此策略未配置 providers，无法预览 fallback 路径\n'));
    }
  } catch (error) {
    console.log(chalk.red(`✗ 策略文件解析错误: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

const program = new Command();

program
  .command('validate-models [command]', '验证模型配置', (cmd, strategy) => validateModels(cmd, strategy))
  .option('-s, --strategy <name>', '指定要验证的策略名称', 'balanced')
  .parse();

export default program;
