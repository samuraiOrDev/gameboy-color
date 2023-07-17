var gba;
var runCommands = [];
//Configuración del Emulador
try {
  gba = new GameBoyAdvance();
  gba.keypad.eatInput = true;

  gba.setLogger(function (level, error) {
    console.error(error);

    gba.pause();

    var screen = document.getElementById("screen");

    if (screen.getAttribute("class") == "dead") {
      alert("We appear to have crashed multiple times without reseting.");
      return;
    }
  });
} catch (exception) {
  gba = null;
}
//Inicializamos el emulador una vez cargado el navegador

window.onload = function () {
  //FileReader -> Permite que las aplicaciones web lean ficheros almacenados en el cliente de forma asíncrona, usando los objetos File o Blob dependiendo de los datos que se pretenden leer.
  if (gba && FileReader) {
    var canvas = document.getElementById("screen-canvas");
    gba.setCanvas(canvas);
    gba.logLevel = gba.LOG_ERROR;
    // Cargue el archivo BIOS de GBA
    loadRom("./assets/bios.bin", function (bios) {
      gba.setBios(bios);
    });
    //Contexto de Audio
    if (!gba.audio.context) {
      // Retire la caja de sonido si el sonido no está disponible
      var soundbox = document.getElementById("sound");
      soundbox.parentElement.removeChild(soundbox);
    }
  } else {
    alert("Your browser does not support the GameBoy Advance emulator.");
  }
};

//Funciones
function fadeOut(id, nextId, kill) {
  var e = document.getElementById(id);
  var e2 = document.getElementById(nextId);
  if (!e) {
    return;
  }

  var removeSelf = function () {
    if (kill) {
      e.parentElement.removeChild(e);
    } else {
      e.setAttribute("class", "dead");
      e.removeEventListener("webkitTransitionEnd", removeSelf);
      e.removeEventListener("oTransitionEnd", removeSelf);
      e.removeEventListener("transitionend", removeSelf);
    }
    if (e2) {
      e2.setAttribute("class", "hidden");
      setTimeout(function () {
        e2.removeAttribute("class");
      }, 0);
    }
  };

  e.addEventListener("webkitTransitionEnd", removeSelf, false);
  e.addEventListener("oTransitionEnd", removeSelf, false);
  e.addEventListener("transitionend", removeSelf, false);
  e.setAttribute("class", "hidden");
}

/**
 * Inicia el emulador con el archivo ROM dado
 *
 * @param file
 */
function run(file) {
  var dead = document.getElementById("loader");
  dead.value = "";
  gba.loadRomFromFile(file, function (result) {
    if (result) {
      for (var i = 0; i < runCommands.length; ++i) {
        runCommands[i]();
      }
      runCommands = [];
      fadeOut("preload", "ingame");
      fadeOut("instructions", null, true);
      gba.runStable();
    } else {
      setTimeout(function () {
        load.onclick = function () {
          document.getElementById("loader").click();
        };
      }, 3000);
    }
  });
}
/**
 * Reiniciar o Apagar el emulador
 *
 */
function reset() {
  gba.pause();
  gba.reset();
  // var load = document.getElementById('select');
  var crash = document.getElementById("crash");
  if (crash) {
    var context = gba.targetCanvas.getContext("2d");
    context.clearRect(0, 0, 480, 320);
    gba.video.drawCallback();
    crash.parentElement.removeChild(crash);
    var canvas = document.getElementById("screen");
    canvas.removeAttribute("class");
  } else {
    lcdFade(
      gba.context,
      gba.targetCanvas.getContext("2d"),
      gba.video.drawCallback
    );
  }
  // load.onclick = function() {
  // 	document.getElementById('loader').click();
  // }
  fadeOut("ingame", "preload");
  console.log(gba.rom);
  // gba.rom = null;
}

/**
 * Almacena los datos del archivo guardado en el emulador.
 *
 * @param file
 */
function uploadSavedataPending(file) {
  runCommands.push(function () {
    gba.loadSavedataFromFile(file);
  });
}

/**
 * Alterna el estado del juego
 */
function togglePause() {
  var e = document.getElementById("pause");

  if (gba.paused) {
    gba.runStable();
    e.textContent = "PAUSE";
  } else {
    gba.pause();
    e.textContent = "UNPAUSE";
  }
}

/**
 * A partir de un contexto de lienzo, crea una animación LCD que desvanece el contenido.
 *
 * @param context
 * @param target
 * @param callback
 */
function lcdFade(context, target, callback) {
  var i = 0;

  var drawInterval = setInterval(function () {
    i++;

    var pixelData = context.getImageData(0, 0, 240, 160);

    for (var y = 0; y < 160; ++y) {
      for (var x = 0; x < 240; ++x) {
        var xDiff = Math.abs(x - 120);
        var yDiff = Math.abs(y - 80) * 0.8;
        var xFactor = (120 - i - xDiff) / 120;
        var yFactor =
          (80 - i - (y & 1) * 10 - yDiff + Math.pow(xDiff, 1 / 2)) / 80;
        pixelData.data[(x + y * 240) * 4 + 3] *=
          Math.pow(xFactor, 1 / 3) * Math.pow(yFactor, 1 / 2);
      }
    }

    context.putImageData(pixelData, 0, 0);

    target.clearRect(0, 0, 480, 320);

    if (i > 40) {
      clearInterval(drawInterval);
    } else {
      callback();
    }
  }, 50);
}

/**
 * Establece el volumen del emulador.
 *
 * @param value
 */
function setVolume(value) {
  console.log(gba.audio.masterVolume);
  gba.audio.masterVolume = Math.pow(2, value) - 1;
}
// setVolume();
document.getElementById("loader").addEventListener("change", function () {
  run(this.files[0]);
});

// Funcionalidad de la Consola
const powerButton = document.querySelector(".button-power");
const Screen = document.querySelector(".screen");

powerButton.addEventListener("click", function () {
  if (powerButton.style.boxShadow !== "none") {
    powerButton.style.boxShadow = "none";
    console.log("Entramos aqui");
    document.getElementById("loader").click();
  } else {
    powerButton.style.boxShadow = "8px 2px 10px inset";
    reset();
  }
});

const crossRight = document.querySelector(".cursor.right");

crossRight.addEventListener("myEventName", doSomething, false);
function doSomething(e) {
  console.log(e);
  console.log("Event is called:" + e.type);
}
let event = new MouseEvent("myEventName", {
  bubbles: true,
  cancelable: true,
  clientX: 100,
  clientY: 100,
});
crossRight.dispatchEvent(event);
