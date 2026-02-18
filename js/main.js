/**
 * main.js — しるふぁ工房 メインJavaScript
 *
 * 役割: サイト全体のインタラクション・アニメーションを管理する。
 * - 星空パーティクル背景（Canvas API）
 * - スクロール連動アニメーション（Intersection Observer）
 * - ナビゲーションのスクロール検知・ハンバーガーメニュー
 * - ページ遷移フェード
 */

'use strict';

/* ============================================================
 * 星空パーティクル背景
 * Canvasを使って夜空の星を描画し、ゆっくりと瞬かせる。
 * ============================================================ */
class StarField {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.animationId = null;

    this.resize();
    this.createStars();
    this.animate();

    // ウィンドウリサイズ時に再計算
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createStars() {
    const count = Math.floor((this.canvas.width * this.canvas.height) / 6000);
    this.stars = Array.from({ length: count }, () => ({
      x:       Math.random() * this.canvas.width,
      y:       Math.random() * this.canvas.height,
      r:       Math.random() * 1.5 + 0.3,
      alpha:   Math.random(),
      speed:   Math.random() * 0.005 + 0.002,
      phase:   Math.random() * Math.PI * 2,
      // 一部の星に色味を付けてリッチな印象に
      hue:     Math.random() < 0.3 ? (Math.random() < 0.5 ? 270 : 320) : 0,
    }));
  }

  animate() {
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const time = Date.now() * 0.001;

    stars.forEach(star => {
      // 正弦波で瞬きを表現
      const alpha = (Math.sin(time * star.speed * 10 + star.phase) + 1) / 2 * 0.7 + 0.1;
      const color = star.hue
        ? `hsla(${star.hue}, 60%, 80%, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

/* ============================================================
 * ナビゲーション
 * スクロール量に応じてグラスモーフィズム効果を適用する。
 * ============================================================ */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  // スクロール検知: 50px以上でクラスを付与
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // 初期状態を即時反映

  // ハンバーガーメニュー
  const hamburger = nav.querySelector('.nav__hamburger');
  const menu      = nav.querySelector('.nav__menu');

  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      menu.classList.toggle('open', isOpen);
      // アクセシビリティ: aria属性を更新
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // メニュー外クリックで閉じる
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) {
        hamburger.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // メニューリンクをクリックしたら閉じる
    menu.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 現在のページのナビリンクをアクティブに
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ============================================================
 * スクロールアニメーション
 * Intersection Observer APIで要素が画面に入ったらフェードイン。
 * ============================================================ */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.fade-in');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // 一度表示したら監視を解除してパフォーマンスを節約
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(el => observer.observe(el));
}

/* ============================================================
 * ページ遷移フェード
 * ページ読み込み時にフェードイン、リンククリック時にフェードアウト。
 * ============================================================ */
function initPageTransition() {
  // フェードイン（ページ読み込み完了時）
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });

  // 内部リンクのフェードアウト
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    // 外部リンク・アンカーリンクは除外
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => { location.href = href; }, 400);
    });
  });
}

/* ============================================================
 * 初期化
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 星空背景（Homeページのみ）
  if (document.getElementById('hero-canvas')) {
    new StarField('hero-canvas');
  }

  initNav();
  initScrollAnimations();
  initPageTransition();
});
