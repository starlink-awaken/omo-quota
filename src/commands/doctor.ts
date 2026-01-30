#!/usr/bin/env bun
import { existsSync, readFileSync } from 'fs';
import { parse as parseJSONC } from 'jsonc-parser';
import { STRATEGIES, STRATEGIES_DIR, CONFIG_PATH } from '../types';

export function doctor() {
  console.log('正在检查配置...');
  
  let allOk = true;
  
  // 1. 检查策略文件
  console.log('1. 检查策略文件:');
  for (const [name, file] of Object.entries(STRATEGIES)) {
    const strategyPath = `${STRATEGIES_DIR}/${file}`;
    if (!existsSync(strategyPath)) {
      console.log(`  ✗ ${name}: ${strategyPath} 不存在`);
      allOk = false;
    } else {
      try {
        const content = readFileSync(strategyPath, 'utf-8');
        parseJSONC(content);
        console.log(`  ✓ ${name}: ${strategyPath}`);
      } catch {
        console.log(`  ✗ 语法错误: ${error instanceof Error ? error.message : String(error)}`);
        allOk = false;
      }
    }
  }
  
  // 2. 检查当前配置
  console.log('2. 检查当前配置:');
  if (existsSync(CONFIG_PATH)) {
    try {
      const content = readFileSync(CONFIG_PATH, 'utf-8');
      parseJSONC(content);
      console.log('  ✓ 配置文件存在: ${CONFIG_PATH}`);
    } catch {
      console.log(`  ✗ 配置文件语法错误: ${error instanceof Error ? error.message : String(error)}`);
      allOk = false;
    }
  } else {
    console.log(`  ✗ 配置文件不存在: ${CONFIG_PATH}`);
    allOk = false;
  }
  
  // 3. 检查策略目录
  console.log('3. 检查策略目录:');
  if (existsSync(STRATEGIES_DIR)) {
    console.log(`  ✓ 策略目录存在: ${STRATEGIES_DIR}`);
  } else {
    console.log(`  ✗ 策略目录不存在: ${STRATEGIES_DIR}`);
    allOk = false;
  }
  
  console.log();
  if (allOk) {
    console.log('✓ 所有检查通过！');
  } else {
    console.log('✗ 发现问题，请检查上述错误。');
    process.exit(1);
  }
}
