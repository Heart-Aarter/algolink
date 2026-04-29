<script setup lang="ts">
import { useAlgoLinkStore } from '@/stores/algolink'

const store = useAlgoLinkStore()
</script>

<template>
  <div class="page-stack leaderboard-page">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Leaderboard</p>
          <h2>排行榜</h2>
        </div>
      </div>

      <div class="leaderboard-list">
        <article v-for="entry in store.leaderboard" :key="entry.username" class="leaderboard-row">
          <span>{{ entry.username }}</span>
          <strong>{{ entry.score }}</strong>
        </article>
      </div>
    </section>
  </div>
</template>
