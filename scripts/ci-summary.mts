/**
 * Writes a Markdown execution summary for the GitHub Actions job page.
 *
 * Reads Playwright's JSON report and appends to $GITHUB_STEP_SUMMARY (or prints to stdout when run
 * locally). Runs directly on Node 24, which strips TypeScript types natively.
 *
 * Usage: node scripts/ci-summary.mts [path/to/playwright-results.json]
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import type { JSONReport, JSONReportSuite, JSONReportTest } from '@playwright/test/reporter';

type Row = {
  readonly file: string;
  readonly title: string;
  readonly status: JSONReportTest['status'];
  readonly attempts: number;
  readonly durationMs: number;
};

const STATUS_LABEL: Record<JSONReportTest['status'], string> = {
  expected: '✅ Passed',
  flaky: '⚠️ Flaky',
  unexpected: '❌ Failed',
  skipped: '⏭️ Skipped',
};

/** Flattens nested describe blocks into one row per test, keeping the describe path in the title. */
function collectRows(suite: JSONReportSuite, path: readonly string[] = []): Row[] {
  const titlePath = suite.title && suite.title !== suite.file ? [...path, suite.title] : path;
  const rows: Row[] = [];
  for (const spec of suite.specs) {
    for (const test of spec.tests) {
      rows.push({
        file: spec.file,
        title: [...titlePath, spec.title].join(' › '),
        status: test.status,
        attempts: test.results.length,
        durationMs: test.results.reduce((total, result) => total + result.duration, 0),
      });
    }
  }
  for (const child of suite.suites ?? []) rows.push(...collectRows(child, titlePath));
  return rows;
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Escapes characters that would break a Markdown table cell. */
function cell(text: string): string {
  return text.replaceAll('|', '\\|');
}

function render(report: JSONReport): string {
  const { stats } = report;
  const rows = report.suites.flatMap((suite) => collectRows(suite));
  const total = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
  const verdict = stats.unexpected > 0 ? '❌ Failed' : stats.flaky > 0 ? '⚠️ Passed with flaky tests' : '✅ Passed';

  const artifacts = [
    ['HTML report', process.env.REPORT_URL],
    ['Traces, screenshots and videos', process.env.TRACES_URL],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, url]) => `- [${name}](${url})`);

  return [
    '## Playwright execution summary',
    '',
    `**Result:** ${verdict}`,
    '',
    '| Total | ✅ Passed | ⚠️ Flaky | ❌ Failed | ⏭️ Skipped | Duration | Workers |',
    '|---:|---:|---:|---:|---:|---:|---:|',
    `| ${total} | ${stats.expected} | ${stats.flaky} | ${stats.unexpected} | ${stats.skipped} | ${seconds(stats.duration)} | ${report.config.metadata?.actualWorkers ?? '—'} |`,
    '',
    '### Tests',
    '',
    '| Status | Spec | Test | Attempts | Duration |',
    '|---|---|---|---:|---:|',
    ...rows.map(
      (row) =>
        `| ${STATUS_LABEL[row.status]} | \`${cell(row.file)}\` | ${cell(row.title)} | ${row.attempts} | ${seconds(row.durationMs)} |`,
    ),
    '',
    ...(artifacts.length > 0 ? ['### Artifacts', '', ...artifacts, ''] : []),
  ].join('\n');
}

const reportPath = process.argv[2] ?? 'playwright-results.json';
const markdown = existsSync(reportPath)
  ? render(JSON.parse(readFileSync(reportPath, 'utf8')) as JSONReport)
  : `## Playwright execution summary\n\n❌ No test results found at \`${reportPath}\`: the run stopped before tests executed (see the job log).\n`;

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) appendFileSync(summaryFile, `${markdown}\n`);
else console.log(markdown);
