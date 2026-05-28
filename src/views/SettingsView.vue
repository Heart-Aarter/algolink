<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { NButton, NCheckbox, NInput, NSelect, NSwitch, NTag } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { AiProvider, UserSettings, OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const form = reactive<UserSettings>({ ...store.settings })
let syncingFromStore = false
const apiKeySaving = ref(false)
const apiKeyMessage = ref('')
const apiKeyStatus = ref<'success' | 'error' | ''>('')

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

const aiProviderDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {
  'openai-compatible': {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
}

const aiProviderOptions = [
  { label: 'OpenAI Compatible', value: 'openai-compatible' as const },
  { label: 'DeepSeek', value: 'deepseek' as const },
]

function isKnownDefaultBaseUrl(value: string) {
  return Object.values(aiProviderDefaults).some((item) => item.baseUrl === value.trim())
}

function isKnownDefaultModel(value: string) {
  return Object.values(aiProviderDefaults).some((item) => item.model === value.trim())
}

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
  () => ({
    syncInterval: form.syncInterval,
    aiTone: form.aiTone,
    showOnlyPublicData: form.showOnlyPublicData,
    defaultPlatform: form.defaultPlatform,
    aiEnabled: form.aiEnabled,
    aiProvider: form.aiProvider,
    aiBaseUrl: form.aiBaseUrl,
    aiModel: form.aiModel,
    aiPromptPreference: form.aiPromptPreference,
  }),
  () => {
    if (syncingFromStore) {
      return
    }
    store.updateSettings({ ...form, aiApiKey: '' })
  },
  { deep: true },
)

watch(
  () => form.aiProvider,
  (provider) => {
    if (syncingFromStore) {
      return
    }

    const defaults = aiProviderDefaults[provider]

    if (!form.aiBaseUrl.trim() || isKnownDefaultBaseUrl(form.aiBaseUrl)) {
      form.aiBaseUrl = defaults.baseUrl
    }

    if (!form.aiModel.trim() || isKnownDefaultModel(form.aiModel)) {
      form.aiModel = defaults.model
    }
  },
)

async function saveApiKey() {
  apiKeySaving.value = true
  apiKeyMessage.value = ''
  apiKeyStatus.value = ''

  const result = await store.saveStoredAiApiKey(form.aiApiKey)
  apiKeyStatus.value = result.ok ? 'success' : 'error'
  apiKeyMessage.value = result.message

  if (result.ok) {
    form.aiApiKey = ''
  }

  apiKeySaving.value = false
}

async function clearApiKey() {
  apiKeySaving.value = true
  apiKeyMessage.value = ''
  apiKeyStatus.value = ''

  const result = await store.clearStoredAiApiKey()
  apiKeyStatus.value = result.ok ? 'success' : 'error'
  apiKeyMessage.value = result.message
  form.aiApiKey = ''
  apiKeySaving.value = false
}
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
          <span class="settings-label-row">
            API Key
            <n-tag :type="store.hasAiApiKey ? 'success' : 'default'" size="small" round>
              {{ store.hasAiApiKey ? '已保存' : '未保存' }}
            </n-tag>
          </span>
          <n-input
            v-model:value="form.aiApiKey"
            type="password"
            show-password-on="click"
            placeholder="留空保留已保存 Key，输入新 Key 后点击保存"
            clearable
          />
        </label>
        <div class="api-key-actions">
          <n-button
            type="primary"
            secondary
            :disabled="!form.aiApiKey.trim()"
            :loading="apiKeySaving"
            @click="saveApiKey"
          >
            保存 API Key
          </n-button>
          <n-button
            secondary
            type="error"
            :disabled="!store.hasAiApiKey"
            :loading="apiKeySaving"
            @click="clearApiKey"
          >
            清除 API Key
          </n-button>
        </div>
        <p v-if="apiKeyMessage" :class="['api-key-message', apiKeyStatus]">
          {{ apiKeyMessage }}
        </p>
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
        API Key 会使用服务端加密密钥加密保存；页面不回显完整 Key，真实 AI 请求由后端解密后转发。
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

.settings-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.api-key-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.api-key-message {
  margin: -6px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.api-key-message.success {
  color: var(--color-accent-strong);
}

.api-key-message.error {
  color: var(--color-danger);
}
</style>
