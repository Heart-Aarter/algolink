<script setup lang="ts">
import { computed, nextTick, reactive, watch } from 'vue'
import { NCheckbox, NInput, NSelect, NSwitch } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { UserSettings, OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const form = reactive<UserSettings>({ ...store.settings })
let syncingFromStore = false

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

const aiProviderOptions = [{ label: 'OpenAI Compatible', value: 'openai-compatible' as const }]

const platformOptions = computed(() =>
  store.supportedPlatforms.map((item: OjPlatform) => ({
    label: item,
    value: item,
  })),
)

watch(
  () => store.settings,
  (settings) => {
    syncingFromStore = true
    Object.assign(form, settings)
    void nextTick(() => {
      syncingFromStore = false
    })
  },
  { deep: true },
)

watch(
  form,
  () => {
    if (syncingFromStore) {
      return
    }
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

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Bring Your Own API</p>
          <h2>AI 接入配置</h2>
        </div>
      </div>
      <div class="settings-grid">
        <label class="check-row">
          <n-switch v-model:value="form.aiEnabled" />
          <span>启用真实 AI 分析</span>
        </label>
        <label>
          接口类型
          <n-select
            v-model:value="form.aiProvider"
            :options="aiProviderOptions"
            consistent-menu-width
          />
        </label>
        <label>
          API Base URL
          <n-input
            v-model:value="form.aiBaseUrl"
            placeholder="https://api.openai.com/v1"
            clearable
          />
        </label>
        <label>
          API Key
          <n-input
            v-model:value="form.aiApiKey"
            type="password"
            show-password-on="click"
            placeholder="仅保存在当前浏览器本地缓存"
            clearable
          />
        </label>
        <label>
          模型
          <n-input v-model:value="form.aiModel" placeholder="gpt-4o-mini" clearable />
        </label>
        <label>
          额外偏好
          <n-input
            v-model:value="form.aiPromptPreference"
            type="textarea"
            placeholder="例如：建议更严格、偏重 Codeforces、每周题量不要超过 12 道"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </label>
      </div>
      <p class="settings-note">
        API Key 不会写入后端 SQLite；真实 AI 请求时会临时发送给本地后端代理用于转发。
      </p>
    </section>

    <section class="policy-grid">
      <article class="policy-card">
        <strong>公开数据原则</strong>
        <p>只允许绑定公开 handle，不采集密码、cookie 或私有 token。</p>
      </article>
      <article class="policy-card">
        <strong>数据与隐私边界</strong>
        <p>分析结果优先使用后端 SQLite 数据，本地缓存用于保留刷新和离线可用状态。</p>
      </article>
      <article class="policy-card">
        <strong>后续扩展点</strong>
        <p>后续可通过 Axios 接入聚合 API、AI 分析服务和用户系统。</p>
      </article>
    </section>

    <section class="panel danger-panel">
      <div>
        <h2>重置当前用户数据</h2>
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

.settings-note {
  margin-top: 16px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.7;
}
</style>
