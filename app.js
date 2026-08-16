document.addEventListener('DOMContentLoaded', () => {
  const checkForm = document.getElementById('checkForm');
  const targetPathInput = document.getElementById('targetPath');
  const largeFileThresholdInput = document.getElementById('largeFileThreshold');
  const startBtn = document.getElementById('startBtn');
  const folderInput = document.getElementById('folderInput');
  const dropZone = document.getElementById('dropZone');

  const loadingSection = document.getElementById('loadingSection');
  const errorSection = document.getElementById('errorSection');
  const errorTitle = document.getElementById('errorTitle');
  const errorMessage = document.getElementById('errorMessage');
  const resultsWrapper = document.getElementById('resultsWrapper');

  const totalScoreEl = document.getElementById('totalScore');
  const scoreBadgeEl = document.getElementById('scoreBadge');
  const sumRequiredEl = document.getElementById('sumRequired');
  const sumRecommendedEl = document.getElementById('sumRecommended');
  const sumUnwantedEl = document.getElementById('sumUnwanted');
  const sumLargeEl = document.getElementById('sumLarge');

  const requiredListEl = document.getElementById('requiredList');
  const recommendedListEl = document.getElementById('recommendedList');
  const unwantedContainerEl = document.getElementById('unwantedContainer');
  const largeFilesContainerEl = document.getElementById('largeFilesContainer');
  const downloadReportBtn = document.getElementById('downloadReportBtn');

  let currentReportMarkdown = '';

  // サーバーAPIが利用可能かチェック
  let isServerAvailable = false;
  fetch('/api/health')
    .then(res => {
      if (res.ok) {
        isServerAvailable = true;
        const pathInputSection = document.getElementById('pathInputSection');
        const pathSubmitGroup = document.getElementById('pathSubmitGroup');
        if (pathInputSection) pathInputSection.style.display = 'block';
        if (pathSubmitGroup) pathSubmitGroup.style.display = 'block';
        const badge = document.getElementById('runtimeBadge');
        if (badge) badge.textContent = 'LOCAL API CONNECTED';
      }
    })
    .catch(() => {
      isServerAvailable = false;
    });

  // ドラッグ＆ドロップイベント
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      handleDataTransferItems(items);
    } else if (e.dataTransfer.files.length > 0) {
      handleFileList(e.dataTransfer.files);
    }
  });

  folderInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileList(e.target.files);
    }
  });

  // ファイルリストからブラウザ内で直接静的スキャンを実行
  async function handleFileList(files) {
    showLoading();
    try {
      const thresholdMB = parseInt(largeFileThresholdInput.value, 10) || 10;
      const thresholdBytes = thresholdMB * 1024 * 1024;
      
      const fileListArray = Array.from(files);
      const report = analyzeFilesClientSide(fileListArray, thresholdBytes);
      
      hideLoading();
      renderResults(report);
    } catch (err) {
      hideLoading();
      showError('スキャンエラー', err.message || 'ブラウザ内スキャン中にエラーが発生しました');
    }
  }

  // DataTransferItems (ディレクトリ再帰)
  async function handleDataTransferItems(items) {
    showLoading();
    try {
      const thresholdMB = parseInt(largeFileThresholdInput.value, 10) || 10;
      const thresholdBytes = thresholdMB * 1024 * 1024;
      
      const fileEntries = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            await traverseFileTree(entry, '', fileEntries);
          }
        }
      }

      if (fileEntries.length === 0) {
        throw new Error('有効なファイルが検出されませんでした。');
      }

      const report = analyzeFilesClientSide(fileEntries, thresholdBytes);
      hideLoading();
      renderResults(report);
    } catch (err) {
      hideLoading();
      showError('スキャンエラー', err.message || 'フォルダの走査中にエラーが発生しました');
    }
  }

  async function traverseFileTree(item, currentPath, result) {
    if (item.isFile) {
      return new Promise((resolve) => {
        item.file((file) => {
          result.push({
            name: file.name,
            size: file.size,
            webkitRelativePath: currentPath ? currentPath + '/' + file.name : file.name
          });
          resolve();
        });
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const readEntries = async () => {
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve();
            } else {
              for (const child of entries) {
                await traverseFileTree(child, currentPath ? currentPath + '/' + item.name : item.name, result);
              }
              await readEntries();
              resolve();
            }
          });
        });
      };
      await readEntries();
    }
  }

  // クライアントサイド分析エンジン
  function analyzeFilesClientSide(files, largeFileThresholdBytes) {
    const UNWANTED_PATTERNS = [
      'node_modules', 'temp', 'cache', '.log', '.tmp', '.env', '.DS_Store', 'Thumbs.db'
    ];

    const REQUIRED_FILES = [
      { name: 'README.md', key: 'readme' },
      { name: 'LICENSE', key: 'license', aliases: ['LICENSE.txt', 'LICENSE.md'] },
      { name: '.gitignore', key: 'gitignore' },
      { name: 'package.json', key: 'package_json' }
    ];

    const RECOMMENDED_ITEMS = [
      { name: 'CHANGELOG.md', key: 'changelog', aliases: ['CHANGELOG', 'CHANGELOG.txt'] },
      { name: 'CONTRIBUTING.md', key: 'contributing', aliases: ['CONTRIBUTING', 'CONTRIBUTING.txt'] },
      { name: 'docs フォルダ', key: 'docs', isDir: true, pathName: 'docs' }
    ];

    // ルートフォルダ名の除去ヘルパー
    const relativePaths = files.map(f => {
      let p = f.webkitRelativePath || f.name;
      // 最初のセグメントがフォルダ名の場合のトリム
      const parts = p.split('/');
      if (parts.length > 1) {
        parts.shift();
        p = parts.join('/');
      }
      return { path: p, size: f.size, originalPath: f.webkitRelativePath || f.name };
    });

    const rootFileNames = new Set(
      relativePaths.filter(f => !f.path.includes('/')).map(f => f.path)
    );
    const hasDocsDir = relativePaths.some(f => f.path.startsWith('docs/'));

    // 1. 必須ファイル
    const requiredResults = REQUIRED_FILES.map(item => {
      let found = rootFileNames.has(item.name);
      let foundName = item.name;
      if (!found && item.aliases) {
        for (const a of item.aliases) {
          if (rootFileNames.has(a)) {
            found = true;
            foundName = a;
            break;
          }
        }
      }
      return {
        id: `required-${item.key}`,
        name: `${item.name} 存在確認`,
        category: 'REQUIRED',
        status: found ? 'OK' : 'MISSING',
        message: found ? `検出されました (${foundName})` : `必須ファイル ${item.name} が存在しません`,
        scoreImpact: found ? 0 : -20
      };
    });

    // 2. 推奨ファイル
    const recommendedResults = RECOMMENDED_ITEMS.map(item => {
      if (item.isDir) {
        return {
          id: `recommended-${item.key}`,
          name: `${item.name} 存在確認`,
          category: 'RECOMMENDED',
          status: hasDocsDir ? 'OK' : 'WARNING',
          message: hasDocsDir ? '検出されました (docs/)' : '推奨 docs フォルダがありません（任意）',
          scoreImpact: hasDocsDir ? 0 : -5
        };
      }
      let found = rootFileNames.has(item.name);
      let foundName = item.name;
      if (!found && item.aliases) {
        for (const a of item.aliases) {
          if (rootFileNames.has(a)) {
            found = true;
            foundName = a;
            break;
          }
        }
      }
      return {
        id: `recommended-${item.key}`,
        name: `${item.name} 存在確認`,
        category: 'RECOMMENDED',
        status: found ? 'OK' : 'WARNING',
        message: found ? `検出されました (${foundName})` : `推奨ファイル ${item.name} がありません（任意）`,
        scoreImpact: found ? 0 : -5
      };
    });

    // 3. 不要・機密ファイル
    const unwantedFiles = [];
    const largeFiles = [];

    relativePaths.forEach(f => {
      const fileName = f.path.split('/').pop() || f.path;
      const isUnwanted = UNWANTED_PATTERNS.some(pat => {
        if (pat.startsWith('.')) return fileName.endsWith(pat) || f.path.includes('/' + pat) || f.path.startsWith(pat);
        return f.path.toLowerCase().includes(pat.toLowerCase());
      });
      if (isUnwanted) {
        unwantedFiles.push(f.path);
      }
      if (f.size >= largeFileThresholdBytes) {
        largeFiles.push({ path: f.path, sizeBytes: f.size });
      }
    });

    // 4. スコア計算
    let score = 100;
    requiredResults.forEach(r => { score += r.scoreImpact; });
    recommendedResults.forEach(r => { score += r.scoreImpact; });
    score -= unwantedFiles.length * 10;
    score -= largeFiles.length * 10;
    if (score < 0) score = 0;

    let overallRating = '良好 (Good)';
    let overallRatingCode = 'GOOD';
    if (score < 70) {
      overallRating = '要修正 (Critical)';
      overallRatingCode = 'CRITICAL';
    } else if (score < 90) {
      overallRating = '注意 (Warning)';
      overallRatingCode = 'WARNING';
    }

    // Markdownレポート生成
    const md = generateMarkdownReport({
      totalScore: score,
      overallRating,
      required: requiredResults,
      recommended: recommendedResults,
      unwantedFiles,
      largeFiles,
      largeFileThresholdMB: Math.round(largeFileThresholdBytes / (1024 * 1024))
    });

    return {
      totalScore: score,
      overallRating,
      overallRatingCode,
      categoryScores: {
        required: { score: 100 + requiredResults.reduce((acc, r) => acc + r.scoreImpact, 0), max: 100 },
        recommended: { score: 100 + recommendedResults.reduce((acc, r) => acc + r.scoreImpact, 0), max: 100 }
      },
      details: {
        required: requiredResults,
        recommended: recommendedResults,
        unwantedFiles,
        largeFiles
      },
      markdownReport: md
    };
  }

  function generateMarkdownReport(data) {
    let md = '# 🛡️ GitHub公開前チェック レポート\n\n';
    md += `**診断日時**: ${new Date().toLocaleString()}\n`;
    md += `**総合スコア**: ${data.totalScore} / 100 (${data.overallRating})\n\n---\n\n`;
    md += '## 📋 必須ファイル\n';
    data.required.forEach(r => {
      md += `- [${r.status === 'OK' ? 'x' : ' '}] ${r.name}: ${r.message}\n`;
    });
    md += '\n## 📚 推奨ファイル\n';
    data.recommended.forEach(r => {
      md += `- [${r.status === 'OK' ? 'x' : ' '}] ${r.name}: ${r.message}\n`;
    });
    md += '\n## ⚠️ 不要・機密ファイル (' + data.unwantedFiles.length + '件)\n';
    if (data.unwantedFiles.length === 0) {
      md += '- なし（安全）\n';
    } else {
      data.unwantedFiles.forEach(u => { md += `- ${u}\n`; });
    }
    md += `\n## 🐘 大容量ファイル (>${data.largeFileThresholdMB}MB, ${data.largeFiles.length}件)\n`;
    if (data.largeFiles.length === 0) {
      md += '- なし（安全）\n';
    } else {
      data.largeFiles.forEach(l => {
        md += `- ${l.path} (${(l.sizeBytes / (1024 * 1024)).toFixed(2)} MB)\n`;
      });
    }
    return md;
  }

  // サーバーの CheckReport オブジェクトを Web UI 表示用フォーマットに変換
  function adaptCheckReportToViewData(report, thresholdMB) {
    const required = (report.items || []).filter(i => i.category === 'REQUIRED');
    const recommended = (report.items || []).filter(i => i.category === 'RECOMMENDED');
    const unwantedFiles = report.unwantedFilesFound || [];
    const largeFiles = report.largeFilesFound || [];

    let overallRating = '良好 (Good)';
    let overallRatingCode = 'GOOD';
    if (report.totalScore < 70) {
      overallRating = '要修正 (Critical)';
      overallRatingCode = 'CRITICAL';
    } else if (report.totalScore < 90) {
      overallRating = '注意 (Warning)';
      overallRatingCode = 'WARNING';
    }

    const md = generateMarkdownReport({
      totalScore: report.totalScore,
      overallRating,
      required,
      recommended,
      unwantedFiles,
      largeFiles,
      largeFileThresholdMB: thresholdMB || 10
    });

    return {
      totalScore: report.totalScore,
      overallRating,
      overallRatingCode,
      categoryScores: {
        required: { score: 100 + required.reduce((acc, r) => acc + (r.scoreImpact || 0), 0), max: 100 },
        recommended: { score: 100 + recommended.reduce((acc, r) => acc + (r.scoreImpact || 0), 0), max: 100 }
      },
      details: {
        required,
        recommended,
        unwantedFiles,
        largeFiles
      },
      markdownReport: md
    };
  }

  // フォーム送信（ローカルAPIが利用可能な場合のパススキャン）
  checkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetPath = targetPathInput.value.trim();
    if (!targetPath) return;

    if (!isServerAvailable) {
      alert('ブラウザ単体でご利用の場合は、上のエリアにフォルダをドラッグ＆ドロップするか「フォルダを選択」ボタンをご利用ください。');
      return;
    }

    showLoading();
    try {
      const thresholdMB = parseInt(largeFileThresholdInput.value, 10) || 10;
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath,
          largeFileThresholdMB: thresholdMB
        })
      });

      const data = await response.json();
      hideLoading();

      if (!response.ok || !data.success) {
        const errMsg = typeof data.error === 'string' ? data.error : (data.error?.message || '診断に失敗しました');
        showError('CHECK_ERROR', errMsg);
        return;
      }

      const viewData = adaptCheckReportToViewData(data.report, thresholdMB);
      renderResults(viewData);
    } catch (err) {
      hideLoading();
      showError('FETCH_ERROR', err.message || 'サーバーとの通信に失敗しました');
    }
  });

  function showLoading() {
    resultsWrapper.classList.add('hidden');
    errorSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
  }

  function hideLoading() {
    loadingSection.classList.add('hidden');
  }

  function showError(title, message) {
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
  }

  function renderResults(data) {
    currentReportMarkdown = data.markdownReport || '';
    errorSection.classList.add('hidden');
    resultsWrapper.classList.remove('hidden');

    totalScoreEl.textContent = data.totalScore;
    scoreBadgeEl.className = 'score-badge';
    if (data.overallRatingCode === 'GOOD' || data.totalScore >= 90) {
      scoreBadgeEl.classList.add('status-good');
      scoreBadgeEl.textContent = '🟢 良好';
    } else if (data.overallRatingCode === 'WARNING' || data.totalScore >= 70) {
      scoreBadgeEl.classList.add('status-warning');
      scoreBadgeEl.textContent = '🟡 注意';
    } else {
      scoreBadgeEl.classList.add('status-danger');
      scoreBadgeEl.textContent = '🔴 要修正';
    }

    const reqOkCount = data.details.required.filter(r => r.status === 'OK').length;
    sumRequiredEl.textContent = `${reqOkCount} / ${data.details.required.length}`;
    const recOkCount = data.details.recommended.filter(r => r.status === 'OK').length;
    sumRecommendedEl.textContent = `${recOkCount} / ${data.details.recommended.length}`;
    sumUnwantedEl.textContent = `${data.details.unwantedFiles.length}件`;
    sumLargeEl.textContent = `${data.details.largeFiles.length}件`;

    renderList(requiredListEl, data.details.required);
    renderList(recommendedListEl, data.details.recommended);
    renderUnwanted(unwantedContainerEl, data.details.unwantedFiles);
    renderLargeFiles(largeFilesContainerEl, data.details.largeFiles);
  }

  function renderList(container, items) {
    container.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'check-item';
      const isOk = item.status === 'OK';
      li.innerHTML = `
        <div class="check-item-header">
          <span class="status-indicator ${isOk ? 'ok' : item.status === 'WARNING' ? 'warning' : 'missing'}">
            ${isOk ? '✓' : '!'}
          </span>
          <span class="check-item-title">${escapeHtml(item.name)}</span>
        </div>
        <p class="check-item-desc">${escapeHtml(item.message)}</p>
      `;
      container.appendChild(li);
    });
  }

  function renderUnwanted(container, files) {
    container.innerHTML = '';
    if (!files || files.length === 0) {
      container.innerHTML = '<p class="empty-state">不要なファイル・フォルダは検出されませんでした（安全です）</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'file-alert-list';
    files.forEach(file => {
      const li = document.createElement('li');
      li.className = 'file-alert-item danger';
      li.innerHTML = `<span class="file-name font-mono">${escapeHtml(file)}</span>`;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function renderLargeFiles(container, files) {
    container.innerHTML = '';
    if (!files || files.length === 0) {
      container.innerHTML = '<p class="empty-state">大容量ファイルは検出されませんでした（安全です）</p>';
      return;
    }
    const ul = document.createElement('ul');
    ul.className = 'file-alert-list';
    files.forEach(f => {
      const li = document.createElement('li');
      li.className = 'file-alert-item warning';
      const sizeMB = (f.sizeBytes / (1024 * 1024)).toFixed(2);
      li.innerHTML = `
        <span class="file-name font-mono">${escapeHtml(f.path)}</span>
        <span class="file-size font-mono">${sizeMB} MB</span>
      `;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  downloadReportBtn.addEventListener('click', () => {
    if (!currentReportMarkdown) return;
    const blob = new Blob([currentReportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-prepublish-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});
