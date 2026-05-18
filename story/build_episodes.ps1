# build_episodes.ps1
# 原稿テキストファイルからエピソードHTMLを自動生成するスクリプト
# 【背景】等のト書きは除去し、物語テキストのみを読みやすいHTMLに変換する

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# エピソード定義: ファイル名 → 出力ファイル名
$episodes = @(
    @{ Src = "第01話_リライト版.txt";   Out = "ep01.html"; Num = 1 },
    @{ Src = "第02話_リライト版.txt";   Out = "ep02.html"; Num = 2 },
    @{ Src = "第03話_リライト版.txt";   Out = "ep03.html"; Num = 3 },
    @{ Src = "第04話_リライト版.txt";   Out = "ep04.html"; Num = 4 },
    @{ Src = "第05話_リライト版.txt";   Out = "ep05.html"; Num = 5 },
    @{ Src = "第06話_リライト版.txt";   Out = "ep06.html"; Num = 6 },
    @{ Src = "第07話_リライト版.txt";   Out = "unpublished\ep07.html"; Num = 7; Unpublished = $true },
    @{ Src = "第08話_リライト版2.txt";  Out = "unpublished\ep08.html"; Num = 8; Unpublished = $true },
    @{ Src = "第09話_リライト版2.txt";  Out = "unpublished\ep09.html"; Num = 9; Unpublished = $true },
    @{ Src = "第10話_リライト版2.txt";  Out = "unpublished\ep10.html"; Num = 10; Unpublished = $true },
    @{ Src = "第11話_リライト版2.txt";  Out = "unpublished\ep11.html"; Num = 11; Unpublished = $true },
    @{ Src = "第12話_リライト版2.txt";  Out = "unpublished\ep12.html"; Num = 12; Unpublished = $true },
    @{ Src = "第13話_リライト版2.txt";  Out = "unpublished\ep13.html"; Num = 13; Unpublished = $true }
)

$srcDir = Join-Path $PSScriptRoot "LuminusArchive元原稿"
$outDir = $PSScriptRoot

function Convert-StoryToHtml {
    param([string]$FilePath)

    $text = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
    $lines = $text -split "`r?`n"

    $title = ""
    $bodyHtml = ""
    $inHeader = $true

    foreach ($line in $lines) {
        $trimmed = $line.Trim()

        # ヘッダー行（タイトル・サブタイトル）をスキップ
        if ($trimmed -match "^Luminus Archive") { continue }
        if ($trimmed -match "^「うしなわれた" -or $trimmed -match "^「失われた") { continue }

        # エピソードタイトル抽出
        if ($trimmed -match "^■\s*(.+)$") {
            $title = $Matches[1]
            $inHeader = $false
            continue
        }

        # 空行
        if ($trimmed -eq "") { continue }

        # 場面転換区切り
        if ($trimmed -eq "---") {
            $bodyHtml += "                    <div class=`"story__scene-break`">✦ ✦ ✦</div>`n`n"
            continue
        }

        # ト書き行（【xxx】で始まる） → スキップ
        if ($trimmed -match "^【") { continue }

        # フェードアウト等の演出指示 → スキップ
        if ($trimmed -match "^【フェード") { continue }

        # エピソード終了マーカー
        if ($trimmed -match "^——.+了——$" -or $trimmed -match "^——.+了\s*——$") {
            $bodyHtml += "                    <div class=`"story__ending`">$trimmed</div>`n"
            continue
        }

        # ??マーカー（メモ・注釈）→ スキップ
        if ($trimmed -match "^(\?\?|——).*(\?\?|——)$" -and $trimmed -notmatch "了") { continue }
        if ($trimmed -match "^\?\?") { continue }

        # HTMLエスケープ
        $escaped = $trimmed.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;")

        # 会話文（「」で始まる）
        if ($escaped -match "^「") {
            $bodyHtml += "                    <p class=`"dialogue`">$escaped</p>`n"
            continue
        }

        # 思考・回想（——で始まる）
        if ($escaped -match "^——") {
            $bodyHtml += "                    <p class=`"thought`">$escaped</p>`n"
            continue
        }

        # 通常の地の文
        $bodyHtml += "                    <p>$escaped</p>`n"
    }

    return @{ Title = $title; Body = $bodyHtml }
}

foreach ($ep in $episodes) {
    $srcPath = Join-Path $srcDir $ep.Src
    if (-not (Test-Path $srcPath)) {
        Write-Warning "Not found: $srcPath"
        continue
    }

    $result = Convert-StoryToHtml -FilePath $srcPath
    $num = $ep.Num
    $numPad = "{0:D2}" -f $num
    $title = $result.Title
    $bodyHtml = $result.Body

    # タイトルからエピソード番号部分を分離（例: "第1話：タイトル" → "タイトル"）
    $displayTitle = $title -replace "^第\d+話[：:]\s*", ""

    # 前後エピソードリンク
    $prevLink = ""
    $nextLink = ""
    if ($num -gt 1) {
        $prevNum = "{0:D2}" -f ($num - 1)
        $prevEp = $episodes | Where-Object { $_.Num -eq ($num - 1) }
        $prevTitle = ""
        if ($prevEp) {
            $prevSrc = Join-Path $srcDir $prevEp.Src
            if (Test-Path $prevSrc) {
                $prevResult = Convert-StoryToHtml -FilePath $prevSrc
                $prevTitle = $prevResult.Title -replace "^第\d+話[：:]\s*", ""
            }
        }
        $prevLink = "                    <a href=`"ep$prevNum.html`">&larr; 第$($num-1)話</a>"
    } else {
        $prevLink = "                    <span></span>"
    }
    if ($num -lt 13 -and $num -ne 6) {
        $nextNum = "{0:D2}" -f ($num + 1)
        $nextLink = "                    <a href=`"ep$nextNum.html`">第$($num+1)話 &rarr;</a>"
    } else {
        $nextLink = "                    <span></span>"
    }

    $html = @"
<!DOCTYPE html>
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
    <title>第${num}話：${displayTitle} — Luminus Archive | しるふぁ工房</title>
    <meta name="description" content="Luminus Archive 第${num}話「${displayTitle}」— うしなわれたルミのきおく。">
    <meta property="og:title" content="第${num}話：${displayTitle} — Luminus Archive | しるふぁ工房">
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
                    <span class="story__episode">EPISODE ${numPad}</span>
                    <h1 class="story__title">${displayTitle}</h1>
                    <span class="story__series">Luminus Archive</span>
                </header>

                <div class="story__body">
${bodyHtml}
                </div>

                <nav class="story-nav">
${prevLink}
                    <a href="../story.html" class="story-nav__center">目次へ戻る</a>
${nextLink}
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

</html>
"@

    $outPath = Join-Path $outDir $ep.Out
    if ($ep.Unpublished) {
        $html = $html.Replace('href="../', 'href="../../')
        $html = $html.Replace('src="../', 'src="../../')
        $html = $html.Replace('href="story.css"', 'href="../story.css"')
        if ($num -eq 7) {
            $html = $html.Replace('href="ep06.html"', 'href="../ep06.html"')
        }
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outPath) | Out-Null
    [System.IO.File]::WriteAllText($outPath, $html, [System.Text.Encoding]::UTF8)
    Write-Output "Generated: $($ep.Out) - $displayTitle"
}

Write-Output "`nAll episodes generated successfully."
