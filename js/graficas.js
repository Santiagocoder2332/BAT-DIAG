"use strict";

/*
============================================================
 BAT-DIAG
 graficas.js

 Sistema de visualización de las variables del CSV.

 VARIABLES DISPONIBLES:
   - Voltaje
   - Corriente
   - Temperatura batería
   - Temperatura ambiente
   - Humedad relativa

 No utiliza librerías externas.
 La gráfica se construye mediante SVG.

 CONFIGURACIÓN VISUAL:
   - Fondo blanco.
   - Rejilla visible.
   - Ejes limpios.
   - Línea de datos por variable.
   - Puntos de medición.
============================================================
*/


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const BAT_DIAG_GRAPH_CONFIG = {

    animationDuration: 350,


    margins: {

        top: 30,

        right: 30,

        bottom: 55,

        left: 65

    },


    colors: {

        voltaje:
            "#1769d1",

        corriente:
            "#12a85a",

        tempBateria:
            "#ef3340",

        tempAmbiente:
            "#f28c00",

        humedad:
            "#7046d9"

    },


    labels: {

        voltaje: {

            nombre:
                "Voltaje",

            unidad:
                "V",

            color:
                "#1769d1"

        },


        corriente: {

            nombre:
                "Corriente",

            unidad:
                "A",

            color:
                "#12a85a"

        },


        tempBateria: {

            nombre:
                "Temperatura batería",

            unidad:
                "°C",

            color:
                "#ef3340"

        },


        tempAmbiente: {

            nombre:
                "Temperatura ambiente",

            unidad:
                "°C",

            color:
                "#f28c00"

        },


        humedad: {

            nombre:
                "Humedad relativa",

            unidad:
                "%",

            color:
                "#7046d9"

        }

    }

};


/* =========================================================
   ESTADO
========================================================= */

const BAT_DIAG_GRAPH_STATE = {

    measurements: [],

    variable:
        "voltaje",

    showGrid:
        true,

    autoScale:
        true,

    initialized:
        false,

    svg:
        null,

    width:
        0,

    height:
        0,

    chartWidth:
        0,

    chartHeight:
        0,

    points:
        [],

    xValues:
        [],

    yValues:
        [],

    yMin:
        0,

    yMax:
        1,

    firstTime:
        null,

    lastTime:
        null

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarGraficas
);


function iniciarGraficas() {

    console.log(
        "BAT-DIAG: inicializando módulo de gráficas..."
    );


    conectarSelector();


    conectarControles();


    actualizarDesdeBATDIAG();


    window.addEventListener(
        "resize",
        function () {

            if (
                BAT_DIAG_GRAPH_STATE.initialized
            ) {

                renderizarGrafica();

            }

        }
    );


    BAT_DIAG_GRAPH_STATE.initialized =
        true;


    console.log(
        "BAT-DIAG: módulo de gráficas listo."
    );

}


/* =========================================================
   OBTENER CONTENEDOR
========================================================= */

function obtenerContenedorGrafica() {

    const posiblesIds = [

        "chart-container",

        "chart-area",

        "graph-container",

        "grafica-container",

        "chart",

        "grafica"

    ];


    for (
        const id of posiblesIds
    ) {

        const elemento =
            document.getElementById(
                id
            );


        if (
            elemento
        ) {

            return elemento;

        }

    }


    const porClase =
        document.querySelector(
            ".chart-container, .chart-area, .graph-container"
        );


    if (
        porClase
    ) {

        return porClase;

    }


    return null;

}


/* =========================================================
   CONECTAR SELECTOR
========================================================= */

function conectarSelector() {

    const selectores = [

        "chart-variable",

        "variable-chart",

        "chartVariable",

        "variable"

    ];


    let selector =
        null;


    for (
        const id of selectores
    ) {

        selector =
            document.getElementById(
                id
            );


        if (
            selector
        ) {

            break;

        }

    }


    if (
        !selector
    ) {

        return;

    }


    if (
        selector.value
    ) {

        BAT_DIAG_GRAPH_STATE.variable =
            convertirNombreVariable(
                selector.value
            );

    }


    selector.addEventListener(
        "change",
        function () {

            BAT_DIAG_GRAPH_STATE.variable =
                convertirNombreVariable(
                    this.value
                );


            actualizarDesdeBATDIAG();

        }
    );

}


/* =========================================================
   CONECTAR CONTROLES
========================================================= */

function conectarControles() {

    const grid =
        buscarElemento(
            [
                "chart-grid",
                "show-grid",
                "mostrar-rejilla"
            ]
        );


    if (
        grid
    ) {

        BAT_DIAG_GRAPH_STATE.showGrid =
            grid.checked;


        grid.addEventListener(
            "change",
            function () {

                BAT_DIAG_GRAPH_STATE.showGrid =
                    this.checked;


                renderizarGrafica();

            }
        );

    }


    const autoScale =
        buscarElemento(
            [
                "chart-auto-scale",
                "auto-scale",
                "autoScale"
            ]
        );


    if (
        autoScale
    ) {

        BAT_DIAG_GRAPH_STATE.autoScale =
            autoScale.checked;


        autoScale.addEventListener(
            "change",
            function () {

                BAT_DIAG_GRAPH_STATE.autoScale =
                    this.checked;


                prepararDatos();


                renderizarGrafica();

            }
        );

    }

}


/* =========================================================
   BUSCAR ELEMENTO
========================================================= */

function buscarElemento(
    ids
) {

    for (
        const id of ids
    ) {

        const elemento =
            document.getElementById(
                id
            );


        if (
            elemento
        ) {

            return elemento;

        }

    }


    return null;

}


/* =========================================================
   CONVERTIR NOMBRE VARIABLE
========================================================= */

function convertirNombreVariable(
    valor
) {

    if (
        !valor
    ) {

        return "voltaje";

    }


    const texto =
        String(valor)
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    if (
        texto.includes(
            "corriente"
        )
    ) {

        return "corriente";

    }


    if (
        texto.includes(
            "bateria"
        )
    ) {

        return "tempBateria";

    }


    if (
        texto.includes(
            "ambiente"
        )
    ) {

        return "tempAmbiente";

    }


    if (
        texto.includes(
            "humedad"
        )
    ) {

        return "humedad";

    }


    return "voltaje";

}


/* =========================================================
   ACTUALIZAR DESDE BAT-DIAG
========================================================= */

function actualizarDesdeBATDIAG() {

    let datos =
        [];


    /*
     * Fuente principal.
     */

    if (

        window.BAT_DIAG_DATA &&

        Array.isArray(
            window.BAT_DIAG_DATA.measurements
        )

    ) {

        datos =
            window.BAT_DIAG_DATA.measurements;

    }


    /*
     * Segunda fuente.
     */

    if (

        !datos.length &&

        window.BAT_DIAG &&

        typeof
            window.BAT_DIAG.getMeasurements
            ===
            "function"

    ) {

        datos =
            window.BAT_DIAG.getMeasurements();

    }


    /*
     * Tercera fuente.
     */

    if (

        !datos.length &&

        window.BAT_DIAG_CHART_DATA &&

        Array.isArray(
            window.BAT_DIAG_CHART_DATA.measurements
        )

    ) {

        datos =
            window.BAT_DIAG_CHART_DATA.measurements;

    }


    BAT_DIAG_GRAPH_STATE.measurements =
        Array.isArray(
            datos
        )
            ? datos
            : [];


    if (
        !BAT_DIAG_GRAPH_STATE.measurements.length
    ) {

        mostrarMensaje(
            "Cargando datos de la prueba..."
        );

        return;

    }


    prepararDatos();


    renderizarGrafica();

}


/* =========================================================
   PREPARAR DATOS
========================================================= */

function prepararDatos() {

    const datos =
        BAT_DIAG_GRAPH_STATE.measurements;


    const variable =
        BAT_DIAG_GRAPH_STATE.variable;


    const puntos =
        [];


    for (
        let i = 0;
        i < datos.length;
        i++
    ) {

        const registro =
            datos[i];


        if (
            !registro
        ) {

            continue;

        }


        const valor =
            Number(
                registro[
                    variable
                ]
            );


        if (
            !Number.isFinite(
                valor
            )
        ) {

            continue;

        }


        let tiempo;


        /*
         * Date.
         */

        if (

            registro.timestamp instanceof Date &&

            !isNaN(
                registro.timestamp.getTime()
            )

        ) {

            tiempo =
                registro.timestamp.getTime();

        }


        /*
         * String o número.
         */

        else if (
            registro.timestamp
        ) {

            const fecha =
                new Date(
                    registro.timestamp
                );


            if (
                !isNaN(
                    fecha.getTime()
                )
            ) {

                tiempo =
                    fecha.getTime();

            }

        }


        /*
         * Si no existe timestamp,
         * utilizar índice.
         */

        if (
            !Number.isFinite(
                tiempo
            )
        ) {

            tiempo =
                i;

        }


        puntos.push({

            indice:
                i,

            tiempo:
                tiempo,

            valor:
                valor,

            registro:
                registro

        });

    }


    BAT_DIAG_GRAPH_STATE.points =
        puntos;


    if (
        !puntos.length
    ) {

        BAT_DIAG_GRAPH_STATE.xValues =
            [];

        BAT_DIAG_GRAPH_STATE.yValues =
            [];

        return;

    }


    BAT_DIAG_GRAPH_STATE.xValues =
        puntos.map(
            function (p) {
                return p.tiempo;
            }
        );


    BAT_DIAG_GRAPH_STATE.yValues =
        puntos.map(
            function (p) {
                return p.valor;
            }
        );


    BAT_DIAG_GRAPH_STATE.firstTime =
        puntos[0].tiempo;


    BAT_DIAG_GRAPH_STATE.lastTime =
        puntos[
            puntos.length - 1
        ].tiempo;


    calcularEscalaY();

}


/* =========================================================
   CALCULAR ESCALA Y
========================================================= */

function calcularEscalaY() {

    const valores =
        BAT_DIAG_GRAPH_STATE.yValues;


    if (
        !valores.length
    ) {

        BAT_DIAG_GRAPH_STATE.yMin =
            0;

        BAT_DIAG_GRAPH_STATE.yMax =
            1;

        return;

    }


    let minimo =
        Math.min(
            ...valores
        );


    let maximo =
        Math.max(
            ...valores
        );


    if (
        BAT_DIAG_GRAPH_STATE.autoScale
    ) {

        const rango =
            maximo -
            minimo;


        if (
            rango === 0
        ) {

            const margen =

                Math.abs(
                    maximo
                ) > 0

                    ? Math.abs(
                        maximo
                    ) * 0.10

                    : 1;


            minimo -=
                margen;

            maximo +=
                margen;

        }

        else {

            const margen =
                rango * 0.08;


            minimo -=
                margen;

            maximo +=
                margen;

        }

    }

    else {

        const rango =
            maximo -
            minimo;


        if (
            rango === 0
        ) {

            minimo -=
                1;

            maximo +=
                1;

        }

    }


    BAT_DIAG_GRAPH_STATE.yMin =
        minimo;


    BAT_DIAG_GRAPH_STATE.yMax =
        maximo;

}


/* =========================================================
   RENDERIZAR GRÁFICA
========================================================= */

function renderizarGrafica() {

    const contenedor =
        obtenerContenedorGrafica();


    if (
        !contenedor
    ) {

        console.warn(
            "BAT-DIAG: no se encontró el contenedor de la gráfica."
        );

        return;

    }


    const puntos =
        BAT_DIAG_GRAPH_STATE.points;


    if (
        !puntos.length
    ) {

        mostrarMensaje(
            "No hay datos disponibles para esta variable."
        );

        return;

    }


    /*
     * Limpiar.
     */

    contenedor.innerHTML =
        "";


    /*
     * Dimensiones.
     */

    const rect =
        contenedor.getBoundingClientRect();


    let width =
        Math.floor(
            rect.width
        );


    let height =
        Math.floor(
            rect.height
        );


    if (
        height < 250
    ) {

        height =
            330;

    }


    if (
        width < 500
    ) {

        width =
            700;

    }


    BAT_DIAG_GRAPH_STATE.width =
        width;


    BAT_DIAG_GRAPH_STATE.height =
        height;


    const margen =
        BAT_DIAG_GRAPH_CONFIG.margins;


    const chartWidth =
        width -
        margen.left -
        margen.right;


    const chartHeight =
        height -
        margen.top -
        margen.bottom;


    BAT_DIAG_GRAPH_STATE.chartWidth =
        chartWidth;


    BAT_DIAG_GRAPH_STATE.chartHeight =
        chartHeight;


    /*
     * Crear SVG.
     */

    const svg =
        crearSVG(
            "svg"
        );


    svg.setAttribute(
        "width",
        "100%"
    );


    svg.setAttribute(
        "height",
        height
    );


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );


    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    svg.classList.add(
        "bat-diag-chart-svg"
    );


    BAT_DIAG_GRAPH_STATE.svg =
        svg;


    contenedor.appendChild(
        svg
    );


    /*
     * ========================================================
     * FONDO BLANCO
     * ========================================================
     */

    const fondoGrafica =
        crearRect(
            svg,
            0,
            0,
            width,
            height,
            "bat-chart-background"
        );


    /*
     * IMPORTANTE:
     * El blanco se establece directamente en SVG.
     * De esta manera no depende del CSS.
     */

    fondoGrafica.setAttribute(
        "fill",
        "#ffffff"
    );


    fondoGrafica.setAttribute(
        "stroke",
        "none"
    );


    /*
     * Grupo principal.
     */

    const grupo =
        crearSVG(
            "g"
        );


    grupo.setAttribute(
        "transform",
        `translate(${margen.left},${margen.top})`
    );


    svg.appendChild(
        grupo
    );


    /*
     * Unidad.
     */

    crearTexto(
        grupo,
        0,
        -10,
        obtenerConfiguracionVariable().unidad,
        "bat-chart-unit"
    );


    /*
     * Rejilla.
     */

    if (
        BAT_DIAG_GRAPH_STATE.showGrid
    ) {

        dibujarRejilla(
            grupo
        );

    }


    /*
     * Ejes.
     */

    dibujarEjes(
        grupo
    );


    /*
     * Línea.
     */

    dibujarLinea(
        grupo
    );


    /*
     * Puntos.
     */

    dibujarPuntos(
        grupo
    );


    /*
     * Título X.
     */

    crearTexto(
        grupo,
        chartWidth / 2,
        chartHeight + 45,
        "Tiempo",
        "bat-chart-x-title"
    );


    actualizarLeyenda();


    crearTooltip(
        contenedor
    );

}


/* =========================================================
   CREAR SVG
========================================================= */

function crearSVG(
    tipo
) {

    return document.createElementNS(
        "http://www.w3.org/2000/svg",
        tipo
    );

}


/* =========================================================
   CREAR RECT
========================================================= */

function crearRect(
    padre,
    x,
    y,
    width,
    height,
    clase
) {

    const rect =
        crearSVG(
            "rect"
        );


    rect.setAttribute(
        "x",
        x
    );


    rect.setAttribute(
        "y",
        y
    );


    rect.setAttribute(
        "width",
        width
    );


    rect.setAttribute(
        "height",
        height
    );


    rect.setAttribute(
        "class",
        clase
    );


    padre.appendChild(
        rect
    );


    return rect;

}


/* =========================================================
   CREAR TEXTO
========================================================= */

function crearTexto(
    padre,
    x,
    y,
    texto,
    clase
) {

    const elemento =
        crearSVG(
            "text"
        );


    elemento.setAttribute(
        "x",
        x
    );


    elemento.setAttribute(
        "y",
        y
    );


    elemento.textContent =
        texto;


    elemento.setAttribute(
        "class",
        clase
    );


    padre.appendChild(
        elemento
    );


    return elemento;

}


/* =========================================================
   CONFIGURACIÓN VARIABLE
========================================================= */

function obtenerConfiguracionVariable() {

    return (

        BAT_DIAG_GRAPH_CONFIG.labels[
            BAT_DIAG_GRAPH_STATE.variable
        ]

        ||

        BAT_DIAG_GRAPH_CONFIG.labels.voltaje

    );

}


/* =========================================================
   DIBUJAR REJILLA
========================================================= */

function dibujarRejilla(
    grupo
) {

    const width =
        BAT_DIAG_GRAPH_STATE.chartWidth;


    const height =
        BAT_DIAG_GRAPH_STATE.chartHeight;


    const cantidadHorizontal =
        5;


    const cantidadVertical =
        calcularCantidadLineasVertical();


    /*
     * Líneas horizontales.
     */

    for (
        let i = 0;
        i <= cantidadHorizontal;
        i++
    ) {

        const porcentaje =
            i /
            cantidadHorizontal;


        const y =
            height *
            porcentaje;


        const linea =
            crearSVG(
                "line"
            );


        linea.setAttribute(
            "x1",
            0
        );


        linea.setAttribute(
            "x2",
            width
        );


        linea.setAttribute(
            "y1",
            y
        );


        linea.setAttribute(
            "y2",
            y
        );


        linea.setAttribute(
            "class",
            "bat-chart-grid-line"
        );


        /*
         * Estilo directo.
         */

        linea.setAttribute(
            "stroke",
            "#dfe5ec"
        );


        linea.setAttribute(
            "stroke-width",
            "1"
        );


        linea.setAttribute(
            "vector-effect",
            "non-scaling-stroke"
        );


        grupo.appendChild(
            linea
        );


        /*
         * Etiqueta Y.
         */

        const valor =

            BAT_DIAG_GRAPH_STATE.yMax -

            (

                BAT_DIAG_GRAPH_STATE.yMax -

                BAT_DIAG_GRAPH_STATE.yMin

            ) *

            porcentaje;


        const etiqueta =
            crearTexto(
                grupo,
                -10,
                y + 4,
                formatearEjeY(
                    valor
                ),
                "bat-chart-y-label"
            );


        etiqueta.setAttribute(
            "text-anchor",
            "end"
        );

    }


    /*
     * Líneas verticales.
     */

    for (
        let i = 0;
        i <= cantidadVertical;
        i++
    ) {

        const porcentaje =
            i /
            cantidadVertical;


        const x =
            width *
            porcentaje;


        const linea =
            crearSVG(
                "line"
            );


        linea.setAttribute(
            "x1",
            x
        );


        linea.setAttribute(
            "x2",
            x
        );


        linea.setAttribute(
            "y1",
            0
        );


        linea.setAttribute(
            "y2",
            height
        );


        linea.setAttribute(
            "class",
            "bat-chart-grid-line"
        );


        /*
         * Estilo directo.
         */

        linea.setAttribute(
            "stroke",
            "#e7ecf2"
        );


        linea.setAttribute(
            "stroke-width",
            "1"
        );


        linea.setAttribute(
            "vector-effect",
            "non-scaling-stroke"
        );


        grupo.appendChild(
            linea
        );


        /*
         * Etiqueta X.
         */

        const tiempo =
            obtenerTiempoX(
                porcentaje
            );


        const etiqueta =
            crearTexto(
                grupo,
                x,
                height + 22,
                formatearTiempoEje(
                    tiempo
                ),
                "bat-chart-x-label"
            );


        etiqueta.setAttribute(
            "text-anchor",
            "middle"
        );

    }

}


/* =========================================================
   CANTIDAD DE LÍNEAS VERTICALES
========================================================= */

function calcularCantidadLineasVertical() {

    const puntos =
        BAT_DIAG_GRAPH_STATE.points.length;


    if (
        puntos <= 10
    ) {

        return 5;

    }


    if (
        puntos <= 50
    ) {

        return 6;

    }


    if (
        puntos <= 200
    ) {

        return 7;

    }


    return 8;

}


/* =========================================================
   DIBUJAR EJES
========================================================= */

function dibujarEjes(
    grupo
) {

    const width =
        BAT_DIAG_GRAPH_STATE.chartWidth;


    const height =
        BAT_DIAG_GRAPH_STATE.chartHeight;


    const ejeY =
        crearSVG(
            "line"
        );


    ejeY.setAttribute(
        "x1",
        0
    );


    ejeY.setAttribute(
        "x2",
        0
    );


    ejeY.setAttribute(
        "y1",
        0
    );


    ejeY.setAttribute(
        "y2",
        height
    );


    ejeY.setAttribute(
        "class",
        "bat-chart-axis"
    );


    ejeY.setAttribute(
        "stroke",
        "#667085"
    );


    ejeY.setAttribute(
        "stroke-width",
        "1"
    );


    ejeY.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    grupo.appendChild(
        ejeY
    );


    const ejeX =
        crearSVG(
            "line"
        );


    ejeX.setAttribute(
        "x1",
        0
    );


    ejeX.setAttribute(
        "x2",
        width
    );


    ejeX.setAttribute(
        "y1",
        height
    );


    ejeX.setAttribute(
        "y2",
        height
    );


    ejeX.setAttribute(
        "class",
        "bat-chart-axis"
    );


    ejeX.setAttribute(
        "stroke",
        "#667085"
    );


    ejeX.setAttribute(
        "stroke-width",
        "1"
    );


    ejeX.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    grupo.appendChild(
        ejeX
    );

}


/* =========================================================
   DIBUJAR LÍNEA
========================================================= */

function dibujarLinea(
    grupo
) {

    const puntos =
        BAT_DIAG_GRAPH_STATE.points;


    if (
        !puntos.length
    ) {

        return;

    }


    const path =
        crearSVG(
            "path"
        );


    let d =
        "";


    for (
        let i = 0;
        i < puntos.length;
        i++
    ) {

        const punto =
            puntos[i];


        const x =
            convertirX(
                punto.tiempo
            );


        const y =
            convertirY(
                punto.valor
            );


        if (
            i === 0
        ) {

            d +=
                `M ${x} ${y}`;

        }

        else {

            d +=
                ` L ${x} ${y}`;

        }

    }


    path.setAttribute(
        "d",
        d
    );


    path.setAttribute(
        "class",
        "bat-chart-data-line"
    );


    path.setAttribute(
        "fill",
        "none"
    );


    path.setAttribute(
        "stroke",
        obtenerConfiguracionVariable().color
    );


    path.setAttribute(
        "stroke-width",
        "2.5"
    );


    path.setAttribute(
        "stroke-linecap",
        "round"
    );


    path.setAttribute(
        "stroke-linejoin",
        "round"
    );


    path.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    grupo.appendChild(
        path
    );

}


/* =========================================================
   DIBUJAR PUNTOS
========================================================= */

function dibujarPuntos(
    grupo
) {

    const puntos =
        BAT_DIAG_GRAPH_STATE.points;


    /*
     * Cuando existen demasiados registros,
     * no dibujamos miles de círculos.
     */

    let paso =
        1;


    if (
        puntos.length > 500
    ) {

        paso =
            Math.ceil(
                puntos.length /
                300
            );

    }


    for (
        let i = 0;
        i < puntos.length;
        i += paso
    ) {

        const punto =
            puntos[i];


        const circulo =
            crearSVG(
                "circle"
            );


        circulo.setAttribute(
            "cx",
            convertirX(
                punto.tiempo
            )
        );


        circulo.setAttribute(
            "cy",
            convertirY(
                punto.valor
            )
        );


        circulo.setAttribute(
            "r",
            puntos.length > 300
                ? "2"
                : "3"
        );


        circulo.setAttribute(
            "class",
            "bat-chart-point"
        );


        circulo.setAttribute(
            "fill",
            obtenerConfiguracionVariable().color
        );


        circulo.setAttribute(
            "stroke",
            "#ffffff"
        );


        circulo.setAttribute(
            "stroke-width",
            "1"
        );


        circulo.dataset.index =
            String(
                punto.indice
            );


        circulo.addEventListener(
            "mouseenter",
            function (event) {

                mostrarTooltip(
                    event,
                    punto
                );

            }
        );


        circulo.addEventListener(
            "mouseleave",
            ocultarTooltip
        );


        grupo.appendChild(
            circulo
        );

    }

}


/* =========================================================
   CONVERTIR X
========================================================= */

function convertirX(
    tiempo
) {

    const minimo =
        BAT_DIAG_GRAPH_STATE.firstTime;


    const maximo =
        BAT_DIAG_GRAPH_STATE.lastTime;


    const ancho =
        BAT_DIAG_GRAPH_STATE.chartWidth;


    if (
        maximo === minimo
    ) {

        return ancho / 2;

    }


    return (

        (
            tiempo -
            minimo
        ) /
        (
            maximo -
            minimo
        )

    ) * ancho;

}


/* =========================================================
   CONVERTIR Y
========================================================= */

function convertirY(
    valor
) {

    const minimo =
        BAT_DIAG_GRAPH_STATE.yMin;


    const maximo =
        BAT_DIAG_GRAPH_STATE.yMax;


    const alto =
        BAT_DIAG_GRAPH_STATE.chartHeight;


    if (
        maximo === minimo
    ) {

        return alto / 2;

    }


    return (

        alto -

        (

            (
                valor -
                minimo
            ) /
            (
                maximo -
                minimo
            )

        ) *

        alto

    );

}


/* =========================================================
   TIEMPO EJE X
========================================================= */

function obtenerTiempoX(
    porcentaje
) {

    const inicio =
        BAT_DIAG_GRAPH_STATE.firstTime;


    const final =
        BAT_DIAG_GRAPH_STATE.lastTime;


    return (

        inicio +

        (
            final -
            inicio
        ) *

        porcentaje

    );

}


/* =========================================================
   FORMATEAR EJE Y
========================================================= */

function formatearEjeY(
    valor
) {

    if (
        !Number.isFinite(
            valor
        )
    ) {

        return "--";

    }


    const diferencia =
        Math.abs(

            BAT_DIAG_GRAPH_STATE.yMax -

            BAT_DIAG_GRAPH_STATE.yMin

        );


    if (
        diferencia >= 100
    ) {

        return valor.toFixed(
            0
        );

    }


    if (
        diferencia >= 10
    ) {

        return valor.toFixed(
            1
        );

    }


    return valor.toFixed(
        2
    );

}


/* =========================================================
   FORMATEAR TIEMPO EJE X
========================================================= */

function formatearTiempoEje(
    timestamp
) {

    if (
        !Number.isFinite(
            timestamp
        )
    ) {

        return "--";

    }


    const inicio =
        BAT_DIAG_GRAPH_STATE.firstTime;


    let segundos =

        (
            timestamp -
            inicio
        ) /

        1000;


    if (
        segundos < 0
    ) {

        segundos =
            0;

    }


    const horas =
        Math.floor(
            segundos /
            3600
        );


    const minutos =
        Math.floor(

            (
                segundos %
                3600
            ) /

            60

        );


    const segundosRestantes =
        Math.floor(
            segundos %
            60
        );


    /*
     * Menos de una hora:
     *
     * 00:00
     * 15:30
     * 31:00
     */

    if (
        horas === 0
    ) {

        return (

            String(
                minutos
            ).padStart(
                2,
                "0"
            )

            +

            ":"

            +

            String(
                segundosRestantes
            ).padStart(
                2,
                "0"
            )

        );

    }


    /*
     * Más de una hora.
     */

    return (

        String(
            horas
        ).padStart(
            2,
            "0"
        )

        +

        ":"

        +

        String(
            minutos
        ).padStart(
            2,
            "0"
        )

    );

}


/* =========================================================
   LEYENDA
========================================================= */

function actualizarLeyenda() {

    const configuracion =
        obtenerConfiguracionVariable();


    const posiblesNombres = [

        "chart-current-variable",

        "chart-variable-name",

        "graph-variable-name"

    ];


    for (
        const id of posiblesNombres
    ) {

        const elemento =
            document.getElementById(
                id
            );


        if (
            elemento
        ) {

            elemento.textContent =
                configuracion.nombre;

        }

    }


    const unidad =
        document.getElementById(
            "chart-unit"
        );


    if (
        unidad
    ) {

        unidad.textContent =
            configuracion.unidad;

    }

}


/* =========================================================
   MOSTRAR MENSAJE
========================================================= */

function mostrarMensaje(
    mensaje
) {

    const contenedor =
        obtenerContenedorGrafica();


    if (
        !contenedor
    ) {

        return;

    }


    contenedor.innerHTML =
        "";


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "bat-chart-empty";


    wrapper.textContent =
        mensaje;


    contenedor.appendChild(
        wrapper
    );

}


/* =========================================================
   CREAR TOOLTIP
========================================================= */

function crearTooltip(
    contenedor
) {

    let tooltip =
        document.getElementById(
            "bat-diag-chart-tooltip"
        );


    if (
        tooltip
    ) {

        return tooltip;

    }


    tooltip =
        document.createElement(
            "div"
        );


    tooltip.id =
        "bat-diag-chart-tooltip";


    tooltip.className =
        "bat-diag-chart-tooltip";


    tooltip.style.display =
        "none";


    document.body.appendChild(
        tooltip
    );


    return tooltip;

}


/* =========================================================
   MOSTRAR TOOLTIP
========================================================= */

function mostrarTooltip(
    event,
    punto
) {

    const tooltip =
        document.getElementById(
            "bat-diag-chart-tooltip"
        );


    if (
        !tooltip
    ) {

        return;

    }


    const configuracion =
        obtenerConfiguracionVariable();


    const valor =
        punto.valor.toFixed(
            2
        );


    const tiempo =
        formatearTiempoEje(
            punto.tiempo
        );


    tooltip.innerHTML = `

        <strong>
            ${configuracion.nombre}
        </strong>

        <br>

        <span>
            ${valor} ${configuracion.unidad}
        </span>

        <br>

        <small>
            Tiempo: ${tiempo}
        </small>

    `;


    tooltip.style.display =
        "block";


    tooltip.style.left =
        (
            event.clientX +
            12
        ) +

        "px";


    tooltip.style.top =
        (
            event.clientY +
            12
        ) +

        "px";

}


/* =========================================================
   OCULTAR TOOLTIP
========================================================= */

function ocultarTooltip() {

    const tooltip =
        document.getElementById(
            "bat-diag-chart-tooltip"
        );


    if (
        tooltip
    ) {

        tooltip.style.display =
            "none";

    }

}


/* =========================================================
   API PÚBLICA
========================================================= */

window.BAT_DIAG_GRAPH = {


    /*
     * Actualizar datos.
     */

    update:
        function (
            measurements
        ) {

            BAT_DIAG_GRAPH_STATE.measurements =

                Array.isArray(
                    measurements
                )

                    ? measurements

                    : [];


            prepararDatos();


            if (
                BAT_DIAG_GRAPH_STATE.points.length
            ) {

                renderizarGrafica();

            }

            else {

                mostrarMensaje(
                    "No hay datos disponibles para esta variable."
                );

            }

        },


    /*
     * Cambiar variable.
     */

    setVariable:
        function (
            variable
        ) {

            BAT_DIAG_GRAPH_STATE.variable =

                convertirNombreVariable(
                    variable
                );


            actualizarDesdeBATDIAG();

        },


    /*
     * Obtener variable.
     */

    getVariable:
        function () {

            return BAT_DIAG_GRAPH_STATE.variable;

        },


    /*
     * Activar/desactivar rejilla.
     */

    setGrid:
        function (
            estado
        ) {

            BAT_DIAG_GRAPH_STATE.showGrid =

                Boolean(
                    estado
                );


            renderizarGrafica();

        },


    /*
     * Activar/desactivar autoescala.
     */

    setAutoScale:
        function (
            estado
        ) {

            BAT_DIAG_GRAPH_STATE.autoScale =

                Boolean(
                    estado
                );


            prepararDatos();


            renderizarGrafica();

        },


    /*
     * Forzar actualización.
     */

    refresh:
        function () {

            actualizarDesdeBATDIAG();

        },


    /*
     * Obtener estado.

     */

    getState:
        function () {

            return {

                ...BAT_DIAG_GRAPH_STATE

            };

        }

};


/* =========================================================
   OBSERVADOR DE CAMBIOS
========================================================= */

let ultimoCantidadDatos =
    0;


const intervaloDatos =
    setInterval(
        function () {

            let cantidadActual =
                0;


            if (

                window.BAT_DIAG_DATA &&

                Array.isArray(
                    window.BAT_DIAG_DATA.measurements
                )

            ) {

                cantidadActual =
                    window.BAT_DIAG_DATA.measurements.length;

            }


            if (

                cantidadActual !==
                ultimoCantidadDatos

            ) {

                ultimoCantidadDatos =
                    cantidadActual;


                if (
                    cantidadActual > 0
                ) {

                    actualizarDesdeBATDIAG();

                }

            }

        },
        500
    );


/* =========================================================
   FIN DE graficas.js
========================================================= */