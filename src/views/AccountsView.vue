<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NEmpty, NInput, NPopconfirm, NSelect, NTag, useMessage } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const message = useMessage()
const platform = ref<OjPlatform | null>(store.settings.defaultPlatform)
const handle = ref('')
const syncingId = ref('')

const platformOptions = computed(() =>
  store.supportedPlatforms.map((item) => ({
    label: item,
    value: item,
  })),
)

function submitAccount() {
  const result = store.addAccount(platform.value || '', handle.value)

  if (result.ok) {
    message.success(result.message)
    handle.value = ''
    return
  }

  message.error(result.message)
}

async function syncAccount(id: string, platformName: OjPlatform) {
  if (syncingId.value) {
    return
  }

  syncingId.value = id
  message.info(`${platformName} 正在同步...`)
  const result = await store.syncCodeforcesAccount(id)
  message[result.ok ? 'success' : 'error'](result.message)
  syncingId.value = ''
}

function removeAccount(id: string, platformName: OjPlatform) {
  store.removeAccount(id)
  message.success(`${platformName} 已解绑`)
}
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Public Handle Only</p>
          <h2>OJ 账号绑定</h2>
        </div>
        <n-tag type="info" round>不收集密码</n-tag>
      </div>

      <form class="bind-form naive-bind-form" @submit.prevent="submitAccount">
        <label>
          平台
          <n-select
            v-model:value="platform"
            :options="platformOptions"
            clearable
            placeholder="请选择平台"
          />
        </label>
        <label>
          用户名 / handle
          <n-input v-model:value="handle" clearable placeholder="例如 tourist、abc_focus" />
        </label>
        <n-button type="primary" attr-type="submit" strong>绑定账号</n-button>
      </form>

      <p class="form-note">
        Codeforces 点击同步会请求官方公开 API；其他平台继续使用 mock 数据。只保存公开用户名，不收集
        OJ 密码。
      </p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Bound Accounts</p>
          <h2>已绑定账号</h2>
        </div>
        <n-tag round>{{ store.accounts.length }} 个公开账号</n-tag>
      </div>

      <div v-if="store.accounts.length" class="account-cards">
        <article v-for="account in store.accounts" :key="account.id" class="account-card">
          <span class="account-dot" :style="{ background: account.color }" />
          <h3>{{ account.platform }}</h3>
          <p>@{{ account.handle }}</p>
          <dl>
            <div>
              <dt>当前 rating</dt>
              <dd>{{ account.rating || '-' }}</dd>
            </div>
            <div>
              <dt>最高 rating</dt>
              <dd>{{ account.maxRating || '-' }}</dd>
            </div>
            <div>
              <dt>AC 题数</dt>
              <dd>{{ account.solved }}</dd>
            </div>
            <div>
              <dt>最近同步</dt>
              <dd>{{ account.lastSyncAt }}</dd>
            </div>
          </dl>
          <div class="account-actions">
            <n-button
              type="primary"
              secondary
              :loading="syncingId === account.id"
              :disabled="!!syncingId && syncingId !== account.id"
              @click="syncAccount(account.id, account.platform)"
            >
              {{ account.platform === 'Codeforces' ? '同步' : '模拟同步' }}
            </n-button>
            <n-popconfirm
              positive-text="确认解绑"
              negative-text="取消"
              @positive-click="removeAccount(account.id, account.platform)"
            >
              <template #trigger>
                <n-button type="error" secondary :disabled="!!syncingId">解绑</n-button>
              </template>
              解绑后该平台本地同步数据会被移除，确认继续？
            </n-popconfirm>
          </div>
        </article>
      </div>

      <n-empty v-else description="还没有绑定账号" class="empty-state naive-empty">
        <template #extra>
          <span>选择平台并输入公开 handle 后，Dashboard、提交记录和能力画像会读取对应数据。</span>
        </template>
      </n-empty>
    </section>
  </div>
</template>
