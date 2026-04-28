<script setup lang="ts">
import { ref } from 'vue'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const platform = ref<OjPlatform>(store.settings.defaultPlatform)
const handle = ref('')
const platforms: OjPlatform[] = ['Codeforces', 'Luogu', 'AtCoder']

function submitAccount() {
  store.addAccount(platform.value, handle.value)
  handle.value = ''
}
</script>

<template>
  <div class="page-stack">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Public Handle Only</p>
          <h2>绑定公开 OJ 账号</h2>
        </div>
      </div>
      <form class="bind-form" @submit.prevent="submitAccount">
        <label>
          平台
          <select v-model="platform">
            <option v-for="item in platforms" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          用户名 / handle
          <input v-model="handle" type="text" placeholder="例如 tourist、abc_focus" />
        </label>
        <button type="submit">添加绑定</button>
      </form>
      <p class="form-note">AlgoLink 只记录公开用户名，不要求也不保存任何 OJ 密码。</p>
    </section>

    <section class="panel">
      <div class="panel-heading">
        <h2>已绑定账号</h2>
      </div>
      <div class="account-cards">
        <article v-for="account in store.accounts" :key="account.id" class="account-card">
          <span class="account-dot" :style="{ background: account.color }" />
          <h3>{{ account.platform }}</h3>
          <p>@{{ account.handle }}</p>
          <dl>
            <div>
              <dt>题数</dt>
              <dd>{{ account.solved }}</dd>
            </div>
            <div>
              <dt>Rating</dt>
              <dd>{{ account.rating || '待同步' }}</dd>
            </div>
          </dl>
          <small>上次同步：{{ account.lastSync }}</small>
          <button class="ghost-button" type="button" @click="store.removeAccount(account.id)">
            移除
          </button>
        </article>
      </div>
    </section>
  </div>
</template>
