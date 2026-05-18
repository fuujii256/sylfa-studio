// add_story_nav.js — 全ページにStoryナビリンクを追加
const fs = require('fs');
const path = require('path');

const root = 'c:\\project\\BuildStudioSylfaHP';

// ルートレベルのHTMLファイル（story.htmlは既に追加済み）
const rootFiles = ['index.html','about.html','contact.html','devlog.html','links.html','privacy.html','tools.html','works.html'];

// devlog内の記事ファイル
const devlogDir = path.join(root, 'devlog');
const devlogFiles = fs.readdirSync(devlogDir).filter(f => f.endsWith('.html'));

// ルートレベル: Devlogの後にStoryを追加
for (const file of rootFiles) {
  const fp = path.join(root, file);
  let html = fs.readFileSync(fp, 'utf-8');
  
  // ナビにStoryがなければ追加（Devlogリンクの後）
  if (!html.includes('story.html" class="nav__link">Story')) {
    html = html.replace(
      /<li><a href="devlog.html" class="nav__link">Devlog<\/a><\/li>/g,
      '<li><a href="devlog.html" class="nav__link">Devlog</a></li>\n                <li><a href="story.html" class="nav__link">Story</a></li>'
    );
  }
  
  // フッターにStoryがなければ追加（Devlogの後）
  if (!html.includes('>Story</a></li>') || html.split('>Story</a></li>').length < 3) {
    // フッターのDevlogリンクの後にStory追加
    html = html.replace(
      /<li><a href="devlog.html">Devlog<\/a><\/li>\s*\n(\s*<li><a href="works.html">)/g,
      '<li><a href="devlog.html">Devlog</a></li>\n                        <li><a href="story.html">Story</a></li>\n$1'
    );
  }
  
  fs.writeFileSync(fp, html, 'utf-8');
  console.log('Updated: ' + file);
}

// devlog記事: ../story.html形式で追加
for (const file of devlogFiles) {
  const fp = path.join(devlogDir, file);
  let html = fs.readFileSync(fp, 'utf-8');
  
  // ナビにStoryがなければ追加
  if (!html.includes('story.html" class="nav__link">Story')) {
    html = html.replace(
      /<li><a href="\.\.\/devlog.html" class="nav__link">Devlog<\/a><\/li>/g,
      '<li><a href="../devlog.html" class="nav__link">Devlog</a></li>\n                <li><a href="../story.html" class="nav__link">Story</a></li>'
    );
  }
  
  // フッターにStoryがなければ追加
  if (!html.includes('../story.html">Story')) {
    html = html.replace(
      /<li><a href="\.\.\/devlog.html">Devlog<\/a><\/li>\s*\n(\s*<li><a href="\.\.\/)/g,
      '<li><a href="../devlog.html">Devlog</a></li>\n                        <li><a href="../story.html">Story</a></li>\n$1'
    );
  }
  
  fs.writeFileSync(fp, html, 'utf-8');
  console.log('Updated: devlog/' + file);
}

console.log('\nAll navigation updated.');
