<div class='container'>
  <div class='foam foam--filling'>
    <div class='foam__item'>
      <div class='foam__item__circle'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle foam__item__circle--bottom'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle foam__item__circle--bottom'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle foam__item__circle--bottom'></div>
    </div>
    <div class='foam__item'>
      <div class='foam__item__circle'></div>
    </div>

  </div>
  <div class='glass' id='glass'></div>
  <div class='grip'></div>
  <div class='liquid liquid--filling' id='liquid'></div>
</div>
$beer-color: #F5A510;
$glass-border-color: #FFF;

$glass-border: 5px;
$glass-height: 200px;
$glass-width: 120px;
$grip-width: 40px;
$grip-height: 90px;

$foam-item-width: (($glass-width - (2 * $glass-border)) / 8);
$foam-circle-diameter: $foam-item-width + ($foam-item-width * 0.90);
$foam-item-height: $foam-circle-diameter + ($foam-circle-diameter / 2);

$bubble-size: 1px;
$bubble-size-big: 2px;

$filling-duration: 2s;

body {
  background-color: #555;
  height: 100vh;
  margin: 0;
}

body, .container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  position: relative;
}

.glass {
  width: $glass-width;
  height: $glass-height;
  
  border-bottom: $glass-border solid $glass-border-color;
  border-left: $glass-border solid $glass-border-color;
  border-right: $glass-border solid $glass-border-color;
  border-radius: 0 0 10% 10%;
}

.grip {
  width: $grip-width;
  height: $grip-height;
  border-bottom: $glass-border solid $glass-border-color;
  border-top: $glass-border solid $glass-border-color;
  border-right: $glass-border solid $glass-border-color;
  border-radius: 0 10% 30% 0;
  margin-bottom: 10px;
}

.foam {
  display: relative;
  position: absolute;
  height: 45px;
  top: 0;
  left: 1px;
  z-index: 100;
}

.foam__item {
  width: $foam-item-width;
  height: $foam-item-height; 
  display: inline-block;
}

.foam__item__circle {
  width: $foam-circle-diameter;
  height: $foam-circle-diameter;
  background: white;
  border-radius: 50%;
  position: absolute;
}

.foam__item__circle--bottom {
  margin-top: $foam-circle-diameter / 4;
}

@keyframes fill-foam {
  from {top: ($glass-height - $foam-circle-diameter);}
  to {top: 0px;}
}
.foam--filling {
  animation: fill-foam $filling-duration ease-in-out;
}

.liquid {
  background-color: $beer-color;
  width: $glass-width;
  height: ($glass-height - ($foam-circle-diameter / 2));
  position: absolute;
  left: $glass-border;
  bottom: $glass-border;
  border-radius: 0 0 8% 8%;
}
@keyframes fill-liquid {
  0% {
    height: 0px;
  }
}
.liquid--filling {
  animation: fill-liquid $filling-duration ease-in-out;
}

@keyframes bubble {
  0% {
    bottom: $glass-border;
  }
  100% {
    bottom: $glass-height;
  }
}

.bubble {
  height: $bubble-size;
  width: $bubble-size;
  border-radius: 50%;
  border: 1px solid #fff;
  z-index: 90;
  position: absolute;
  left: 15px;
  animation: bubble $filling-duration infinite ease-in;
  background-color: #fff;
  opacity: .4;
}

.bubble--big {
  height: $bubble-size-big;
  width: $bubble-size-big;
}
function createBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (Math.random() < 0.2) {
      bubble.className += ' bubble--big';
  }
  bubble.style.left = `${5 + Math.random() * 110}px`;
  return bubble;
}

function generateBubbles() {
  const glass = document.getElementById('glass');
  for (let i = 0; i < 30; i++) {
    (function(time) {
      console.log(time)
      setTimeout(() => glass.appendChild(createBubble()), time)
    })(66*i);
  }
}

generateBubbles();