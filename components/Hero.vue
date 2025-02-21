<template>
  <div class="hero" id="hero">
    <img src="../public/icons/logo.svg" class="header-logo">
  </div>
</template>

<script>
export default {
  name: "Hero"
};
</script>

<style scoped>
.webbu {
  display:flex;
  flex-direction: column;
  padding: 40px;;
  background-color: #1B1D1FFF;
  flex-grow: 0;
  justify-content: center;
  align-items: center;
  gap:20px;
  color: white;
  border-radius: 16px;
}
.webbu p {
  color:white;
}

.hero {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.header-logo {
  width:50%;
}
</style>