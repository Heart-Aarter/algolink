<template>
  <section class="mobile-more-panel" aria-label="手机端更多入口">
    <div class="mobile-more-head">
      <p class="eyebrow">More Console</p>
      <h2>我的工作台</h2>
    </div>
    <div class="mobile-more-grid">
      <RouterLink to="/accounts">账号绑定</RouterLink>
      <RouterLink to="/ability-profile">能力画像</RouterLink>
      <RouterLink to="/training-report">训练报告</RouterLink>
      <RouterLink to="/daily">每日一题</RouterLink>
      <RouterLink to="/leaderboard">排行榜</RouterLink>
      <RouterLink to="/settings">设置</RouterLink>
      <RouterLink to="/about">关于项目</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.mobile-more-panel {
  display: none;
}

@media (max-width: 760px) {
  .mobile-more-panel {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid rgba(194, 138, 46, 0.2);
    border-radius: 14px;
    background:
      linear-gradient(90deg, rgba(142, 39, 36, 0.13), transparent 4px),
      linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025)),
      rgba(18, 20, 20, 0.9);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .mobile-more-head h2 {
    color: var(--color-heading);
    font-size: 18px;
    font-weight: 860;
  }

  .mobile-more-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .mobile-more-grid a {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid rgba(154, 170, 190, 0.13);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-text-soft);
    font-size: 13px;
    font-weight: 790;
  }

  .mobile-more-grid a.router-link-active {
    border-color: rgba(194, 138, 46, 0.38);
    color: var(--color-heading);
    background: rgba(194, 138, 46, 0.12);
  }
}
</style>
