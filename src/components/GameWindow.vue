<template>
    <div class="game-container" id="game">
      <iframe :src="gameUrl" frameborder="0" allowfullscreen></iframe>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        gameUrl: '/FlowTrailsGame/FlowTrails.html',
      };
    },
  };

  // document.addEventListener('keydown', logKey);
  //   function logKey(e) {
  //     if (`${e.code}` == "KeyF") {
  //       alert("Fullscreen");
  //       document.getElementsByTagName("iframe")[0].className = "fullScreen";
  //     }
  //         if (`${e.code}` == "ArrowLeft") {
  //       //code here
  //     }
  //         if (`${e.code}` == "ArrowDown") {
  //       //code here
  //     }
  //         if (`${e.code}` == "ArrowUp") {
  //       //code here
  //     }
  //   }

  </script>
  
  <style scoped>
  .game-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  iframe {
    border-radius: 16px;
    width: 100%;
    aspect-ratio: 2;
    border: none;
  }
  </style>
  