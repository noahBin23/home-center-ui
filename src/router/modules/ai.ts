export default {
  path: "/ai",
  redirect: "/ai/index",
  meta: {
    title: "AI聊天",
    rank: 1
  },
  children: [
    {
      path: "/ai/index",
      name: "ai",
      component: () => import("@/views/ai/index.vue"),
      meta: {
        title: "AI聊天"
      }
    },
    {
      path: "/ai/knowledge",
      name: "ai-knowledge",
      component: () => import("@/views/ai/knowledge.vue"),
      meta: {
        title: "知识库"
      }
    }
  ]
} satisfies RouteConfigsTable;
