// Firebase のウェブアプリ設定(公開してよい識別子。データの守りは firestore.rules で行う)
window.OW_FIREBASE = {
  apiKey: "AIzaSyA3-u9-yJu7-nAClYLVCwDC4lPIwds_EPM",
  authDomain: "gglog-1y19.firebaseapp.com",
  projectId: "gglog-1y19",
  storageBucket: "gglog-1y19.firebasestorage.app",
  messagingSenderId: "690126271670",
  appId: "1:690126271670:web:d85d820b53c8e549aca217",
};
// ランク画面の写真を読み取るサーバーのURL(tools/reader-worker.js を Cloudflare Workers に置いたもの)。空のあいだは写真ボタンを出さない
window.OW_READER = window.OW_READER || "";
