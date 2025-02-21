<template>
  <div>
    <h1 class="cozy-font" id="about">About</h1>
    <p>
      Experience tranquility in FlowTrails, a low-poly mountain bike game that invites players to explore serene landscapes. Navigate picturesque trails filled with lush meadows and towering pines in a calming local multiplayer setting
    </p>
  </div>

  <div>
    <h2>Controls</h2>
    <div class="controlls">
      <div class="player-row">
        <p>Player 1</p>
        <div class="controll-row">
          <p>Movement: </p>
          <div class="keymaps">
            <p>W</p>
            <p>A</p>
            <p>S</p>
            <p>D</p>
          </div>
        </div>
        <div class="controll-row">
          <p>Bell: </p>
          <div class="keymaps">
            <p>E</p>
          </div>
        </div>
        <div class="controll-row">
          <p>Dropper post: </p>
          <div class="keymaps">
            <p>Q</p>
          </div>
        </div>
      </div>
      <div class="player-row">
        <p>Player 2</p>
        <div class="controll-row">
          <p>Movement: </p>
          <div class="keymaps">
            <p>⬆</p>
            <p>⬅</p>
            <p>⬇</p>
            <p>➡</p>
          </div>
        </div>
        <div class="controll-row">
          <p>Bell: </p>
          <div class="keymaps">
            <p>RShift</p>
          </div>
        </div>
        <div class="controll-row">
          <p>Dropper post: </p>
          <div class="keymaps">
            <p>Pg Dn</p>
          </div>
        </div>
      </div>
    </div>
  </div>
    
  <div>
    <h2>The technical stuff</h2>
    <div class="icons">
      <img src="../assets/icons/blender-software.svg">
      <img src="../assets/icons/godot.svg">
      <img src="../assets/icons/webgl.svg">
      <img src="../assets/icons/vue-js.svg">
      <img src="../assets/icons/inkscape.svg">
    </div>
  </div>
    

  </template>
  
  <script>
  export default {
    data() {
      return {
        selectedTab: 0,
        techniques: [
          { name: "Physics", description: "Implemented realistic physics using Godot's built-in physics engine." },
          { name: "Shaders", description: "Used custom shaders to create dynamic terrain and water effects." },
          { name: "Multiplayer", description: "Designed local multiplayer mechanics with split-screen support." }
        ]
      };
    }
  };
  </script>
  
  <style scoped>

.icons {
  display: flex;
  justify-content: space-around;
}

.icons img {
  width:80px;
  height:80px;
  filter: brightness(0) saturate(100%) invert(27%) sepia(7%) saturate(370%) hue-rotate(169deg) brightness(90%) contrast(90%);
}

.player-row{
  display:flex;
  flex-direction: column;
  gap:10px;
}
.controll-row {
  display:flex;
  gap: 60px;
  justify-content: space-between;
}
  .key {
    background-color: #dbdbdb;
    border-radius: 8px;
    padding:4px;
    flex-shrink: 1;
  }

  .keymaps {
    display: flex;
    gap:8px;
    
  }

  .keymaps p {
    background-color: #dbdbdb;
    border-radius: 8px;
    padding:4px;
    min-width: 40px;
    text-align: center;
  }

  .controlls {
    display: flex;
    justify-content: space-between;
  }

  .tabs-container {
  margin-top: 20px;
  text-align: center;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  background: #444;
  color: white;
  font-size: 1rem;
  transition: 0.3s;
}

.tabs button.active {
  background: #f39c12;
}

.tab-content {
  margin-top: 20px;
  font-size: 1.2rem;
  color: white;
}
  </style>