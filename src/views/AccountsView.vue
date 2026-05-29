<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NEmpty, NInput, NPopconfirm, NSelect, NTag, useMessage } from 'naive-ui'
import { useAlgoLinkStore } from '@/stores/algolink'
import type { OjPlatform } from '@/types/algolink'

const store = useAlgoLinkStore()
const message = useMessage()
const platform = ref<OjPlatform | null>(store.settings.defaultPlatform)
const platformSelected = ref(false)
const handle = ref('')
const bindingAccount = ref(false)
const syncingId = ref('')

const platformOptions = computed(() =>
  store.supportedPlatforms.map((item) => ({
    label: item,
    value: item,
  })),
)

async function submitAccount() {
  if (bindingAccount.value) {
    return
  }

  bindingAccount.value = true
  try {
    const result = await store.bindAccount(platform.value || '', handle.value)

    if (result.ok) {
      message.success(result.message)
      handle.value = ''
      return
    }

    message.error(result.message)
  } catch {
    message.error('绑定账号失败')
  } finally {
    bindingAccount.value = false
  }
}

async function syncAccount(id: string, platformName: OjPlatform) {
  if (syncingId.value) {
    return
  }

  syncingId.value = id
  message.info(
    platformName === 'Luogu'
      ? '洛谷正在读取公开练习数据，题目标签会尽量补全。'
      : `${platformName} 正在同步...`,
  )
  try {
    const result = await store.syncOjAccount(id)
    message[result.ok ? 'success' : 'error'](result.message)
  } catch {
    message.error(`${platformName} 同步失败`)
  } finally {
    syncingId.value = ''
  }
}

function removeAccount(id: string, platformName: OjPlatform) {
  store.removeAccount(id)
  message.success(`${platformName} 账号已移除`)
}

function getSyncButtonText(platformName: OjPlatform) {
  return platformName === 'Luogu' ? '同步公开练习' : '同步'
}

function shouldShowRating(platformName: OjPlatform) {
  return platformName === 'Codeforces'
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
        <n-tag type="info" round>仅使用公开数据</n-tag>
      </div>

      <form class="bind-form naive-bind-form" @submit.prevent="submitAccount">
        <label>
          平台
          <n-select
            v-model:value="platform"
            :options="platformOptions"
            clearable
            placeholder="选择 OJ 平台"
            @update:value="platformSelected = true"
          />
        </label>
        <label>
          公开用户名 / handle
          <n-input v-model:value="handle" clearable placeholder="例如 tourist 或 chokudai" />
        </label>
        <n-button type="primary" attr-type="submit" strong>绑定账号</n-button>
      </form>

      <Transition name="tab-fade">
        <div v-if="platformSelected && platform === 'Codeforces'" class="cf-verify-card">
          <div class="cf-verify-copy">
            <strong>Codeforces 绑定验证</strong>
            <span>请先打开 CF 1A，在 10 分钟内提交一次 CE，再回到这里绑定 handle。</span>
          </div>
          <span>{{ platform }} 验证：</span>
          <span class="cf-verify-button" aria-disabled="true" title="比赛提交版已锁定外部跳转">
            打开 CF 1A 验证题
          </span>
        </div>
      </Transition>

      <p class="form-note">
        Codeforces 绑定需 10 分钟内去 CF 1A 提交一发 CE 验证；AtCoder 和 Luogu 输入 handle 即可直接绑定。AlgoLink 只保存公开用户名，不收集任何 OJ 密码。
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
          <p>
            <span class="oj-link" aria-disabled="true" title="比赛提交版已锁定外部跳转">
              @{{ account.handle }}
            </span>
          </p>
          <dl>
            <div v-if="shouldShowRating(account.platform)">
              <dt>当前 rating</dt>
              <dd>{{ account.rating || '-' }}</dd>
            </div>
            <div v-if="shouldShowRating(account.platform)">
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
            <div v-if="account.platform !== 'Codeforces'">
              <dt>数据来源</dt>
              <dd>{{ account.platform === 'AtCoder' ? '公开提交' : '公开练习' }}</dd>
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
              {{ getSyncButtonText(account.platform) }}
            </n-button>
            <n-popconfirm
              positive-text="确认移除"
              negative-text="取消"
              @positive-click="removeAccount(account.id, account.platform)"
            >
              <template #trigger>
                <n-button type="error" secondary :disabled="!!syncingId">移除</n-button>
              </template>
              移除后会清空该平台已同步的本地提交记录。
            </n-popconfirm>
          </div>
        </article>
      </div>

      <n-empty v-else description="还没有绑定公开账号" class="empty-state naive-empty">
        <template #extra>
          <span>选择平台并输入公开 handle 后，可以同步公开提交数据。</span>
        </template>
      </n-empty>
    </section>
  </div>
</template>

<style scoped>
.cf-verify-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(194, 138, 46, 0.45);
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(194, 138, 46, 0.16), transparent 46%),
    rgba(255, 255, 255, 0.035);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.cf-verify-card > span {
  display: none;
}

.cf-verify-copy {
  display: grid;
  gap: 6px;
}

.cf-verify-copy strong {
  color: var(--color-heading);
  font-size: 16px;
  font-weight: 820;
}

.cf-verify-copy span {
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.oj-link {
  cursor: default;
}

.cf-verify-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(194, 138, 46, 0.66);
  border-radius: 8px;
  background: var(--stripe-gold);
  color: #17130d;
  font-size: 14px;
  font-weight: 820;
  cursor: default;
  text-decoration: none;
  box-shadow: 0 10px 24px rgba(194, 138, 46, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.cf-verify-button:hover {
  color: #17130d;
}

@media (max-width: 720px) {
  .cf-verify-card {
    align-items: stretch;
    flex-direction: column;
  }

  .cf-verify-button {
    width: 100%;
  }
}
</style>
