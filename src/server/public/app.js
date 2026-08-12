document.addEventListener('DOMContentLoaded', () => {
  const checkForm = document.getElementById('checkForm');
  const targetPathInput = document.getElementById('targetPath');
  const largeFileThresholdInput = document.getElementById('largeFileThreshold');
  const startBtn = document.getElementById('startBtn');

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

  const requiredList = document.getElementById('requiredList');
  const recommendedList = document.getElementById('recommendedList');
  const unwantedContainer = document.getElementById('unwantedContainer');
  const largeFilesContainer = document.getElementById('largeFilesContainer');
  const downloadReportBtn = document.getElementById('downloadReportBtn');

  let currentReport = null;

  // フォーム送信時
  checkForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetPath = targetPathInput.value.trim();
    const thresholdMB = parseFloat(largeFileThresholdInput.value) || 10;

    if (!targetPath) {
      showError('⚠️ プロジェクト選択エラー', 'チェック対象のプロジェクトフォルダを選択・入力してください。');
      return;
    }

    // UI初期化
    hideError();
    resultsWrapper.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    startBtn.disabled = true;

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetPath,
          thresholdMB
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'プロジェクトフォルダを読み込めませんでした。アクセス権限などを確認してください。');
      }

      currentReport = data.report;
      renderResults(currentReport);
    } catch (err) {
      showError('❌ スキャン中にエラーが発生しました', err.message || '予期せぬエラーが発生しました。');
    } finally {
      loadingSection.classList.add('hidden');
      startBtn.disabled = false;
    }
  });

  // レポートダウンロード処理
  downloadReportBtn.addEventListener('click', async () => {
    if (!currentReport) return;

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report: currentReport })
      });

      if (!response.ok) {
        throw new Error('レポート生成に失敗しました。');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CHECK_REPORT.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`レポートの保存に失敗しました: ${err.message}`);
    }
  });

  function showError(title, msg) {
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorSection.classList.remove('hidden');
  }

  function hideError() {
    errorSection.classList.add('hidden');
  }

  // 診断結果描画
  function renderResults(report) {
    // スコア表示
    totalScoreEl.textContent = report.totalScore;
    
    if (report.totalScore >= 90) {
      scoreBadgeEl.textContent = '🟢 良好 (優秀)';
      scoreBadgeEl.className = 'score-badge status-good';
    } else if (report.totalScore >= 70) {
      scoreBadgeEl.textContent = '🟡 注意 (改善推奨)';
      scoreBadgeEl.className = 'score-badge status-warn';
    } else {
      scoreBadgeEl.textContent = '🔴 要改善 (問題あり)';
      scoreBadgeEl.className = 'score-badge status-bad';
    }

    // サマリー
    sumRequiredEl.textContent = `${report.summary.passedRequired} / ${report.summary.totalRequired}`;
    sumRecommendedEl.textContent = `${report.summary.passedRecommended} / ${report.summary.totalRecommended}`;
    sumUnwantedEl.textContent = `${report.summary.unwantedCount}件`;
    sumLargeEl.textContent = `${report.largeFilesFound.length}件`;

    // 必須ファイルリスト
    requiredList.innerHTML = '';
    const reqItems = report.items.filter(i => i.category === 'REQUIRED');
    for (const item of reqItems) {
      requiredList.appendChild(createCheckItemEl(item));
    }

    // 推奨ファイルリスト
    recommendedList.innerHTML = '';
    const recItems = report.items.filter(i => i.category === 'RECOMMENDED');
    for (const item of recItems) {
      recommendedList.appendChild(createCheckItemEl(item));
    }

    // 不要ファイルコンテナ
    unwantedContainer.innerHTML = '';
    if (report.unwantedFilesFound.length > 0) {
      for (const filePath of report.unwantedFilesFound) {
        const box = document.createElement('div');
        box.className = 'file-warning-box danger';
        box.innerHTML = `
          <div class="file-warning-title">❌ ${escapeHtml(filePath)}</div>
          <div class="file-warning-desc">GitHubへ公開する際に環境変数や認証情報・キャッシュが含まれていないか確認し、削除または .gitignore へ追加してください。</div>
        `;
        unwantedContainer.appendChild(box);
      }
    } else {
      unwantedContainer.innerHTML = '<div class="clean-text">✅ 検出された不要ファイルはありません（クリーン）</div>';
    }

    // 大容量ファイルコンテナ
    largeFilesContainer.innerHTML = '';
    if (report.largeFilesFound.length > 0) {
      for (const item of report.largeFilesFound) {
        const sizeMB = (item.sizeBytes / (1024 * 1024)).toFixed(2);
        const box = document.createElement('div');
        box.className = 'file-warning-box';
        box.innerHTML = `
          <div class="file-warning-title">⚠️ ${escapeHtml(item.path)} (${sizeMB} MB)</div>
          <div class="file-warning-desc">Gitリポジトリの軽量化のため、Git LFSの使用やリポジトリ外での管理を検討してください。</div>
        `;
        largeFilesContainer.appendChild(box);
      }
    } else {
      largeFilesContainer.innerHTML = '<div class="clean-text">✅ 検出された大容量ファイルはありません</div>';
    }

    resultsWrapper.classList.remove('hidden');
    resultsWrapper.scrollIntoView({ behavior: 'smooth' });
  }

  function createCheckItemEl(item) {
    const li = document.createElement('li');
    li.className = 'check-item';

    const isOk = item.status === 'OK';
    const isWarn = item.status === 'WARNING';
    const icon = isOk ? '✅' : (isWarn ? '⚠️' : '❌');
    const badgeClass = isOk ? 'ok' : (isWarn ? 'warning' : 'missing');
    const statusText = isOk ? '検出 (OK)' : (isWarn ? '推奨' : '未検出');

    li.innerHTML = `
      <div class="check-item-header">
        <span class="check-item-name font-mono">${icon} ${escapeHtml(item.name)}</span>
        <span class="check-item-badge ${badgeClass}">${statusText}</span>
      </div>
      <div class="check-item-desc">${escapeHtml(item.message)}</div>
    `;

    return li;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
