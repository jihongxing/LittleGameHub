/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  // 添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

