// build_episodes.js — 原稿テキストからエピソードHTMLを生成
// Node.js で実行: node build_episodes.js
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'LuminusArchive元原稿');
const outDir = __dirname;

const episodes = [
  { src: '第01話_リライト版.txt',   out: 'ep01.html', n: 1 },
  { src: '第02話_リライト版.txt',   out: 'ep02.html', n: 2 },
  { src: '第03話_リライト版.txt',   out: 'ep03.html', n: 3 },
  { src: '第04話_リライト版.txt',   out: 'ep04.html', n: 4 },
  { src: '第05話_リライト版.txt',   out: 'ep05.html', n: 5 },
  { src: '第06話_リライト版.txt',   out: 'ep06.html', n: 6 },
  { src: '第07話_リライト版.txt',   out: path.join('unpublished', 'ep07.html'), n: 7, unpublished: true },
  { src: '第08話_リライト版2.txt',  out: path.join('unpublished', 'ep08.html'), n: 8, unpublished: true },
  { src: '第09話_リライト版2.txt',  out: path.join('unpublished', 'ep09.html'), n: 9, unpublished: true },
  { src: '第10話_リライト版2.txt',  out: path.join('unpublished', 'ep10.html'), n: 10, unpublished: true },
  { src: '第11話_リライト版2.txt',  out: path.join('unpublished', 'ep11.html'), n: 11, unpublished: true },
  { src: '第12話_リライト版2.txt',  out: path.join('unpublished', 'ep12.html'), n: 12, unpublished: true },
  { src: '第13話_リライト版2.txt',  out: path.join('unpublished', 'ep13.html'), n: 13, unpublished: true },
];

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function convertText(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);
  let title = '';
  const bodyParts = [];

  // ト書き行を一時的に蓄積し、連続する行をまとめて出力するためのバッファ
  let stageBuffer = [];

  // 蓄積されたト書きをHTMLとしてフラッシュする
  function flushStage() {
    if (stageBuffer.length === 0) return;
    // 各行を整形: 【ラベル】内容 → <strong>ラベル</strong> 内容
    const formatted = stageBuffer.map(s => {
      const escaped = esc(s);
      return escaped.replace(/【([^】]+)】/g, '<strong>$1</strong>　');
    });
    bodyParts.push(`                    <div class="story__atmosphere">${formatted.join('<br>')}</div>`);
    stageBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) { flushStage(); continue; }
    // ヘッダー行スキップ
    if (t.startsWith('Luminus Archive')) { flushStage(); continue; }
    if (t.startsWith('\u300C\u3046\u3057\u306A\u308F\u308C\u305F') || t.startsWith('\u300C\u5931\u308F\u308C\u305F')) { flushStage(); continue; }
    // エピソードタイトル
    if (t.startsWith('\u25A0')) {
      flushStage();
      title = t.replace(/^\u25A0\s*/, '');
      continue;
    }
    // 場面転換
    if (t === '---') {
      flushStage();
      bodyParts.push('                    <div class="story__scene-break">\u2726 \u2726 \u2726</div>');
      continue;
    }
    // ト書き（【で始まる行）→ バッファに蓄積
    if (t.startsWith('\u3010')) {
      stageBuffer.push(t);
      continue;
    }
    // ト書き以外が来たらバッファをフラッシュ
    flushStage();
    // ??メモ → スキップ
    if (t.startsWith('??')) continue;
    // エピソード終了マーカー — 「了」を「つづく」に変更
    if (/^\u2015{2}.+\u4E86\u2015{2}$/.test(t) || /^——.+了——$/.test(t)) {
      const replaced = esc(t).replace(/了/, 'つづく');
      bodyParts.push(`                    <div class="story__ending">${replaced}</div>`);
      continue;
    }
    // 会話文（「で始まる）— 閉じ」がなければ後続行を結合
    if (t.startsWith('\u300C')) {
      let dialogue = t;
      while (!dialogue.includes('\u300D') && i + 1 < lines.length) {
        i++;
        const next = lines[i].trim();
        if (!next) continue; // 空行はスキップして次を読む
        dialogue += '<br>' + next;
      }
      bodyParts.push(`                    <p class="dialogue">${esc(dialogue).replace(/&lt;br&gt;/g, '<br>')}</p>`);
      continue;
    }
    // 思考・回想（——で始まる）
    if (t.startsWith('——') || t.startsWith('\u2015\u2015')) {
      bodyParts.push(`                    <p class="thought">${esc(t)}</p>`);
      continue;
    }
    // 通常の地の文
    bodyParts.push(`                    <p>${esc(t)}</p>`);
  }
  flushStage(); // 末尾に残ったバッファをフラッシュ

  return { title, body: bodyParts.join('\n') };
}

function pad(n) { return String(n).padStart(2, '0'); }

for (const ep of episodes) {
  const srcPath = path.join(srcDir, ep.src);
  if (!fs.existsSync(srcPath)) { console.warn('Not found:', srcPath); continue; }

  const { title, body } = convertText(srcPath);
  const n = ep.n;
  const np = pad(n);
  // タイトルからエピソード番号部分を除去
  const dt = title.replace(/^第\d+話[：:]\s*/, '');

  const prev = n > 1
    ? `                    <a href="ep${pad(n-1)}.html">&larr; 第${n-1}話</a>`
    : '                    <span></span>';
  const next = n < 13 && n !== 6
    ? `                    <a href="ep${pad(n+1)}.html">第${n+1}話 &rarr;</a>`
    : '                    <span></span>';

  let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-9V3EP5FGPM"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-9V3EP5FGPM');
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>第${n}話：${dt} — Luminus Archive | しるふぁ工房</title>
    <meta name="description" content="Luminus Archive 第${n}話「${dt}」— うしなわれたルミのきおく。ときをこえて、おもいをつなぐものがたり。">
    <meta property="og:title" content="第${n}話：${dt} — Luminus Archive">
    <meta property="og:type" content="article">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="icon" href="../assets/images/nav_icon.png" type="image/png">
    <link rel="stylesheet" href="story.css">
</head>
<body>
    <nav class="nav" role="navigation" aria-label="メインナビゲーション">
        <div class="nav__inner">
            <a href="../index.html" class="nav__logo">
                <img src="../assets/images/nav_icon.png" alt="" class="nav__logo-img" aria-hidden="true">
                <span>しるふぁ工房</span>
            </a>
            <ul class="nav__menu" role="list">
                <li><a href="../index.html" class="nav__link">Home</a></li>
                <li><a href="../devlog.html" class="nav__link">Devlog</a></li>
                <li><a href="../story.html" class="nav__link">Story</a></li>
                <li><a href="../works.html" class="nav__link">Works</a></li>
                <li><a href="../tools.html" class="nav__link">Tools</a></li>
                <li><a href="../about.html" class="nav__link">About</a></li>
                <li><a href="../links.html" class="nav__link">Links</a></li>
                <li><a href="../contact.html" class="nav__link">Contact</a></li>
            </ul>
            <button class="nav__hamburger" aria-label="メニューを開く" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>

    <main>
        <section class="section section--sm">
            <article class="story">
                <header class="story__header">
                    <span class="story__episode">EPISODE ${np}</span>
                    <h1 class="story__title">${dt}</h1>
                    <span class="story__series">Luminus Archive</span>
                </header>
                <div class="story__body">
${body}
                </div>
                <nav class="story-nav">
${prev}
                    <a href="../story.html" class="story-nav__center">目次へ戻る</a>
${next}
                </nav>
            </article>
        </section>
    </main>

    <footer class="footer" role="contentinfo">
        <div class="container">
            <div class="footer__inner">
                <div class="footer__brand">
                    <div class="footer__logo">
                        <img src="../assets/images/nav_icon.png" alt="" class="nav__logo-img" aria-hidden="true">
                        しるふぁ工房
                    </div>
                    <p class="footer__tagline">想いを記録にかえて、未来を紡ぐ。</p>
                </div>
                <nav aria-label="フッターナビゲーション1">
                    <p class="footer__nav-title">Pages</p>
                    <ul class="footer__nav-list" role="list">
                        <li><a href="../index.html">Home</a></li>
                        <li><a href="../devlog.html">Devlog</a></li>
                        <li><a href="../story.html">Story</a></li>
                        <li><a href="../works.html">Works</a></li>
                        <li><a href="../tools.html">Tools</a></li>
                        <li><a href="../about.html">About</a></li>
                        <li><a href="../links.html">Links</a></li>
                    </ul>
                </nav>
                <nav aria-label="フッターナビゲーション2">
                    <p class="footer__nav-title">Info</p>
                    <ul class="footer__nav-list" role="list">
                        <li><a href="../contact.html">Contact</a></li>
                        <li><a href="../privacy.html">Privacy Policy</a></li>
                    </ul>
                </nav>
            </div>
            <div class="footer__bottom">
                <p class="footer__copy">&copy; 2026 しるふぁ工房 / sylfa Studio. All rights reserved.</p>
                <div class="footer__links">
                    <a href="../contact.html">Contact</a>
                    <a href="../privacy.html">Privacy</a>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`;

  if (ep.unpublished) {
    html = html
      .replace(/href="\.\.\//g, 'href="../../')
      .replace(/src="\.\.\//g, 'src="../../')
      .replace('href="story.css"', 'href="../story.css"');

    if (n === 7) {
      html = html.replace('href="ep06.html"', 'href="../ep06.html"');
    }
  }

  const outPath = path.join(outDir, ep.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`OK: ${ep.out} — ${dt}`);
}

console.log('\nAll episodes generated.');
