---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Studyxiao"
  text: "A Python Web Developer and A Wizard who doesn't know magic."
  tagline: My great project tagline
  image:
    src: /images/profile.png
    alt: studyxiao
  actions:
    - theme: brand
      text: Vue
      link: /vue/
    - theme: alt
      text: Python
      link: /python/

features:
  - icon: 😍
    title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit

---

<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
} from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/studyxiao.png',
    name: 'studyxiao',
    title: 'Author',
    links: [
      { icon: 'github', link: 'https://github.com/studyxiao' },
    ]
  },
]
</script>


<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Author
    </template>
    <template #lead>
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>
