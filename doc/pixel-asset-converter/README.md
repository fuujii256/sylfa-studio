# pixel-Asset-converter 開発環境の再現メモ

対象: https://github.com/hal508986-crypto/pixel-Asset-converter

上流リポジトリ本体には手を入れず、Linux 上で開発環境を再現するための記録を
ここに置く。しるふぁ工房HPのコンテンツではなく、作業環境の覚書。

## 手順

```bash
./setup-linux.sh [作業ディレクトリ]   # 既定: ./pixel-asset-converter
```

やっていること。

1. リポジトリを clone（未取得の場合）
2. Qt が要求するシステムライブラリを apt で導入（`libEGL.so.1` ほか。PySide6 に必要）
3. Python 3.10 の venv を作成 — CI の `.github/workflows/license-audit.yml` と同じ系列
4. `pip install -e ".[gui,dev]" -c constraints.txt` で依存を導入
5. `colorama` / `importlib-metadata` / `zipp` を追加導入

`constraints.txt` のバージョンは、上流の `LICENSE/python-licenses.txt` に記録された
参照環境から起こしている。constraints はバージョンを固定するだけで導入はしないため、
参照環境にあって Linux では自動で入らない 3 パッケージは 5 で明示的に追加する。
これで参照環境とのバージョン差はなくなる。

## 使い方

```bash
source .venv/bin/activate
pixel-tile --help
pixel-tile compile input.png --output output/input --palette 16
QT_QPA_PLATFORM=offscreen pytest
```

GUI テストは Qt の描画先を要求するので `QT_QPA_PLATFORM=offscreen` が要る。
ヘッドレスで GUI 本体を起動する場合も同じ。

## 確認済みの動作

Python 3.10.20 / Pillow 12.0.0 / numpy 2.2.6 / opencv-python 4.13.0.90 /
scikit-image 0.25.2 / scipy 1.15.3 / typer 0.25.1 / PySide6 6.11.1 / pytest 9.1.1

- `pixel-tile compile` が `final.png` / `ir.json` / `metadata.json` / `debug/` を出力する
- `MainWindow` が offscreen で起動する
- `pytest` は 280 passed, 3 failed

## 既知の失敗 3 件

いずれも環境構築の不備ではなく、上流の成果物が Windows で作られていることに起因する。

### `test_license_audit.py`（2 件）と `scripts/generate_licenses.py --check`

- **`test_committed_license_outputs_are_reproducible_in_the_current_environment`**
  コミット済みの `LICENSE/` 一式が Windows で生成されている。差分の中身は wheel の
  同梱物の違いで、たとえば numpy が Windows では `numpy.libs\libscipy_openblas*.dll`、
  Linux では `numpy.libs/libscipy_openblas*.so` に加えて `libquadmath`
  （LGPL-2.1-or-later）が増える。バージョンを完全一致させても Linux では解消しない。
  同じ理由で、上流 CI（`runs-on: ubuntu-latest`）のこのジョブも通らないはず。
  `LICENSE/` を Linux で再生成するか、CI を `windows-latest` に変えるかの判断が要る。

- **`test_code_inventory_detects_unlisted_external_imports`**
  `undeclared_external_imports` に `tomllib` が残る。`tomllib` は Python 3.11 で
  標準ライブラリに入ったモジュールで、CI が固定している 3.10 では外部扱いになる。
  監査スクリプト側の許可リストに加えるのが妥当。

### `test_canvas_spec.py::test_default_character_64_output_is_frozen`

`final.png` の SHA256 が固定値 `3a1c3a0d…` と一致しない。

- Python 3.11 + 各パッケージ最新版でも、Python 3.10 + 参照バージョンでも、
  出力は同じ `f3b7de07…` になる。依存バージョンのずれが原因ではない。
- PNG の圧縮レベルを 0〜9・`optimize` の有無で全通り試しても固定値に一致しない。
  つまり PNG のエンコード差ではなく、ピクセルそのものが違う。
- OpenCV や BLAS の Windows/Linux 実装差による丸め違いと見られる。
  出力画像自体は 64×64 RGBA・2 色で妥当な内容。
