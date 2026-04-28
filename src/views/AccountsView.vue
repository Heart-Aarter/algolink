<script setup lang="ts">
import { ref } from 'vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const platform = ref<OjPlatform | ''>(store.settings.defaultPlatform)
const handle = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

function setMessage(type: 'success' | 'error', text: string) {
  messageType.value = type
  message.value = text
}

function submitAccount() {
  const result = store.addAccount(platform.value, handle.value)
  setMessage(result.ok ? 'success' : 'error', result.message)

  if (result.ok) {
    handle.value = ''
  }
}

function syncAccount(id: string, platformName: OjPlatform) {
  store.syncAccount(id)
  setMessage('success', `${platformName} 模拟同步成功`)
}

function removeAccount(id: string, platformName: OjPlatform) {
  store.removeAccount(id)
  setMessage('success', `${platformName} 已解绑`)
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
      </div>

      <form class="bind-form" @submit.prevent="submitAccount">
        <label>
          平台
          <select v-model="platform">
            <option value="">请选择平台</option>
            <option v-for="item in store.supportedPlatforms" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>
        <label>
          用户名 / handle
          <input v-model="handle" type="text" placeholder="例如 tourist、abc_focus" />
        </label>
        <button type="submit">绑定</button>
      </form>

      <p class="form-note">只保存公开用户名，不需要也不会收集任何 OJ 密码。</p>
      <p v-if="message" class="form-message" :class="messageType">{{ message }}</p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Bound Accounts</p>
          <h2>已绑定账号</h2>
        </div>
        <span class="count-badge">{{ store.accounts.length }} 个公开账号</span>
      </div>

      <div v-if="store.accounts.length" class="account-cards">
        <article v-for="account in store.accounts" :key="account.id" class="account-card">
          <span class="account-dot" :style="{ background: account.color }" />
          <h3>{{ account.platform }}</h3>
          <p>@{{ account.handle }}</p>
          <dl>
            <div>
              <dt>绑定状态</dt>
              <dd>已绑定</dd>
            </div>
            <div>
              <dt>最近同步</dt>
              <dd>{{ account.lastSyncAt }}</dd>
            </div>
          </dl>
          <div class="account-actions">
            <button class="ghost-button" type="button" @click="syncAccount(account.id, account.platform)">
              模拟同步
            </button>
            <button class="ghost-button danger-button" type="button" @click="removeAccount(account.id, account.platform)">
              解绑
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <h3>还没有绑定账号</h3>
        <p>选择一个平台并输入公开 handle 后，Dashboard、提交记录和能力画像会自动读取对应 mock 数据。</p>
      </div>
    </section>
  </div>
</template>
