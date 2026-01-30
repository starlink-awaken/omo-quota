import chalk from 'chalk';
import asciichart from 'asciichart';
import Chartscii from 'chartscii';
import { scanAllSessions, DEFAULT_STORAGE_PATH } from '../utils/message-parser';
import { calculateCost, aggregateCosts } from '../utils/cost-calculator';
import { writeFileSync } from 'fs';

export async function reportDaily(options: { export?: boolean } = {}) {
  console.log(chalk.cyan('📊 Generating daily cost report...\n'));
  
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);
  
  if (messages.length === 0) {
    console.log(chalk.yellow('⚠️  No usage data found.'));
    return;
  }
  
  const calculations = messages.map(calculateCost);
  const aggregated = aggregateCosts(calculations);
  
  const dailyCosts = new Map<string, number>();
  for (const calc of calculations) {
    const msg = messages.find(m => m.id === calc.provider);
    if (!msg) continue;
    
    const date = new Date(msg.time.created).toISOString().split('T')[0];
    dailyCosts.set(date, (dailyCosts.get(date) || 0) + calc.totalCost);
  }
  
  const sortedDates = Array.from(dailyCosts.keys()).sort();
  const costs = sortedDates.map(d => dailyCosts.get(d)!);
  
  if (costs.length > 0) {
    console.log(chalk.bold('📈 Daily Cost Trend (Last 30 days)\n'));
    
    const chart = asciichart.plot(costs.slice(-30), {
      height: 10,
      padding: '    $',
      colors: [asciichart.cyan]
    });
    
    console.log(chart);
    console.log();
  }
  
  console.log(chalk.bold('💰 Cost Summary\n'));
  console.log(chalk.green(`Total Cost: $${aggregated.totalCost.toFixed(4)}`));
  console.log(chalk.gray(`Total Tokens: ${aggregated.totalTokens.toLocaleString()}`));
  console.log(chalk.gray(`Average Cost/Day: $${(aggregated.totalCost / Math.max(sortedDates.length, 1)).toFixed(4)}`));
  
  console.log(chalk.bold('\n🤖 Cost by Provider\n'));
  
  const providerData = Array.from(aggregated.byProvider.entries())
    .map(([provider, cost]) => ({
      label: provider,
      value: cost,
      color: getProviderColor(provider)
    }))
    .sort((a, b) => b.value - a.value);
  
  for (const item of providerData) {
    const percentage = (item.value / aggregated.totalCost * 100).toFixed(1);
    console.log(
      chalk[item.color as 'green'](`  ${item.label.padEnd(30)} $${item.value.toFixed(4)}  (${percentage}%)`)
    );
  }
  
  if (options.export) {
    const report = generateMarkdownReport(sortedDates, costs, aggregated, providerData);
    const filename = `omo-quota-report-${new Date().toISOString().split('T')[0]}.md`;
    const outputPath = `${process.env.HOME}/.omo-quota-reports/${filename}`;
    
    writeFileSync(outputPath, report);
    console.log(chalk.green(`\n✓ Report exported to: ${outputPath}`));
  }
}

export async function reportMonthly() {
  console.log(chalk.cyan('📊 Generating monthly cost report...\n'));
  
  const messages = await scanAllSessions(DEFAULT_STORAGE_PATH);
  
  if (messages.length === 0) {
    console.log(chalk.yellow('⚠️  No usage data found.'));
    return;
  }
  
  const calculations = messages.map(calculateCost);
  const aggregated = aggregateCosts(calculations);
  
  const monthlyCosts = new Map<string, number>();
  for (const calc of calculations) {
    const msg = messages.find(m => m.providerID === calc.provider);
    if (!msg) continue;
    
    const month = new Date(msg.time.created).toISOString().substring(0, 7);
    monthlyCosts.set(month, (monthlyCosts.get(month) || 0) + calc.totalCost);
  }
  
  const sortedMonths = Array.from(monthlyCosts.keys()).sort();
  const costs = sortedMonths.map(m => monthlyCosts.get(m)!);
  
  if (costs.length > 0) {
    console.log(chalk.bold('📈 Monthly Cost Trend\n'));
    
    const chart = asciichart.plot(costs, {
      height: 10,
      padding: '    $',
      colors: [asciichart.blue]
    });
    
    console.log(chart);
    console.log();
  }
  
  console.log(chalk.bold('📅 Monthly Breakdown\n'));
  for (let i = 0; i < sortedMonths.length; i++) {
    console.log(
      chalk.cyan(`  ${sortedMonths[i]}`),
      chalk.white(`$${costs[i].toFixed(2)}`)
    );
  }
  
  console.log(chalk.bold('\n💰 Total Cost\n'));
  console.log(chalk.green(`  $${aggregated.totalCost.toFixed(2)}`));
}

function getProviderColor(provider: string): string {
  const colorMap: Record<string, string> = {
    'openai': 'green',
    'anthropic': 'blue',
    'google': 'yellow',
    'zhipuai': 'magenta',
    'github-copilot': 'cyan',
    'deepseek': 'white'
  };
  
  const key = provider.toLowerCase().split('-')[0];
  return colorMap[key] || 'gray';
}

function generateMarkdownReport(
  dates: string[],
  costs: number[],
  aggregated: ReturnType<typeof aggregateCosts>,
  providerData: Array<{ label: string; value: number; color: string }>
): string {
  return `# AI Usage Cost Report

**Generated**: ${new Date().toISOString()}
**Period**: ${dates[0]} - ${dates[dates.length - 1]}

## Summary

- **Total Cost**: $${aggregated.totalCost.toFixed(4)}
- **Total Tokens**: ${aggregated.totalTokens.toLocaleString()}
- **Average Cost/Day**: $${(aggregated.totalCost / dates.length).toFixed(4)}

## Cost by Provider

| Provider | Cost | Percentage |
|----------|------|------------|
${providerData.map(p => `| ${p.label} | $${p.value.toFixed(4)} | ${(p.value / aggregated.totalCost * 100).toFixed(1)}% |`).join('\n')}

## Daily Costs

| Date | Cost |
|------|------|
${dates.map((d, i) => `| ${d} | $${costs[i].toFixed(4)} |`).join('\n')}

---
*Generated by omo-quota*
`;
}
