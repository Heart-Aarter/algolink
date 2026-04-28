<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform, UserSettings } from '@/types/algolink'

const store = useAlgoLinkStore()
const form = reactive<UserSettings>({ ...store.settings })
const platforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

watch(
  form,
  () => {
    store.updateSettings({ ...form })
  },
  { deep: true },
)
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Local Preferences</p>
          <h2>设置</h2>
        </div>
      </div>
      <div class="settings-grid">
        <label>
          同步频率
          <select v-model="form.syncInterval">
            <option value="manual">手动同步</option>
            <option value="daily">每日同步</option>
            <option value="weekly">每周同步</option>
          </select>
        </label>
        <label>
          AI 建议语气
          <select v-model="form.aiTone">
            <option value="strict">严格</option>
            <option value="balanced">均衡</option>
            <option value="encouraging">鼓励</option>
          </select>
        </label>
        <label>
          默认平台
          <select v-model="form.defaultPlatform">
            <option v-for="item in platforms" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="check-row">
          <input v-model="form.showOnlyPublicData" type="checkbox" />
          仅展示公开数据
        </label>
      </div>
    </section>

    <section class="policy-grid">
      <article class="policy-card">
        <strong>公开数据原则</strong>
        <p>只允许绑定公开 handle，不采集密码、cookie 或私有 token。</p>
      </article>
      <article class="policy-card">
        <strong>前端阶段边界</strong>
        <p>所有分析结果来自 mock 数据与 localStorage，不接真实后端。</p>
      </article>
      <article class="policy-card">
        <strong>后续扩展点</strong>
        <p>后续可通过 Axios 接入聚合 API、AI 分析服务和用户系统。</p>
      </article>
    </section>

    <section class="panel danger-panel">
      <div>
        <h2>重置本地 mock 数据</h2>
        <p>会恢复账号、设置与训练计划到默认示例数据。</p>
      </div>
      <button class="ghost-button" type="button" @click="store.resetLocalData">重置</button>
    </section>
  </div>
</template>
