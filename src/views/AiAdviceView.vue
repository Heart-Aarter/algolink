<script setup lang="ts">
import { trainingAdvice } from '@/mock/algolink'
</script>

<template>
  <div class="page-stack">
    <section class="panel ai-brief">
      <p class="eyebrow">AI Coach Mock</p>
      <h2>训练建议基于最近提交、题型标签与能力缺口生成</h2>
      <p>
        第一阶段不接真实模型接口，页面展示模拟的 AI 分析结果，后续可通过 Axios 接入后端聚合服务。
      </p>
    </section>

    <section class="advice-list">
      <article v-for="advice in trainingAdvice" :key="advice.id" class="advice-card">
        <div class="advice-head">
          <span :class="`priority priority-${advice.priority.toLowerCase()}`">
            {{ advice.priority }}
          </span>
          <small>{{ advice.estimatedDays }} 天</small>
        </div>
        <h3>{{ advice.title }}</h3>
        <p>{{ advice.reason }}</p>
        <strong>{{ advice.action }}</strong>
      </article>
    </section>
  </div>
</template>
