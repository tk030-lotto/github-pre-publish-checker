import { parseArgs } from 'node:util';

export interface ParsedCLIOptions {
  targetPath: string;
  outputPath?: string;
  largeFileThresholdBytes?: number;
  jsonOutput: boolean;
  help: boolean;
}

export function parseCLIFlags(args: string[] = process.argv.slice(2)): ParsedCLIOptions {
  try {
    const { values, positionals } = parseArgs({
      args,
      options: {
        output: {
          type: 'string',
          short: 'o',
        },
        threshold: {
          type: 'string',
          short: 't',
        },
        json: {
          type: 'boolean',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
      },
      allowPositionals: true,
    });

    const targetPath = positionals[0] || '.';
    const outputPath = values.output as string | undefined;
    const jsonOutput = Boolean(values.json);
    const help = Boolean(values.help);

    let largeFileThresholdBytes: number | undefined = undefined;
    if (values.threshold) {
      const mb = parseFloat(values.threshold as string);
      if (!isNaN(mb) && mb > 0) {
        largeFileThresholdBytes = mb * 1024 * 1024;
      }
    }

    return {
      targetPath,
      outputPath,
      largeFileThresholdBytes,
      jsonOutput,
      help,
    };
  } catch (error) {
    console.error('⚠️  引数の解析エラー:', error instanceof Error ? error.message : String(error));
    return {
      targetPath: '.',
      jsonOutput: false,
      help: true,
    };
  }
}

export function printHelp(): void {
  console.log(`
🔍 GitHub 公開前チェッカー (gh-check)

使用方法:
  npx gh-check [targetDir] [options]

オプション:
  -o, --output <path>    Markdown レポートを指定のパスに保存します (例: CHECK_REPORT.md)
  -t, --threshold <mb>   大容量ファイルの検出閾値をメガバイト単位で指定します (デフォルト: 10)
  --json                 結果を JSON フォーマットで標準出力に出力します
  -h, --help             このヘルプメッセージを表示します

例:
  npx gh-check .
  npx gh-check ./my-project -o ./CHECK_REPORT.md -t 5
  npx gh-check . --json
`);
}
