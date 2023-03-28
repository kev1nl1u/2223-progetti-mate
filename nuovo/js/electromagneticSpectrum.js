//Conmfigurazione del grafico onda
var wavelengthConfig = {
  graphID: "waveViewGraph", // ID for the SVG context for the graph.
  containerID: "waveView", // Graph will be inserted into this element.
  width: $("#waveView").width(), // Outer dim.  If blank, will take from container element (TODO).
  height: $("#waveView").width() / 2, // Outer dim.  If blank, will take from container element (TODO).
  gmargin: { top: 10, right: 20, bottom: 40, left: 60 }, // graph area margins
  xmin: 0,
  xmax: 2000, // nm
  ymin: -1,
  ymax: 1,
  xlabel: "Nanometers",
  ylabel: "Amplitude",
  xticks: 5, // Number of ticks on axis.  Auto if 0.
  yticks: 5, // Number of ticks on axis.  Auto if 0.
  xtickFormat: null, // Number format for tick-mark labels.  See d3-format.
  ytickFormat: null, // Number format for tick-mark labels.  See d3-format.
  zeroLine: false, // If true, adds a line across y=0.
  sortLinesByX: true, // Sort line data by increasing x value.
  fastTransition: 50, // Animation duration (ms)
  slowTransition: 600, // For slower animations, e.g. enter/exit.
};

//Conmfigurazione del grafico fotoni
var photonGraphConfig = {
  graphID: "photonGraph", // ID for the SVG context for the graph.
  containerID: "photonView", // Graph will be inserted into this element.
  width: $("#photonView").width(), // Outer dim.  If blank, will take from container element (TODO).
  height: $("#photonView").width() / 2, // Outer dim.  If blank, will take from container element (TODO).
  gmargin: { top: 10, right: 10, bottom: 40, left: 60 }, // graph area margins
  xmin: -5,
  xmax: 5, // nm
  ymin: -1,
  ymax: 1,
  xlabel: "Nanometers",
  ylabel: "Amplitude",
  xticks: 5, // Number of ticks on axis.  Auto if 0.
  yticks: 5, // Number of ticks on axis.  Auto if 0.
  xtickFormat: null, // Number format for tick-mark labels.  See d3-format.
  ytickFormat: null, // Number format for tick-mark labels.  See d3-format.
  zeroLine: false, // If true, adds a line across y=0.
  sortLinesByX: true, // Sort line data by increasing x value.
  fastTransition: 50, // Animation duration (ms)
  slowTransition: 600, // For slower animations, e.g. enter/exit.
};

//Creazione dei grafici
var wavelengthGraph = new KCVSGraph(wavelengthConfig);
var photonGraph = new KCVSGraph(photonGraphConfig);

//Creazione dati per i grafici
var currentWavelength = 550;
var currentRGB = "rgb(0, 0, 0)";
var currentFreq = 5.45;
var currentEnergy = 5.45;
var wavelengthArray = {
  id: "wavelengthLine",
  x: [],
  y: [],
};
var photonArrayRight = {
  id: "photonLineRight",
  x: [],
  y: [],
};
var photonArrayLeft = {
  id: "photonLineLeft",
  x: [],
  y: [],
};
var RGBValues = [0, 0, 0];

//Disegno i grafici
wavelengthGraph.addLine(wavelengthArray);
photonGraph.addLine(photonArrayRight);
photonGraph.addLine(photonArrayLeft);

//Funzione per aggiornare la lunghezza d'onda
function updateWavelength() {
  var hue = rgbToHsl(RGBValues)[0];
  frequency = 780 - (400 / 360) * hue;
  currentWavelength = frequency - 40;
  /* approssimazione molto approssimata */
}

// Funzione per aggiornare la frequenza
function updateFreq() {
  var c = 2.9979e17;
  currentFreq = c / currentWavelength;
  currentFreq = currentFreq / 1e14;
  currentFreq = currentFreq.toPrecision(3);
  var output = "Frequency = " + currentFreq + " x 10<sup>14</sup>";
  $("#frequency").html(output);
  return;
}

//Funzione per aggiornare l'energia
function updateEnergy() {
  // 1240  = speed of light * Planck's constant
  currentEnergy = 1240 / currentWavelength;
  currentEnergy = currentEnergy.toPrecision(3);
  var output = "Energy = " + currentFreq + " (eV)";
  $("#energy").html(output);
  return;
}

//Funzione per aggiornare l'array per il grafico dell'onda
function updateWavelengthArray() {
  var n = 100;
  wavelengthArray.x = Array(n);
  wavelengthArray.y = Array(n);
  for (var i = 0; i < n; i++) {
    wavelengthArray.x[i] = (wavelengthGraph.getXmax() * i) / n;
    wavelengthArray.y[i] = Math.sin(
      (2 * Math.PI * wavelengthArray.x[i]) / currentWavelength
    );
  }
  $("#wavelengthLine").css("stroke", currentRGB);
}

//Funzione per aggiornare l'array per il grafico dei fotoni
function updatePhotonArray() {
  var n = 250;
  photonArrayRight.x = Array(n);
  photonArrayRight.y = Array(n);
  photonArrayLeft.x = Array(n);
  photonArrayLeft.y = Array(n);
  for (var i = 0; i < n; i++) {
    photonArrayRight.x[i] = (photonGraph.getXmax() * i) / n;
    photonArrayRight.y[i] =
      1 *
      Math.exp(-photonArrayRight.x[i]) *
      Math.sin((5500 / currentWavelength) * photonArrayRight.x[i]);
  }
  for (var i = 0; i < n; i++) {
    photonArrayLeft.x[i] = ((photonGraph.getXmax() * i) / n) * -1;
    photonArrayLeft.y[i] =
      1 *
      Math.exp(photonArrayLeft.x[i]) *
      Math.sin((5500 / currentWavelength) * photonArrayLeft.x[i]);
  }
  $("#photonLineRight").css("stroke", currentRGB);
  $("#photonLineLeft").css("stroke", currentRGB);
}

//Convertitore RGB -> HSL
function rgbToHsl(c) {
  var r = c[0] / 255,
    g = c[1] / 255,
    b = c[2] / 255;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
    return new Array(-1,0,0);
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return new Array(h * 360, s * 100, l * 100);
}

//Funzione per aggiornare tutti i grafici
function update() {
  let hue = rgbToHsl(RGBValues)[0];
  if(hue == -1)
  {
    console.log("clanc" + currentRGB);
    $("#result-box").css("background-color", currentRGB);
    $("#result-text").text("Non è possibile visualizzare il colore selezionato");
    return;
  }
  $('#grafico-1')[0].scrollIntoView();
  updateWavelength();
  updateWavelengthArray();
  updatePhotonArray();
  console.log("Updating Wavelength");
  console.log("Current wavelength: " + currentWavelength);
  console.log("Current RGB Color: " + currentRGB);
  console.log("Current Frequency: " + currentFreq);
  console.log("Current Energy: " + currentEnergy);
  console.log("Updated wavelength: " + currentWavelength);
  console.log("Updated RGB Color: " + currentRGB);
  updateFreq();
  console.log("Updated Energy: " + currentEnergy);
  console.log("Updated Frequency: " + currentFreq);
  updateEnergy();
  
  wavelengthGraph.updateLine(
      wavelengthArray.id,
      wavelengthArray.x,
      wavelengthArray.y
  );
  photonGraph.updateLine(
      photonArrayRight.id,
      photonArrayRight.x,
      photonArrayRight.y
  );
  photonGraph.updateLine(
      photonArrayLeft.id,
      photonArrayLeft.x,
      photonArrayLeft.y
  );
}
//Dati per le funzioni relative all'immagine
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
// Funzione per leggere e stampare l'immagine sul canvas
function drawCanvas(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.src = e.target.result;
      img.addEventListener("load", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // l'immagine deve essere scalata max 60 vh e 60 vw
        var ratioX = vw(60) / img.width;
        var ratioY = vh(60) / img.height;

        var ratio = Math.min(ratioX, ratioY);

        canvas.width = img.width * ratioX;
        canvas.height = img.height * ratioY;
        x = canvas.width / 2 - (img.width / 2) * ratio,
        // get the top left position of the image
        y = canvas.height / 2 - (img.height / 2) * ratio;
        // canvas.width = img.width * ratio;
        // canvas.height = img.height * ratio;
        // IO ODIO IL CSS E IL JS PORCACCINA
        ctx.drawImage(img, x,y, img.width*ratio, img.height*ratio);
      });
    };
    reader.readAsDataURL(input.files[0]);
  }
  // Scrolla la pagina fino al canvas
  $('#color-picker')[0].scrollIntoView();
}

function vh(v) {
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  return (v * h) / 100;
}

function vw(v) {
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  return (v * w) / 100;
}

// eyedrop color picker
if(window.EyeDropper) {
  $("#imgInp").show();
  $("canvas").hide();
  document.getElementById("imgInp").addEventListener("click", () => {
    textResult = $("#result-text");
    boxResult = $("#result-box");

    if (!window.EyeDropper) {
      textResult.text("Your browser does not support the EyeDropper API");
      return;
    }

    const eyeDropper = new EyeDropper();
    const abortController = new AbortController();

    eyeDropper
      .open({ signal: abortController.signal })
      .then((result) => {
        textResult.text(result.sRGBHex);
        boxResult.css("background-color", result.sRGBHex);

        // valori numerici RGB
        RGBValues = hexToRgb(result.sRGBHex);
        // stringa rgb(r,g,b);
        currentRGB = `rgb(${RGBValues[0]}, ${RGBValues[1]}, ${RGBValues[2]})`;
        update();
      })
  });
} else {
  console.log("EyeDropper API not supported");
  canvas.addEventListener("click", (event) => pick_select(event));
  $("#imgInp").hide();
  $("canvas").show();
}

// Funzione che converte un colore(#ff3f3f) in RGB
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
   ] : null;
}

function pick_select(event) {
  const bounding = canvas.getBoundingClientRect();
  const x = event.clientX - bounding.x;
  const y = event.clientY - bounding.y;
  const pixel = ctx.getImageData(x, y, 1, 1);
  const data = pixel.data;

  const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
  currentRGB = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;

  RGBValues = [data[0], data[1], data[2]];

  textResult = $("#result-text");
  boxResult = $("#result-box");

  textResult.text(currentRGB);
  boxResult.css("background-color", currentRGB);

  update();
  return rgba;
}