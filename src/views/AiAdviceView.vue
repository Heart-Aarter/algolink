<script setup lang="ts">
import { aiFindings, problemRecommendations, trainingAdvice } from '@/mock/algolink'
</script>

<template>
  <div class="page-stack">
    <section class="panel ai-brief">
      <p class="eyebrow">AI Coach Mock</p>
      <h2>AI 将提交结果、题型标签、平台 rating 和训练计划合并成可执行建议</h2>
      <p>
        当前页面仍使用 mock 数据，不连接真实模型接口；结构已按后续接入后端分析服务预留为“诊断、建议、题单”三段式。
      </p>
    </section>

    <section class="finding-grid">
      <article v-for="finding in aiFindings" :key="finding.id" class="finding-card">
        <span :class="`finding-${finding.type}`">{{ finding.type }}</span>
        <h3>{{ finding.title }}</h3>
        <p>{{ finding.detail }}</p>
        <strong>{{ finding.impact }}</strong>
      </article>
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

    <section class="panel">
      <div class="panel-heading">
        <h2>推荐题单</h2>
      </div>
      <div class="recommend-list">
        <article v-for="item in problemRecommendations" :key="item.id" class="recommend-card">
          <div>
            <span class="fit-score">{{ item.fitScore }}</span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.platform }} · {{ item.difficulty }} · {{ item.reason }}</p>
          </div>
          <div>
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
