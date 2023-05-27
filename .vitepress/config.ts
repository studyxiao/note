import { defineConfig } from 'vitepress'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'

// 顶部导航（一级）
const nav = [
  { text: 'Home', link: '/' },
  {
    text: 'Vue',
    link: '/vue/',
  },
  {
    text: 'Python',
    link: '/python/development',
  },
]

// 左侧导航（二级）
const sidebar = {
  '/vue/': [
    {
      text: 'Vue',
      items: [
        // { text: 'Index', link: '/vue/index' },
        // { text: 'Markdown Examples', link: '/vue/markdown-examples' },
        // { text: 'Runtime API Examples', link: '/examples/api-examples' },
      ],
    },
  ],
  '/python/': [
    {
      text: 'Python',
      items: [
        { text: '应用开发指南', link: '/python/development' },
        { text: 'Git', link: '/python/git' },
        { text: 'Docker', link: '/python/docker' },
      ],
    },
  ],
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/note/',
  title: '笔记',
  lang: 'zh-CN',
  description: '关于 Vue.js Python Linux 等技术的笔记',
  head: [
    ['link', { rel: 'icon', href: '/note/favicon.svg', type: 'image/svg+xml' }],
  ],
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'StudyXiao',

    lastUpdatedText: '最后更新于',
    logo: '/favicon.svg',
    footer: {
      copyright: 'Copyright © 2023-present Studyxiao',
    },
    nav,

    sidebar,
    outline: [2, 3],
    outlineTitle: '文章目录',
    returnToTopLabel: '返回顶部',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/studyxiao/note' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                },
              },
            },
          },
        },
      },
    },
  },
  markdown: {
    // Enable line numbers in code block.
    lineNumbers: true,
  },
  vite: {
    plugins: [
      // vue(),
      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/, /\.vue\?vue/, // .vue
          /\.md$/, // .md
        ],
        imports: [
          'vue',
          '@vueuse/core',
        ],
        // 生成的 .d.ts 文件以支持 TS 语法提示
        dts: 'auto-imports.d.ts',
        // 自定义函数，嵌套路径需 `module/**`
        // dirs: [
        //   '.vitepress/composables',
        // ],
        // 支持在 template 中使用
        vueTemplate: true,
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        dirs: ['.vitepress/theme/components'],
        // 自动扫描 `./src/components/` 下 vue 和 markdown 组件，支持嵌套
        extensions: ['vue', 'md'],
        // 生成的 .d.ts 文件以支持 TS 语法提示
        dts: 'components.d.ts',
        // 在 vue 和 markdown 中获得支持
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          IconsResolver({
            customCollections: ['my-icons'],
          }),
        ],
      }),
      // https://github.com/antfu/unplugin-icons
      Icons({
      // 自定义图标
        customCollections: {
        // <i-my-icons-[name] />
          'my-icons': FileSystemIconLoader(
            'public/icons',
            svg => svg.replace(/^<svg /, '<svg fill="currentColor" '),
          ),
        },
      }),
    ],
  },
})
