---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
#Studyxiao is a Python web developer, or perhaps more accurately described as a wizard without magic.
#studyxiao is a Python web developer, perhaps also known as a wizard who doesn't know "magic".
hero:
  name: "Studyxiao"
  text: "Pythonista"
  tagline: perhaps more accurately described as a Wizard without Magic.
  image:
    src: /images/profile.png
    alt: studyxiao
  actions:
    - theme: brand
      text: Vue
      link: /vue/
    - theme: alt
      text: Python
      link: /python/development

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
