<script setup>
import GameWindow from './components/GameWindow.vue'
import Navbar from './components/Navbar.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <header>
    <Navbar />
  </header>

  <main>
    <Hero />
    <GameWindow />
    <About />
  </main>
  <footer>
    <Footer />
  </footer>
</template>

<style>
main {
  display: flex;
  gap:100px;
  flex-direction: column;
}
</style>
