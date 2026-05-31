# Google Sheetsマスター化 要件

## 目的

Google Spreadsheet を課題リストのマスターとして扱い、GitHub Pages で公開するWebアプリに反映できるようにする。

## 現在の対象シート

- Google Spreadsheet URL: `https://docs.google.com/spreadsheets/d/1IeBaoI0xaE_jQO9TXZBMiEWIoLdxb9tNSdEeCh9Rjbc/edit?usp=sharing`
- Spreadsheet ID: `1IeBaoI0xaE_jQO9TXZBMiEWIoLdxb9tNSdEeCh9Rjbc`

## データ列

- A列: 授業進捗
- B列: 教科書名または単元
- C列: 教科書範囲
- D列: テスト範囲
- E列: テキストブック名、教材名
- F列: 課題名、章タイトル
- G列: 完了状態

## 必須要件

- Google Spreadsheet から課題リストを生成できる。
- 教科ごとに色分けして表示できる。
- 教材名と課題名を同じ行で確認できる。
- 残っている課題と完了済みを切り替えて表示できる。
- 授業進捗を基準に「授業済みまで」の課題を表示できる。
- テスト範囲を基準に「期末範囲まで」の課題を表示できる。
- GitHub Pages に秘密情報を置かない。

## 期末範囲と中間範囲の扱い

- 「範囲」で「期末範囲まで」を選んだ場合、初期状態では `1学期期末` の課題だけを対象にする。
- 「1学期中間も対象」のチェックを入れた場合だけ、`1学期期末` に加えて `1学期中間` の課題も対象にする。
- 「1学期中間も対象」のチェックを外した場合、`1学期中間` の課題は表示対象から外す。
- 画面上でも現在の対象が「1学期期末のみ」か「1学期期末+1学期中間」か分かるように表示する。
- 「授業済みまで」を選んだ場合は、テスト範囲ではなく A列の授業進捗を基準にする。

## 更新方式

- スプレッドシートの反映は GitHub Actions の手動実行で行う。
- 手動更新時に Google Spreadsheet から `app-data.js` を生成し、変更があればコミットする。
- `main` に反映されたら GitHub Pages のデプロイを実行する。
