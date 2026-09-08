#!/usr/bin/env bash
# pixel-Asset-converter の開発環境を Linux 上に再現するスクリプト。
#
#   https://github.com/hal508986-crypto/pixel-Asset-converter
#
# 依存バージョンは同リポジトリの LICENSE/python-licenses.txt に記録された
# 参照環境に合わせて constraints.txt でピン留めしている。
#
# 使い方:
#   ./setup-linux.sh [作業ディレクトリ]      # 既定: ./pixel-asset-converter
set -euo pipefail

REPO_URL="https://github.com/hal508986-crypto/pixel-asset-converter"
TARGET="${1:-$(pwd)/pixel-asset-converter}"
CONSTRAINTS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/constraints.txt"

# CI (.github/workflows/license-audit.yml) と同じ 3.10 を使う。
PYTHON_BIN="${PYTHON_BIN:-python3.10}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "error: $PYTHON_BIN が見つからない。PYTHON_BIN で明示するか 3.10 を入れる。" >&2
  exit 1
fi

# PySide6 が libEGL.so.1 などを要求するため、GUI を使うなら先に入れておく。
# 権限がない環境ではスキップされ、CLI とテストのみ利用できる。
install_qt_libs() {
  local pkgs=(libegl1 libgl1 libxkbcommon0 libdbus-1-3 libfontconfig1 libxrender1
              libxi6 libxrandr2 libxfixes3 libxcursor1 libxcomposite1 libxdamage1
              libxtst6 libnss3 libasound2t64)
  if [ "$(id -u)" -ne 0 ] && ! command -v sudo >/dev/null 2>&1; then
    echo "warn: root でも sudo でもないため Qt 用ライブラリの導入をスキップする。" >&2
    return 0
  fi
  local apt=(apt-get)
  [ "$(id -u)" -ne 0 ] && apt=(sudo apt-get)
  "${apt[@]}" update -qq || true
  "${apt[@]}" install -y --no-install-recommends "${pkgs[@]}" \
    || echo "warn: Qt 用ライブラリの導入に失敗した。GUI は起動しない可能性がある。" >&2
}

if [ ! -d "$TARGET/.git" ]; then
  git clone "$REPO_URL" "$TARGET"
fi
cd "$TARGET"

install_qt_libs

"$PYTHON_BIN" -m venv .venv
.venv/bin/python -m pip install --upgrade pip

# constraints はバージョンを固定するだけで導入はしない。参照環境には
# Windows 由来の colorama と、click/typer が 3.10 で必要とする
# importlib-metadata・zipp が含まれるため、明示的に追加する。
.venv/bin/python -m pip install -e ".[gui,dev]" -c "$CONSTRAINTS"
.venv/bin/python -m pip install -c "$CONSTRAINTS" colorama importlib-metadata zipp

echo
echo "--- 動作確認 ---"
.venv/bin/python -c "import cv2, numpy, PIL, skimage, pydantic, typer, yaml; print('core ok', cv2.__version__)"
QT_QPA_PLATFORM=offscreen .venv/bin/python -c "from PySide6 import QtWidgets; print('PySide6 ok')" \
  || echo "warn: PySide6 が読み込めない（GUI 不可、CLI は利用可能）"

cat <<'USAGE'

セットアップ完了。

  source .venv/bin/activate
  pixel-tile compile input.png --output output/input --palette 16
  QT_QPA_PLATFORM=offscreen pytest    # GUI テストにこの指定が必要

既知の失敗 3 件については README.md を参照。
USAGE
