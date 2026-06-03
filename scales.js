/* =========================================================================
 * Escalas proporcionales — Rex+
 *
 * Sincroniza N sliders de distinto rango usando escalado lineal min-max.
 * Todas las escalas comparten la misma "posición relativa" t ∈ [0, 1]:
 *
 *     t      = (valor − min) / (max − min)            // valor → proporción
 *     valor  = min + t · (max − min)                  // proporción → valor
 *
 * Así los sliders coinciden en sus mínimos (t=0) y máximos (t=1), y un 3.5/5
 * equivale a un 7/10 porque ambos son el 50% de su recorrido.
 * ===================================================================== */

// --- Configuración: edita aquí para añadir/quitar escalas o cambiar colores ---
const SCALES = [
  { id: "s3",   min: 1, max: 3,   color: "#00B5FF" }, // cian — color de marca Rex+
  { id: "s5",   min: 1, max: 5,   color: "#0066FF" }, // azul
  { id: "s7",   min: 1, max: 7,   color: "#00C2A8" }, // turquesa
  { id: "s10",  min: 1, max: 10,  color: "#7A5CFF" }, // violeta
  { id: "s100", min: 1, max: 100, color: "#FF7A29" }, // naranja
];

const DRAG_STEP = 0.1;   // de a cuánto avanza el slider que arrastras
const FINE_STEP = 0.01;  // precisión interna: deja que el thumb caiga donde dice la etiqueta
const DECIMALS = 2;      // decimales mostrados en el valor

// Ancho de cada slider según su recorrido (max − min). Usamos un exponente < 1
// (raíz cuadrada) para "suavizar" la proporción: el 1–100 ocupa el ancho completo
// y los rangos chicos siguen siendo cómodos de usar, conservando el orden.
// Sube WIDTH_EXPONENT a 1 para proporción estrictamente lineal.
const WIDTH_EXPONENT = 0.5;
const MAX_RANGE = Math.max(...SCALES.map((s) => s.max - s.min));
const widthPctOf = (scale) =>
  (Math.pow((scale.max - scale.min) / MAX_RANGE, WIDTH_EXPONENT) * 100).toFixed(2);

// Estado compartido: proporción inicial (0.5 = centro).
let t = 0.5;

// --- Helpers de conversión ------------------------------------------------
const valueOf = (scale, prop) => scale.min + prop * (scale.max - scale.min);
const propOf  = (scale, value) => (value - scale.min) / (scale.max - scale.min);

// --- Construcción del DOM -------------------------------------------------
const container = document.getElementById("scales");
const refs = []; // { scale, input, valueEl }

for (const scale of SCALES) {
  const row = document.createElement("section");
  row.className = "scale";
  row.innerHTML = `
    <div class="scale__head">
      <span class="scale__label">
        <span class="scale__dot" style="background:${scale.color}"></span>
        Escala ${scale.min}–${scale.max}
        <span class="scale__range">(paso ${DRAG_STEP})</span>
      </span>
      <span class="scale__value" id="${scale.id}-val"></span>
    </div>
    <div class="scale__row">
      <span class="scale__minmax">${scale.min}</span>
      <span class="scale__lane">
        <input
          type="range"
          id="${scale.id}"
          min="${scale.min}"
          max="${scale.max}"
          step="${FINE_STEP}"
          style="--c:${scale.color}; width:${widthPctOf(scale)}%"
        />
      </span>
      <span class="scale__minmax">${scale.max}</span>
    </div>
  `;
  container.appendChild(row);

  const input = row.querySelector("input");
  const valueEl = row.querySelector(`#${scale.id}-val`);
  refs.push({ scale, input, valueEl });

  // Al mover este slider: lo cuantizamos a pasos de 0.1, derivamos la
  // proporción y refrescamos todos.
  input.addEventListener("input", () => {
    const stepped = Math.round(parseFloat(input.value) / DRAG_STEP) * DRAG_STEP;
    t = propOf(scale, stepped);
    render();
  });
}

// --- Render: vuelca la proporción `t` en cada slider ----------------------
function render() {
  t = Math.min(1, Math.max(0, t)); // sujeta a [0, 1]
  const pct = (t * 100).toFixed(DECIMALS);

  for (const { scale, input, valueEl } of refs) {
    input.value = valueOf(scale, t);              // el navegador encaja al paso fino (0.01)
    input.style.setProperty("--fill", pct + "%"); // relleno coloreado (WebKit)
    // La etiqueta se lee del valor real del slider → thumb y número coinciden.
    valueEl.textContent = parseFloat(input.value).toFixed(DECIMALS);
    valueEl.style.color = scale.color;
  }

  document.getElementById("pct").textContent = pct + "%";
}

// --- Botón "Centrar todo" -------------------------------------------------
document.getElementById("reset").addEventListener("click", () => {
  t = 0.5;
  render();
});

// Estado inicial.
render();
