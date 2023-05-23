---
title: Example
---

文档编写示例

## Markdown

### code

强调：
- `// [!code ++]` 表示添加
- `// [!code --]` 表示删除
- `// [!code focus]` 表示聚焦
- `// [!code error]` 表示错误
- `// [!code warning]` 表示警告

::: code-group

```vue {2}
<script setup lang="ts">
const togger = ref(false) // [!code focus]
console.log(togger.value) // [!code --]
</script>

<template>
  <p>{{ togger }}</p> // [!code ++]
</template>
```

```sh [install]
pnpm add -D @vueuse/core
```

:::


### Tip

> info tip warning danger details

::: tip 自定义标题
我是 tip
:::

::: danger
注意！！！
:::

::: details 不重要的内容
折叠内容
:::

### Image

![image](../assets/images/profile.png)

### More

https://vitepress.dev/guide/markdown

## Vue 组件

### 直接编写

<script setup lang="ts">
import HellowWorld from "@.vitepress/theme/components/HelloWorld.vue"
const msg = ref('Hello world!')
</script>
<p>{{ msg }}</p>

### 引入

在 `.vitepress/theme/components` 目录下创建 `HelloWorld.vue` 文件，因为配置了 `auto component` 所以支持自动导入，直接使用

<HelloWorld />


### 使用 icon

<i-carbon-sun />

<i-my-icons-logo />
