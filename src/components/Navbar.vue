// HeroSection.vue
<template>
  <div id="navbar">
    <div id="links">
        <img src="../assets/logo.svg">
        <a href="#hero">Hero</a>
        <a href="#game">The Game</a>
        <a href ="#about">About</a>
    </div>
  </div>
</template>

<script>
export default {
  name: "Hero"
};

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 400) {
    document.getElementById("navbar").style.top = "0";
  } else {
    document.getElementById("navbar").style.top = "-100px";
  }
}
</script>

<style scoped>
    #navbar{
        width: 100%;
        margin:0 auto;
        display:flex;
        justify-content: center;
        position: fixed;
        padding:20px;
        top:-100px;
        transition: all, 0.3s;
    }
    #navbar a {
        text-decoration: none;
        color:inherit
    }

    #navbar a:hover {
        color: #f9c51b;
        cursor:pointer;
    }

    #navbar img {
        width:64px;
    }

    #links {
        /* background-color: rgba(79, 79, 79, 0.849); */
        background-color: #202225A6;
        display:flex;
        justify-content: space-around;
        flex-grow: 1;
        max-width: 800px;
        padding:10px;
        border-radius: 16px;
        backdrop-filter: blur(20px);
        color: white;
        /* border:1px solid darkgray */
    }
</style>