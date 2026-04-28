<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  helper: string
}>()
</script>

<template>
  <article class="stat-card">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <p>{{ helper }}</p>
  </article>
</template>

<style scoped>
.stat-card {
  min-height: 118px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.018), transparent),
    var(--color-panel);
  box-shadow: var(--shadow-panel);
}

span {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 720;
}

strong {
  display: block;
  margin-top: 12px;
  color: var(--color-heading);
  font-size: 32px;
  font-weight: 880;
  line-height: 1;
}

p {
  margin-top: 12px;
  color: var(--color-text-soft);
  font-size: 13px;
}
</style>
