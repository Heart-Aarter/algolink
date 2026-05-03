<script setup lang="ts">
import { NCard } from 'naive-ui'

defineProps<{
  label: string
  value: string | number
  helper: string
}>()
</script>

<template>
  <n-card class="stat-card" :bordered="false" content-style="padding: 0;">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <p>{{ helper }}</p>
  </n-card>
</template>

<style scoped>
.stat-card {
  position: relative;
  min-height: 118px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(142, 39, 36, 0.12), transparent 4px),
    linear-gradient(180deg, rgba(255, 255, 255, 0.038), transparent), var(--color-panel);
  box-shadow: var(--shadow-panel);
  backdrop-filter: blur(8px);
  contain: layout style;
}

.stat-card::before {
  position: absolute;
  top: 0;
  right: 18px;
  left: 18px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--stripe-red), var(--stripe-gold), var(--stripe-teal), transparent);
  content: '';
  opacity: 0.72;
}

.stat-card::after {
  position: absolute;
  right: 16px;
  bottom: 14px;
  width: 46px;
  height: 46px;
  border-top: 1px solid rgba(194, 138, 46, 0.18);
  border-right: 1px solid rgba(142, 39, 36, 0.16);
  content: '';
  opacity: 0.72;
  transform: skew(-12deg);
}

span {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 760;
}

strong {
  display: block;
  margin-top: 12px;
  width: fit-content;
  max-width: 100%;
  background: linear-gradient(90deg, var(--color-heading), var(--color-gold));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  overflow-wrap: anywhere;
}

p {
  margin-top: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
  line-height: 1.55;
}
</style>
