<script>
import GameWindow from './components/GameWindow.vue'
import Navbar from './components/Navbar.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Footer from './components/Footer.vue'

export default {
  methods: {
    handleScroll () {
      if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 300) {
            document.getElementById("navbar").style.top = "0";
        } else {
            document.getElementById("navbar").style.top = "-100px";
        }
    }
  },
  beforeMount () {
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.handleScroll)
  }
}
</script>

<template>
  <Head>
    <Title>FlowTrails</Title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </Head>
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
