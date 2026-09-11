// 毎日決まった時刻にプッシュ通知を1件送るだけのスクリプト。
// GitHub Actions から実行する想定。必要な環境変数：
//   VAPID_PUBLIC  … VAPID公開鍵
//   VAPID_PRIVATE … VAPID秘密鍵
//   VAPID_SUBJECT … mailto:自分のメールアドレス
//   SUBSCRIPTION  … アプリの設定画面で表示された購読情報（JSON文字列）
// 実行前に: npm i web-push

import webpush from 'web-push';

const { VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, SUBSCRIPTION } = process.env;

if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUBSCRIPTION) {
  console.error('環境変数が足りません（VAPID_PUBLIC / VAPID_PRIVATE / SUBSCRIPTION）');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:example@example.com', VAPID_PUBLIC, VAPID_PRIVATE);

const payload = JSON.stringify({
  title: '習慣',
  body: '今日の記録をつけましたか'
});

try {
  await webpush.sendNotification(JSON.parse(SUBSCRIPTION), payload);
  console.log('送信しました');
} catch (e) {
  // 410 / 404 は購読が失効した合図。アプリで登録し直してください。
  console.error('送信に失敗:', e.statusCode, e.body);
  process.exit(1);
}
