<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page-stack not-found-page">
    <section class="panel not-found-panel">
      <div class="not-found-illustration">
        <span class="not-found-code">404</span>
        <span class="not-found-divider" />
        <p class="eyebrow">Page Not Found</p>
      </div>
      <h2>没有找到这个页面</h2>
      <p>
        这个地址不在 AlgoLink 当前路由中。你可以回到 Dashboard 查看多 OJ 数据概览，或进入账号页绑定公开
        handle 后继续同步训练数据。
      </p>
      <div class="hero-actions not-found-actions">
        <RouterLink to="/">返回 Dashboard</RouterLink>
        <RouterLink class="secondary-link" to="/accounts">绑定 OJ 账号</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.not-found-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 28px 44px;
  text-align: center;
}

.not-found-illustration {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.not-found-code {
  color: var(--color-heading);
  font-size: 56px;
  font-weight: 850;
  letter-spacing: 0.02em;
}

.not-found-divider {
  display: inline-block;
  width: 1px;
  height: 44px;
  background: var(--color-border);
}

.not-found-panel h2 {
  margin-bottom: 12px;
  color: var(--color-heading);
  font-size: 22px;
  font-weight: 840;
}

.not-found-panel p {
  max-width: 540px;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.not-found-actions {
  margin-top: 24px;
}
</style>
