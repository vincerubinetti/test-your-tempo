// --------------------------------------------------
// ---------- Start
// --------------------------------------------------
window.onload = function () {
  MaxBeats = 32;

  InitScreens();
  InitBackground();
  InitTempos();
  InitMetronome();
  InitCanvases();

  Title.show();

  window.setTimeout(function () {
    Title.hide();
  }, 1500);
  window.setTimeout(BeginMenu, 2000);
};

function InitScreens() {
  Title = new Screen(["title", 0.5, 0.5, 0, -100, 0, -50, 0, 0]);
  Menu = new Screen(
    ["bpm_container", 0.25, 0.25, -50, -50, -50, -50, -50, -50],
    ["mute_container", 0.05, 0.05, 0, 0, 0, 0, 0, 0],
    ["unmute_container", 0.05, 0.05, 0, 0, 0, 0, 0, 0]
  );
  Test = new Screen(
    ["pie_canvas", 0.1, 0.5, 0, 0, 0, 0, 0, 0],
    ["reminder_container", 0.25, 0.25, -50, -50, -50, -50, -50, -100],
    ["cancel_container", 0.05, 0.05, 0, 0, 0, 0, 0, 0]
  );
  Results = new Screen(
    ["chart_canvas", 0.5, 0.25, 0, 0, 0, 0, 0, 0],
    ["results_container", 0.5, 0.25, -50, -50, -50, -50, -50, 0],
    ["back_container", 0.05, 0.05, 0, 0, 0, 0, 0, 0]
  );
}

function InitBackground() {
  Background = new BackgroundTemplate([
    "#f06292",
    "#ffd54f",
    "#dce775",
    "#81c784",
    "#4dd0e1",
    "#ce93d8",
  ]);
}

function InitTempos() {
  Tempos = [];
  for (var i = 40; i <= 240; i++) Tempos.push(i);
  for (var i = 50; i <= 190; i++) Tempos.push(i);
  for (var i = 60; i <= 180; i++) Tempos.push(i);
  for (var i = 70; i <= 170; i++) Tempos.push(i);
  for (var i = 80; i <= 160; i++) Tempos.push(i);
  for (var i = 90; i <= 150; i++) Tempos.push(i);
  for (var i = 100; i <= 140; i++) Tempos.push(i);
  SelectRandomTempo();
}

function InitMetronome() {
  Metronome = new MetronomeTemplate();
}

function InitCanvases() {
  Pie = new PieTemplate("pie_canvas");
  Chart = new ChartTemplate("chart_canvas", 20);
}

function SetOnTap(func) {
  document.onkeypress = func;
  document.ontouchstart = func;
  if ("ontouchstart" in document.documentElement === false)
    document.onmousedown = func;
}



// --------------------------------------------------
// ---------- Progression
// --------------------------------------------------

function BeginMenu() {
  Menu.show();
  SetOnTap(BeginTest);
}

function BeginTest(event) {
  if (event)
    if (
      event.target.id === "bpm_number" ||
      event.target.id === "refresh" ||
      event.target.id === "refresh_link" ||
      event.target.id === "mute_link" ||
      event.target.id === "unmute_link" ||
      event.target.id === "mute_icon" ||
      event.target.id === "unmute_icon"
    )
      return;

  if (document.activeElement.id === "bpm_number") return;

  Menu.hide();
  Test.show();

  Pie.init();
  PreviousTimestamp = null;
  Taps = [];
  SetOnTap(TapBeat);
  TapBeat();
}

function TapBeat(event) {
  if (event)
    if (event.target.id === "cancel" || event.target.id === "cancel_link")
      return;

  if (
    document.activeElement.id === "cancel" ||
    document.activeElement.id === "cancel_link"
  )
    return;

  if (PreviousTimestamp !== null) {
    Taps.push(
      Math.round(
        (1000 * 60) / Math.max(1, performance.now() - PreviousTimestamp)
      )
    );
    Taps[Taps.length - 1] = MinMax(Taps[Taps.length - 1], 0, 999);
  }
  PreviousTimestamp = performance.now();

  if (Taps.length + 2 > MaxBeats) {
    Pie.startFade();
    Test.hide();
    BeginResults();
  }

  Metronome.play();
  Pie.startPulse();
}

function BeginResults() {
  Results.show();
  SetOnTap(null);

  Chart.tempo = Tempo;
  Chart.taps = Taps.slice(0);
  Chart.startFade();
  Chart.resize();

  var average = Math.round(Taps.mean());
  var median = Math.round(Taps.median());
  var sd = Math.round(Taps.sd());

  var accuracy = Math.round(
    (1 - MinMax(Math.abs(average - Tempo) / Chart.range, 0, 1)) * 100
  );
  var precision = Math.round((1 - MinMax(sd / Chart.range, 0, 1)) * 100);

  document.getElementById("results_target").innerHTML = Tempo;
  document.getElementById("results_accuracy").innerHTML = accuracy + "%";
  document.getElementById("results_precision").innerHTML = precision + "%";

  document.getElementById("results_average").innerHTML = average;
  document.getElementById("results_median").innerHTML = median;
  document.getElementById("results_sd").innerHTML = sd;
}



// --------------------------------------------------
// ---------- Background
// --------------------------------------------------

function BackgroundTemplate(palette) {
  this.palette = palette;
  for (var i = 0; i < this.palette.length; i++)
    this.palette[i] = HexToRgb(this.palette[i]);

  this.index = this.palette.length - 1;

  this.change();

  var _this = this;

  document.body.addEventListener("transitionend", function (event) {
    _this.change(event);
  });
}

BackgroundTemplate.prototype.change = function (event) {
  if (event)
    if (
      event.target !== document.body ||
      !event.propertyName.includes("background")
    )
      return;

  this.index++;
  if (this.index > this.palette.length - 1) this.index = 0;

  if (event) document.body.style.transition = "background 5s linear";
  else document.body.style.transition = "background 0.2s linear";

  document.body.style.background = ColorToRgbString(this.palette[this.index]);
};



// --------------------------------------------------
// ---------- Tempo
// --------------------------------------------------

function SetTempo(value) {
  Tempo = value;
  document.getElementById("reminder_number").innerHTML = value;
  document.getElementById("bpm_number").value = value;
}

function SelectRandomTempo() {
  SetTempo(Tempos.rand());
}

function RefreshTempo() {
  Background.change();
  SelectRandomTempo();
}

function CleanTempoInput() {
  var value = document.getElementById("bpm_number").value;
  value = parseInt(value.replace(/\D/g, ""));

  if (typeof value !== "number" || Number.isNaN(value)) value = 120;
  if (value < 40) value = 40;
  if (value > 240) value = 240;

  document.getElementById("bpm_number").value = String(value);

  if (Tempo !== value) {
    SetTempo(value);
    Background.change();
  }
}



// --------------------------------------------------
// ---------- Screens
// --------------------------------------------------

function Screen() {
  this.parts = [];
  for (var argument of arguments) {
    this.parts.push({
      element: document.getElementById(argument[0]),
      showTime: argument[1],
      hideTime: argument[2],
      showX: argument[3],
      showY: argument[4],
      x: argument[5],
      y: argument[6],
      hideX: argument[7],
      hideY: argument[8],
    });
  }
  for (var part of this.parts) {
    part.element.style.transition = "none";
    part.element.style.opacity = 0;
    part.element.style.transform =
      "translate(" + part.showX + "%, " + part.showY + "%)";
    part.element.style.pointerEvents = "none";
    part.element.offsetHeight;
    var inputs = part.element.querySelectorAll("a, input");
    for (var input of inputs) input.disabled = true;
  }
}

Screen.prototype.show = function () {
  document.activeElement.blur();
  for (var part of this.parts) {
    part.element.style.transition = "none";
    part.element.style.opacity = 0;
    part.element.style.transform =
      "translate(" + part.showX + "%, " + part.showY + "%)";
    part.element.style.pointerEvents = "auto";
    part.element.offsetHeight;
    part.element.style.transition =
      "transform " +
      part.showTime +
      "s ease, opacity " +
      part.showTime +
      "s linear";
    part.element.style.opacity = 1;
    part.element.style.transform =
      "translate(" + part.x + "%, " + part.y + "%)";
    var inputs = part.element.querySelectorAll("a, input");
    for (var input of inputs) input.disabled = false;
  }
};

Screen.prototype.hide = function () {
  for (var part of this.parts) {
    part.element.style.transition = "none";
    part.element.style.opacity = 1;
    part.element.style.transform =
      "translate(" + part.x + "%, " + part.y + "%)";
    part.element.style.pointerEvents = "none";
    part.element.offsetHeight;
    part.element.style.transition =
      "transform " +
      part.hideTime +
      "s ease, opacity " +
      part.hideTime +
      "s linear";
    part.element.style.opacity = 0;
    part.element.style.transform =
      "translate(" + part.hideX + "%, " + part.hideY + "%)";
    var inputs = part.element.querySelectorAll("a, input");
    for (var input of inputs) input.disabled = true;
  }
};



// --------------------------------------------------
// ---------- Canvas
// --------------------------------------------------

function Canvas(element) {
  this.element = document.getElementById(element);
  this.context = this.element.getContext("2d");

  var _this = this;

  window.addEventListener("resize", function () {
    _this.resize();
  });
  this.resize();
}

Canvas.prototype.resize = function () {
  this.element.width = window.innerWidth;
  this.element.height = window.innerHeight;
  this.context.translate(this.element.width / 2, this.element.height / 2);
};

Canvas.prototype.clear = function () {
  this.context.save();
  this.context.setTransform(1, 0, 0, 1, 0, 0);
  this.context.clearRect(0, 0, this.element.width, this.element.height);
  this.context.restore();
};



// --------------------------------------------------
// ---------- Pie
// --------------------------------------------------

function PieTemplate(canvasElement) {
  this.init();

  this.canvas = new Canvas(canvasElement);
  this.resize();

  this.pulseTimer = null;
  this.fadeTimer = null;

  var _this = this;

  window.addEventListener("resize", function () {
    _this.resize();
  });
}

PieTemplate.prototype.init = function () {
  this.pulse = 1;
  this.taps = 0;
  this.maxBeats = MaxBeats;
  this.fading = false;
  this.fade = 0;

  this.rMin;
  this.rMax;
  this.aMin;
  this.aMax;

  this.clearTimers();
};

PieTemplate.prototype.clearTimers = function () {
  window.clearInterval(this.pulseTimer);
  window.clearInterval(this.fadeTimer);
  this.pulseTimer = null;
  this.fadeTimer = null;
};

PieTemplate.prototype.startPulse = function () {
  this.clearTimers();

  this.pulse = 1;
  this.taps++;

  var _this = this;

  this.pulseTimer = window.setInterval(function () {
    _this.pulseStep();
  }, 20);
};

PieTemplate.prototype.pulseStep = function () {
  this.pulse /= 1.25;
  if (this.pulse < 0.01) {
    this.pulse = 0;
    this.clearTimers();
  }
  this.draw();
};

PieTemplate.prototype.startFade = function () {
  this.clearTimers();

  this.fading = true;
  this.fade = 0;

  var _this = this;

  this.fadeTimer = window.setInterval(function () {
    _this.fadeStep();
  }, 20);
};

PieTemplate.prototype.fadeStep = function () {
  this.fade += 0.1;
  if (this.fade > 1) {
    this.fade = 1;
    this.clearTimers();
  }
  this.draw();
};

PieTemplate.prototype.draw = function () {
  var r, a;
  if (this.fading === true) {
    r = this.rMax * (1 + 0.25 * this.fade);
    a = this.aMax * (1 - this.fade);
  } else {
    r = this.rMin + this.pulse * (this.rMax - this.rMin);
    a = this.aMin + this.pulse * (this.aMax - this.aMin);
  }

  this.canvas.clear();
  this.canvas.context.globalAlpha = a;
  this.canvas.context.fillStyle = "black";
  this.canvas.context.beginPath();
  this.canvas.context.moveTo(0, 0);
  this.canvas.context.arc(
    0,
    0,
    r,
    1.5 * Math.PI,
    1.5 * Math.PI + (this.taps / this.maxBeats) * 2 * Math.PI
  );
  this.canvas.context.closePath();
  this.canvas.context.fill();
};

PieTemplate.prototype.resize = function () {
  this.canvas.resize();

  this.rMin =
    Math.min(this.canvas.element.width, this.canvas.element.height) / 6;
  this.rMax = this.rMin * 1.25;
  this.aMin = 0.5;
  this.aMax = 1.0;

  this.draw();
};



// --------------------------------------------------
// ---------- Chart
// --------------------------------------------------

function ChartTemplate(canvasElement, range) {
  this.tempo;
  this.taps;

  this.width;
  this.height;
  this.lineWidth;
  this.range = range;
  this.points = [];
  this.lines = [];

  this.fade = 0;
  this.timer = null;

  this.canvas = new Canvas(canvasElement);
  this.resize();

  var _this = this;

  window.addEventListener("resize", function () {
    _this.resize();
  });
  this.resize();
}

ChartTemplate.prototype.draw = function () {
  this.canvas.clear();

  if (this.taps === undefined) return;

  // global
  this.canvas.context.strokeStyle = "black";
  this.canvas.context.fillStyle = "black";
  this.canvas.context.lineJoin = "round";
  this.canvas.context.lineWidth = this.lineWidth;

  // integral fill
  this.canvas.context.globalAlpha = 0.1;
  for (var i = 0; i <= this.points.length; i++) {
    if (this.fade <= i) continue;

    if (i === 0) {
      this.canvas.context.beginPath();
      this.canvas.context.moveTo(0, this.points[0].y);
      this.canvas.context.lineTo(this.points[0].x, this.points[0].y);
      this.canvas.context.lineTo(this.points[0].x, -this.height / 2);
      this.canvas.context.lineTo(0, -this.height / 2);
      this.canvas.context.fill();
    } else if (i > 0 && i < this.points.length) {
      this.canvas.context.beginPath();
      this.canvas.context.moveTo(this.points[i].x, -this.height / 2);
      this.canvas.context.lineTo(this.points[i - 1].x, -this.height / 2);
      this.canvas.context.lineTo(this.points[i - 1].x, this.points[i - 1].y);
      this.canvas.context.lineTo(this.points[i].x, this.points[i].y);
      this.canvas.context.fill();
    } else if (i === this.points.length) {
      this.canvas.context.beginPath();
      this.canvas.context.moveTo(
        this.width,
        this.points[this.points.length - 1].y
      );
      this.canvas.context.lineTo(
        this.points[this.points.length - 1].x,
        this.points[this.points.length - 1].y
      );
      this.canvas.context.lineTo(
        this.points[this.points.length - 1].x,
        -this.height / 2
      );
      this.canvas.context.lineTo(this.width, -this.height / 2);
      this.canvas.context.fill();
    }
  }

  // vertical lines
  this.canvas.context.globalAlpha = 0.1;
  for (var i = 0; i < this.points.length; i++) {
    if (this.fade <= i) continue;

    if (this.points[i].limited) this.canvas.context.setLineDash([3, 3]);
    else this.canvas.context.setLineDash([]);

    this.canvas.context.beginPath();
    this.canvas.context.moveTo(this.points[i].x, -this.height / 2);
    this.canvas.context.lineTo(this.points[i].x, this.points[i].y);
    this.canvas.context.stroke();
  }
  this.canvas.context.setLineDash([]);

  // circles
  this.canvas.context.globalAlpha = 1;
  for (var i = 0; i < this.points.length; i++) {
    if (this.fade <= i) continue;

    if (!this.points[i].limited)
      this.drawPoint(this.points[i].x, this.points[i].y, this.lineWidth * 1.5);
  }

  // solid curve
  this.canvas.context.globalAlpha = 0.5;
  this.canvas.context.beginPath();
  for (var i = 0; i < this.points.length; i++) {
    if (this.fade <= i) continue;

    if (this.points[i].dotted)
      this.canvas.context.moveTo(this.points[i].x, this.points[i].y);
    else this.canvas.context.lineTo(this.points[i].x, this.points[i].y);
  }
  this.canvas.context.stroke();

  // dotted curve
  this.canvas.context.globalAlpha = 0.5;
  this.canvas.context.setLineDash([3, 3]);
  this.canvas.context.beginPath();
  for (var i = 0; i < this.points.length; i++) {
    if (this.fade <= i) continue;

    if (!this.points[i].dotted)
      this.canvas.context.moveTo(this.points[i].x, this.points[i].y);
    else this.canvas.context.lineTo(this.points[i].x, this.points[i].y);
  }
  this.canvas.context.stroke();
  this.canvas.context.setLineDash([]);

  // cut off graph at top and bottom
  this.canvas.context.clearRect(0, -this.height, this.width, -this.height * 10);
  this.canvas.context.clearRect(0, 0, this.width, this.height * 10);

  // axes
  this.canvas.context.lineCap = "square";
  this.canvas.context.globalAlpha = 1;
  this.canvas.context.beginPath();
  this.canvas.context.moveTo(0, -this.height);
  this.canvas.context.lineTo(0, 0);
  this.canvas.context.lineTo(this.width, 0);
  this.canvas.context.stroke();
  this.canvas.context.lineCap = "butt";

  // border
  this.canvas.context.lineCap = "square";
  this.canvas.context.globalAlpha = 0.1;
  this.canvas.context.beginPath();
  this.canvas.context.moveTo(0, -this.height);
  this.canvas.context.lineTo(this.width, -this.height);
  this.canvas.context.lineTo(this.width, 0);
  this.canvas.context.stroke();
  this.canvas.context.lineCap = "butt";

  // centerline
  this.canvas.context.globalAlpha = 0.1;
  this.canvas.context.beginPath();
  this.canvas.context.moveTo(0, -this.height / 2);
  this.canvas.context.lineTo(this.width, -this.height / 2);
  this.canvas.context.stroke();

  // y-axis tick marks
  this.canvas.context.lineCap = "square";
  this.canvas.context.globalAlpha = 1;
  for (var i = -this.range; i <= this.range; i++) {
    var length = null;

    if (i === 0 || i === -this.range || i === this.range || i % 10 === 0)
      length = 2.5;
    else if (i % 2 === 0) length = 1;

    if (length !== null) {
      this.canvas.context.beginPath();
      this.canvas.context.moveTo(
        0,
        -this.height / 2 - i * (this.height / (this.range * 2))
      );
      this.canvas.context.lineTo(
        -this.lineWidth * length,
        -this.height / 2 - i * (this.height / (this.range * 2))
      );
      this.canvas.context.stroke();
    }
  }
  this.canvas.context.lineCap = "butt";

  // y-axis text
  this.canvas.context.globalAlpha = 1;
  this.canvas.context.font = "20pt Gugi";
  this.canvas.context.textAlign = "right";
  this.canvas.context.textBaseline = "middle";
  this.canvas.context.fillText(
    this.tempo,
    -this.lineWidth * 5,
    -this.height / 2
  );
  this.canvas.context.font = "10pt Montserrat";
  this.canvas.context.fillText(
    "BPM",
    -this.lineWidth * 5,
    -this.height / 2 + 20
  );
  this.canvas.context.globalAlpha = 0.5;
  this.canvas.context.font = "14pt Gugi";
  this.canvas.context.textBaseline = "top";
  this.canvas.context.fillText(
    this.tempo + this.range,
    -this.lineWidth * 5,
    -this.height - 4
  );
  this.canvas.context.textBaseline = "bottom";
  this.canvas.context.fillText(this.tempo - this.range, -this.lineWidth * 5, 4);
};

ChartTemplate.prototype.startFade = function () {
  this.fade = 0;
  window.clearInterval(this.timer);
  var _this = this;

  this.timer = window.setInterval(function () {
    _this.fadeStep();
  }, 20);
};

ChartTemplate.prototype.fadeStep = function () {
  this.fade++;
  if (this.fade > this.taps.length) window.clearInterval(this.timer);
  this.draw();
};

ChartTemplate.prototype.drawPoint = function (x, y, r) {
  this.canvas.context.beginPath();
  this.canvas.context.arc(x, y, r, 0, 2 * Math.PI);
  this.canvas.context.fill();
};

ChartTemplate.prototype.resize = function () {
  this.canvas.resize();

  this.width = this.canvas.element.width / 2;
  this.height = this.canvas.element.height / 2.1;
  this.canvas.context.translate(-this.width / 2, 0);

  if (this.taps === undefined) return;

  this.lineWidth = Math.max(
    2,
    Math.round(Math.min(this.width, this.height) / 120)
  );

  this.points = [];
  for (var i = 0; i < this.taps.length; i++) {
    var point = {};
    point.relativeTempo = this.taps[i] - this.tempo;
    point.x = this.width * ((i + 1) / (this.taps.length + 1));
    point.y =
      -this.height / 2 - (point.relativeTempo / this.range) * (this.height / 2);
    point.limited =
      point.relativeTempo >= this.range || point.relativeTempo <= -this.range;
    point.dotted = false;
    this.points.push(point);
  }

  for (var i = 1; i < this.points.length; i++)
    this.points[i].dotted =
      this.points[i].limited || this.points[i - 1].limited;

  this.draw();
};



// --------------------------------------------------
// ---------- Metronome
// --------------------------------------------------

function MetronomeTemplate() {
  this.init();
  this.toggle();

  var uri = document.getElementById("metronome").src;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", uri);
  xhr.responseType = "arraybuffer";
  var _this = this;

  xhr.onload = function () {
    var arrayBuffer = xhr.response;

    _this.context.decodeAudioData(arrayBuffer, function (buffer) {
      _this.buffer = buffer;
    });
  };
  xhr.send();
}

MetronomeTemplate.prototype.init = function () {
  this.context = new (window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext ||
    window.msAudioContext)();
};

MetronomeTemplate.prototype.play = function () {
  var overlay = document.getElementById("overlay");
  overlay.style.transition = "opacity 0s linear";
  overlay.style.opacity = 0.15;
  overlay.offsetHeight;
  overlay.style.transition = "opacity 0.25s linear";
  overlay.style.opacity = 0;

  if (!this.context || !this.buffer) return;

  if (this.context.state === "suspended") this.init();

  if (!this.mute) {
    var sound = this.context.createBufferSource();
    sound.buffer = this.buffer;
    sound.connect(this.context.destination);
    sound.start(0);
  }
};

MetronomeTemplate.prototype.toggle = function () {
  if (this.context.state === "suspended") this.init();

  if (this.mute) {
    this.mute = false;
    document.getElementById("mute_container").style.display = "none";
    document.getElementById("unmute_container").style.display = "block";
    this.play();
  } else {
    this.mute = true;
    document.getElementById("unmute_container").style.display = "none";
    document.getElementById("mute_container").style.display = "block";
  }
};



// --------------------------------------------------
// ---------- Utility
// --------------------------------------------------

function ColorToRgbString(color) {
  var r = String(Math.round(color.r));
  var g = String(Math.round(color.g));
  var b = String(Math.round(color.b));

  return "rgb(" + r + "," + g + "," + b + ")";
}

function HexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

Array.prototype.rand = function () {
  return this[this.randi()];
};

Array.prototype.randi = function () {
  return Math.floor(Math.random() * this.length);
};

Array.prototype.sum = function () {
  var sum = 0;
  for (var i = 0; i < this.length; i++) sum += this[i];
  return sum;
};

Array.prototype.mean = function () {
  return this.sum() / this.length;
};

Array.prototype.median = function () {
  var clone = this.slice(0);
  clone.sort();
  var mid = Math.floor(clone.length / 2);
  return clone.length % 2 ? clone[mid] : (clone[mid] + clone[mid - 1]) / 2;
};

Array.prototype.sd = function () {
  var average = this.mean();
  var sum = 0;
  for (var i = 0; i < this.length; i++) sum += Math.pow(this[i] - average, 2);
  return Math.sqrt(sum / this.length);
};

function MinMax(value, min, max) {
  if (value < min) return min;
  else if (value > max) return max;
  else return value;
}
