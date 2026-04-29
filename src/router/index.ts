import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { title: 'Dashboard' },
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: () => import('@/views/AccountsView.vue'),
      meta: { title: 'OJ 账号绑定' },
    },
    {
      path: '/submissions',
      name: 'submissions',
      component: () => import('@/views/SubmissionsView.vue'),
      meta: { title: '提交记录' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/AbilityProfileView.vue'),
      meta: { title: '能力画像' },
    },
    {
      path: '/ai-advice',
      name: 'ai-advice',
      component: () => import('@/views/AiAdviceView.vue'),
      meta: { title: 'AI 训练建议' },
    },
    {
      path: '/training-report',
      name: 'training-report',
      component: () => import('@/views/TrainingReportView.vue'),
      meta: { title: '训练报告' },
    },
    {
      path: '/training-plan',
      name: 'training-plan',
      component: () => import('@/views/TrainingPlanView.vue'),
      meta: { title: '训练计划' },
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('@/views/DailyChallengeView.vue'),
      meta: { title: '每日一题' },
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      meta: { title: '排行榜' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: '设置' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
