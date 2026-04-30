<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { NCheckbox, NSelect } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { UserSettings, OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const form = reactive<UserSettings>({ ...store.settings })

const syncIntervalOptions = [
  { label: '手动同步', value: 'manual' as const },
  { label: '每日同步', value: 'daily' as const },
  { label: '每周同步', value: 'weekly' as const },
]

const aiToneOptions = [
  { label: '严格', value: 'strict' as const },
  { label: '均衡', value: 'balanced' as const },
  { label: '鼓励', value: 'encouraging' as const },
]

const platformOptions = computed(() =>
  store.supportedPlatforms.map((item: OjPlatform) => ({
    label: item,
    value: item,
  })),
)

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
          <n-select
            v-model:value="form.syncInterval"
            :options="syncIntervalOptions"
            consistent-menu-width
          />
        </label>
        <label>
          AI 建议语气
          <n-select
            v-model:value="form.aiTone"
            :options="aiToneOptions"
            consistent-menu-width
          />
        </label>
        <label>
          默认平台
          <n-select
            v-model:value="form.defaultPlatform"
            :options="platformOptions"
            consistent-menu-width
          />
        </label>
        <label class="check-row">
          <n-checkbox v-model:checked="form.showOnlyPublicData" />
          <span>仅展示公开数据</span>
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

<style scoped>
.settings-grid {
  display: grid;
  gap: 18px;
}

.settings-grid label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--color-text-soft);
  font-size: 13px;
  font-weight: 700;
}

.check-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
</style>
