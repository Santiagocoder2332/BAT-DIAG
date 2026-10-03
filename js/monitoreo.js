"use strict";

/* ============================================================
   BAT-DIAG - monitoreo.js

   FUENTE ÚNICA DE DATOS:
       cargar-csv.js -> sessionStorage -> csvRows

   NO usa BAT_DIAG_DATA.
   NO usa BAT_DIAG_CHART_DATA.
   NO usa script.js.
   NO usa graficas.js.

   FORMATO DE csvRows:

       0 = Fecha
       1 = Hora
       2 = Temperatura ambiente
       3 = Temperatura batería
       4 = Humedad
       5 = Voltaje
       6 = Corriente
============================================================ */


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const MONITOR_CONFIG = {

    voltaje: {

        nombre: "Voltaje",

        unidad: "V",

        color: "#176dcc",

        precision: 2

    },

    corriente: {

        nombre: "Corriente",

        unidad: "A",

        color: "#18a657",

        precision: 2

    },

    tempBateria: {

        nombre: "Temperatura batería",

        unidad: "°C",

        color: "#ed3c46",

        precision: 1

    },

    tempAmbiente: {

        nombre: "Temperatura ambiente",

        unidad: "°C",

        color: "#e99816",

        precision: 1

    },

    humedad: {

        nombre: "Humedad relativa",

        unidad: "%",

        color: "#7049c5",

        precision: 1

    }

};


/* ============================================================
   ESTADO
============================================================ */

let ultimoEstadoMonitor = "";


/* ============================================================
   INICIO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        actualizarMonitoreo();

        actualizarReloj();


        setInterval(
            actualizarMonitoreo,
            1000
        );


        setInterval(
            actualizarReloj,
            1000
        );


        window.addEventListener(
            "resize",
            function () {

                const datos =
                    prepararDatos(
                        obtenerDatos()
                    );


                if (
                    datos.length
                ) {

                    actualizarGraficas(
                        datos
                    );

                }

            }
        );

    }
);


/* ============================================================
   OBTENER DATOS DEL CSV

   ESTA ES LA ÚNICA FUENTE DE DATOS.
============================================================ */

function obtenerDatos() {

    const raw =
        sessionStorage.getItem(
            "csvRows"
        );


    if (!raw) {

        return [];

    }


    try {

        const filas =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(filas)
        ) {

            return [];

        }


        return filas;

    }

    catch (error) {

        console.error(
            "BAT-DIAG: error leyendo csvRows:",
            error
        );


        return [];

    }

}


/* ============================================================
   PREPARAR DATOS
============================================================ */

function prepararDatos(
    datos
) {

    if (
        !Array.isArray(datos)
    ) {

        return [];

    }


    const resultado = [];


    datos.forEach(
        function (
            registro,
            indice
        ) {

            if (
                !Array.isArray(registro)
            ) {

                return;

            }


            if (
                registro.length < 7
            ) {

                return;

            }


            const fecha =
                String(
                    registro[0] ?? ""
                ).trim();


            const hora =
                String(
                    registro[1] ?? ""
                ).trim();


            const timestamp =
                convertirFechaHora(
                    fecha,
                    hora
                );


            if (!timestamp) {

                return;

            }


            resultado.push({

                timestamp:
                    timestamp,

                voltaje:
                    convertirNumero(
                        registro[5]
                    ),

                corriente:
                    convertirNumero(
                        registro[6]
                    ),

                tempBateria:
                    convertirNumero(
                        registro[3]
                    ),

                tempAmbiente:
                    convertirNumero(
                        registro[2]
                    ),

                humedad:
                    convertirNumero(
                        registro[4]
                    ),

                indiceOriginal:
                    indice

            });

        }
    );


    /*
     * Orden cronológico.
     */

    resultado.sort(
        function (
            a,
            b
        ) {

            const diferencia =
                a.timestamp.getTime() -
                b.timestamp.getTime();


            if (
                diferencia !== 0
            ) {

                return diferencia;

            }


            return (
                a.indiceOriginal -
                b.indiceOriginal
            );

        }
    );


    resultado.forEach(
        function (
            registro
        ) {

            delete registro.indiceOriginal;

        }
    );


    return resultado;

}


/* ============================================================
   CONVERTIR FECHA + HORA
============================================================ */

function convertirFechaHora(
    fecha,
    hora
) {

    const fechaMatch =
        String(
            fecha
        ).match(
            /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/
        );


    const horaMatch =
        String(
            hora
        ).match(
            /^(\d{1,2}):(\d{2}):(\d{2})$/
        );


    if (
        !fechaMatch ||
        !horaMatch
    ) {

        return null;

    }


    const year =
        Number(
            fechaMatch[1]
        );


    const month =
        Number(
            fechaMatch[2]
        ) - 1;


    const day =
        Number(
            fechaMatch[3]
        );


    const hours =
        Number(
            horaMatch[1]
        );


    const minutes =
        Number(
            horaMatch[2]
        );


    const seconds =
        Number(
            horaMatch[3]
        );


    const date =
        new Date(
            year,
            month,
            day,
            hours,
            minutes,
            seconds
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* ============================================================
   CONVERTIR NÚMERO
============================================================ */

function convertirNumero(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return NaN;

    }


    const texto =
        String(
            valor
        )
        .trim()
        .replace(
            ",",
            "."
        );


    if (
        texto === ""
    ) {

        return NaN;

    }


    const numero =
        Number(
            texto
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : NaN;

}


/* ============================================================
   ACTUALIZAR MONITOREO
============================================================ */

function actualizarMonitoreo() {

    const datos =
        prepararDatos(
            obtenerDatos()
        );


    if (
        !datos.length
    ) {

        ultimoEstadoMonitor = "";

        mostrarSinDatos();

        return;

    }


    const ultimo =
        datos[
            datos.length - 1
        ];


    const firma =
        crearFirma(
            datos,
            ultimo
        );


    /*
     * Si los datos no cambiaron,
     * no reconstruimos las gráficas.
     */

    if (
        firma ===
        ultimoEstadoMonitor
    ) {

        return;

    }


    ultimoEstadoMonitor =
        firma;


    actualizarTarjetas(
        datos
    );


    actualizarGraficas(
        datos
    );


    const status =
        document.querySelector(
            ".acquisition-status strong"
        );


    const small =
        document.querySelector(
            ".acquisition-status small"
        );


    if (status) {

        status.textContent =
            "CSV cargado";

    }


    if (small) {

        small.textContent =
            `${datos.length} registros disponibles`;

    }

}


/* ============================================================
   FIRMA DE DATOS
============================================================ */

function crearFirma(
    datos,
    ultimo
) {

    return [

        datos.length,

        ultimo.timestamp
            ? ultimo.timestamp.getTime()
            : "",

        ultimo.voltaje,

        ultimo.corriente,

        ultimo.tempBateria,

        ultimo.tempAmbiente,

        ultimo.humedad

    ].join("|");

}


/* ============================================================
   ACTUALIZAR TARJETAS
============================================================ */

function actualizarTarjetas(
    datos
) {

    if (
        !datos.length
    ) {

        return;

    }


    const ultimo =
        datos[
            datos.length - 1
        ];


    const valores = {

        voltaje:
            ultimo.voltaje,

        corriente:
            ultimo.corriente,

        tempBateria:
            ultimo.tempBateria,

        tempAmbiente:
            ultimo.tempAmbiente,

        humedad:
            ultimo.humedad

    };


    const tarjetas = {

        voltaje:
            document.querySelector(
                ".voltage-card .value-info strong"
            ),

        corriente:
            document.querySelector(
                ".current-card .value-info strong"
            ),

        tempBateria:
            document.querySelector(
                ".battery-temp-card .value-info strong"
            ),

        tempAmbiente:
            document.querySelector(
                ".ambient-temp-card .value-info strong"
            ),

        humedad:
            document.querySelector(
                ".humidity-card .value-info strong"
            )

    };


    Object.keys(
        tarjetas
    ).forEach(
        function (
            variable
        ) {

            const elemento =
                tarjetas[
                    variable
                ];


            const config =
                MONITOR_CONFIG[
                    variable
                ];


            if (
                elemento &&
                config
            ) {

                elemento.textContent =
                    formatearValor(
                        valores[
                            variable
                        ],
                        config
                    );

            }

        }
    );


    /*
     * Valores de los encabezados
     * de cada gráfica.
     */

    document
        .querySelectorAll(
            ".monitor-chart[data-variable]"
        )
        .forEach(
            function (
                chart
            ) {

                const variable =
                    chart.dataset.variable;


                const config =
                    MONITOR_CONFIG[
                        variable
                    ];


                const elemento =
                    chart.querySelector(
                        ".chart-current"
                    );


                if (
                    config &&
                    elemento
                ) {

                    elemento.textContent =
                        formatearValor(
                            valores[
                                variable
                            ],
                            config
                        );

                }

            }
        );

}


/* ============================================================
   ACTUALIZAR GRÁFICAS
============================================================ */

function actualizarGraficas(
    datos
) {

    document
        .querySelectorAll(
            ".monitor-chart[data-variable]"
        )
        .forEach(
            function (
                chart
            ) {

                const variable =
                    chart.dataset.variable;


                if (
                    MONITOR_CONFIG[
                        variable
                    ]
                ) {

                    renderizarGrafica(
                        chart,
                        datos,
                        variable
                    );

                }

            }
        );

}


/* ============================================================
   RENDERIZAR GRÁFICA
============================================================ */

function renderizarGrafica(
    article,
    datos,
    variable
) {

    const config =
        MONITOR_CONFIG[
            variable
        ];


    if (!config) {

        return;

    }


    const chartArea =
        article.querySelector(
            ".chart-area"
        );


    const dynamic =
        article.querySelector(
            ".monitor-dynamic-chart"
        );


    const ejeY =
        article.querySelector(
            ".chart-y-axis"
        );


    const ejeX =
        article.querySelector(
            ".chart-x-axis"
        );


    if (
        !chartArea ||
        !dynamic ||
        !ejeY ||
        !ejeX
    ) {

        return;

    }


    const puntos = [];


    datos.forEach(
        function (
            registro
        ) {

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

                return;

            }


            puntos.push({

                tiempo:
                    registro.timestamp.getTime(),

                valor:
                    valor

            });

        }
    );


    dynamic.innerHTML = "";

    ejeY.innerHTML = "";

    ejeX.innerHTML = "";


    if (
        !puntos.length
    ) {

        dynamic.innerHTML =
            '<span class="monitor-no-data">Sin datos disponibles para esta variable.</span>';

        return;

    }


    /*
     * Para dibujar no necesitamos colocar
     * decenas de miles de puntos.
     *
     * El cursor, sin embargo, utiliza TODOS
     * los puntos originales.
     */

    const puntosGrafica =
        reducirPuntos(
            puntos,
            1000
        );


    let min =
        Math.min(
            ...puntos.map(
                function (
                    punto
                ) {

                    return punto.valor;

                }
            )
        );


    let max =
        Math.max(
            ...puntos.map(
                function (
                    punto
                ) {

                    return punto.valor;

                }
            )
        );


    let rango =
        max -
        min;


    /*
     * Evitar rango cero.
     */

    if (
        rango === 0
    ) {

        const margen =
            Math.abs(max) > 0
                ? Math.abs(max) * 0.05
                : 1;


        min -= margen;

        max += margen;

    }

    else {

        const margen =
            rango * 0.08;


        min -= margen;

        max += margen;

    }


    rango =
        max -
        min;


    const rect =
        chartArea.getBoundingClientRect();


    const width =
        Math.max(
            400,
            Math.floor(
                rect.width || 700
            )
        );


    const height =
        Math.max(
            190,
            Math.floor(
                rect.height || 260
            )
        );


    const margin = {

        top: 12,

        right: 8,

        bottom: 10,

        left: 8

    };


    const chartWidth =
        width -
        margin.left -
        margin.right;


    const chartHeight =
        height -
        margin.top -
        margin.bottom;


    /*
     * SVG.
     */

    const svg =
        crearSVG(
            "svg"
        );


    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );


    svg.setAttribute(
        "width",
        "100%"
    );


    svg.setAttribute(
        "height",
        "100%"
    );


    svg.setAttribute(
        "preserveAspectRatio",
        "none"
    );


    svg.classList.add(
        "monitor-data-svg"
    );


    const grupo =
        crearSVG(
            "g"
        );


    grupo.setAttribute(
        "transform",
        `translate(${margin.left},${margin.top})`
    );


    svg.appendChild(
        grupo
    );


    const filas = 5;

    const columnas = 6;


    /*
     * GRID HORIZONTAL.
     */

    for (
        let i = 0;
        i <= filas;
        i++
    ) {

        const y =
            chartHeight *
            (
                i /
                filas
            );


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
            chartWidth
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

    }


    /*
     * GRID VERTICAL.
     */

    for (
        let i = 0;
        i <= columnas;
        i++
    ) {

        const x =
            chartWidth *
            (
                i /
                columnas
            );


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
            chartHeight
        );


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

    }


    /*
     * CONSTRUIR LÍNEA.
     */

    let pathData = "";


    const primerTiempo =
        puntosGrafica[
            0
        ].tiempo;


    const ultimoTiempo =
        puntosGrafica[
            puntosGrafica.length - 1
        ].tiempo;


    puntosGrafica.forEach(
        function (
            punto,
            indice
        ) {

            const x =
                convertirX(
                    punto.tiempo,
                    primerTiempo,
                    ultimoTiempo,
                    chartWidth
                );


            const y =
                chartHeight -
                (
                    (
                        punto.valor -
                        min
                    ) /
                    rango
                ) *
                chartHeight;


            if (
                indice === 0
            ) {

                pathData +=
                    `M ${x} ${y}`;

            }

            else {

                pathData +=
                    ` L ${x} ${y}`;

            }

        }
    );


    const path =
        crearSVG(
            "path"
        );


    path.setAttribute(
        "d",
        pathData
    );


    path.setAttribute(
        "fill",
        "none"
    );


    path.setAttribute(
        "stroke",
        config.color
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


    /*
     * PUNTOS VISIBLES.
     */

    if (
        puntos.length <= 250
    ) {

        puntosGrafica.forEach(
            function (
                punto
            ) {

                const x =
                    convertirX(
                        punto.tiempo,
                        primerTiempo,
                        ultimoTiempo,
                        chartWidth
                    );


                const y =
                    chartHeight -
                    (
                        (
                            punto.valor -
                            min
                        ) /
                        rango
                    ) *
                    chartHeight;


                const circulo =
                    crearSVG(
                        "circle"
                    );


                circulo.setAttribute(
                    "cx",
                    x
                );


                circulo.setAttribute(
                    "cy",
                    y
                );


                circulo.setAttribute(
                    "r",
                    "2.4"
                );


                circulo.setAttribute(
                    "fill",
                    config.color
                );


                grupo.appendChild(
                    circulo
                );

            }
        );

    }


    dynamic.appendChild(
        svg
    );


    /*
     * ========================================================
       CURSOR DE PRECISIÓN
       ========================================================
     */

    configurarCursorGrafica(

        chartArea,

        svg,

        puntos,

        primerTiempo,

        ultimoTiempo,

        min,

        rango,

        chartWidth,

        chartHeight,

        margin,

        config

    );


    /*
     * EJE Y.
     */

    for (
        let i = 0;
        i <= filas;
        i++
    ) {

        const porcentaje =
            i /
            filas;


        const valor =
            max -
            (
                max -
                min
            ) *
            porcentaje;


        const span =
            document.createElement(
                "span"
            );


        span.textContent =
            formatearNumeroEje(
                valor,
                config.precision
            );


        ejeY.appendChild(
            span
        );

    }


    /*
     * EJE X.
     */

    const duracion =
        Math.max(
            0,
            ultimoTiempo -
            primerTiempo
        );


    for (
        let i = 0;
        i <= columnas;
        i++
    ) {

        const span =
            document.createElement(
                "span"
            );


        span.textContent =
            formatearTiempo(
                duracion *
                (
                    i /
                    columnas
                )
            );


        ejeX.appendChild(
            span
        );

    }

}


/* ============================================================
   CURSOR DE PRECISIÓN
============================================================ */

function configurarCursorGrafica(

    chartArea,

    svg,

    puntos,

    primerTiempo,

    ultimoTiempo,

    min,

    rango,

    chartWidth,

    chartHeight,

    margin,

    config

) {

    if (
        !chartArea ||
        !svg ||
        !puntos ||
        !puntos.length
    ) {

        return;

    }


    /*
     * Evitar cursores duplicados.
     */

    const tooltipAnterior =
        chartArea.querySelector(
            ".monitor-cursor-tooltip"
        );


    if (
        tooltipAnterior
    ) {

        tooltipAnterior.remove();

    }


    const cursorAnterior =
        svg.querySelector(
            ".monitor-cursor-layer"
        );


    if (
        cursorAnterior
    ) {

        cursorAnterior.remove();

    }


    chartArea.style.position =
        "relative";


    chartArea.style.cursor =
        "crosshair";


    /*
     * CAPA DEL CURSOR.
     */

    const layer =
        crearSVG(
            "g"
        );


    layer.classList.add(
        "monitor-cursor-layer"
    );


    layer.style.display =
        "none";


    /*
     * LÍNEA VERTICAL.
     */

    const vertical =
        crearSVG(
            "line"
        );


    vertical.setAttribute(
        "stroke",
        config.color
    );


    vertical.setAttribute(
        "stroke-width",
        "1.5"
    );


    vertical.setAttribute(
        "stroke-dasharray",
        "5 4"
    );


    vertical.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    /*
     * LÍNEA HORIZONTAL.
     */

    const horizontal =
        crearSVG(
            "line"
        );


    horizontal.setAttribute(
        "stroke",
        config.color
    );


    horizontal.setAttribute(
        "stroke-width",
        "1.5"
    );


    horizontal.setAttribute(
        "stroke-dasharray",
        "5 4"
    );


    horizontal.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    /*
     * PUNTO SELECCIONADO.
     */

    const punto =
        crearSVG(
            "circle"
        );


    punto.setAttribute(
        "r",
        "5"
    );


    punto.setAttribute(
        "fill",
        "#ffffff"
    );


    punto.setAttribute(
        "stroke",
        config.color
    );


    punto.setAttribute(
        "stroke-width",
        "3"
    );


    punto.setAttribute(
        "vector-effect",
        "non-scaling-stroke"
    );


    layer.appendChild(
        vertical
    );


    layer.appendChild(
        horizontal
    );


    layer.appendChild(
        punto
    );


    /*
     * Insertarlo al final para que quede
     * por encima de la gráfica.
     */

    const grupo =
        svg.querySelector(
            "g"
        );


    if (
        grupo
    ) {

        grupo.appendChild(
            layer
        );

    }

    else {

        svg.appendChild(
            layer
        );

    }


    /*
     * TOOLTIP.
     */

    const tooltip =
        document.createElement(
            "div"
        );


    tooltip.className =
        "monitor-cursor-tooltip";


    tooltip.style.display =
        "none";


    tooltip.innerHTML = `

        <div class="monitor-cursor-tooltip-title"></div>

        <div class="monitor-cursor-tooltip-time"></div>

        <div class="monitor-cursor-tooltip-value"></div>

    `;


    chartArea.appendChild(
        tooltip
    );


    agregarEstilosCursor();


    /*
     * CONTEXTO.
     */

    const contexto = {

        chartArea,

        svg,

        layer,

        tooltip,

        vertical,

        horizontal,

        punto,

        puntos,

        primerTiempo,

        ultimoTiempo,

        min,

        rango,

        chartWidth,

        chartHeight,

        margin,

        config

    };


    /*
     * MOVER.
     */

    chartArea.addEventListener(
        "pointermove",
        function (
            event
        ) {

            moverCursorGrafica(
                contexto,
                event
            );

        }
    );


    /*
     * ENTRAR.
     */

    chartArea.addEventListener(
        "pointerenter",
        function (
            event
        ) {

            moverCursorGrafica(
                contexto,
                event
            );

        }
    );


    /*
     * SALIR.
     */

    chartArea.addEventListener(
        "pointerleave",
        function () {

            ocultarCursorGrafica(
                contexto
            );

        }
    );

}


/* ============================================================
   MOVER CURSOR
============================================================ */

function moverCursorGrafica(
    contexto,
    event
) {

    const {

        chartArea,

        svg,

        layer,

        tooltip,

        vertical,

        horizontal,

        punto,

        puntos,

        primerTiempo,

        ultimoTiempo,

        min,

        rango,

        chartWidth,

        chartHeight,

        margin,

        config

    } = contexto;


    if (
        !puntos.length
    ) {

        return;

    }


    const rect =
        svg.getBoundingClientRect();


    if (
        !rect.width ||
        !rect.height
    ) {

        return;

    }


    /*
     * Escala horizontal real del SVG.
     */

    const escalaX =
        (
            chartWidth +
            margin.left +
            margin.right
        ) /
        rect.width;


    /*
     * Posición del mouse.
     */

    let mouseX =
        (
            event.clientX -
            rect.left
        ) *
        escalaX;


    /*
     * Quitar margen izquierdo.
     */

    let plotX =
        mouseX -
        margin.left;


    /*
     * FORZAR dentro de la gráfica.
     */

    plotX =
        Math.max(
            0,
            Math.min(
                chartWidth,
                plotX
            )
        );


    /*
     * Convertir X a tiempo.
     */

    const porcentaje =
        chartWidth > 0
            ? plotX /
              chartWidth
            : 0;


    const tiempoObjetivo =
        primerTiempo +
        (
            ultimoTiempo -
            primerTiempo
        ) *
        porcentaje;


    /*
     * Buscar el registro REAL.
     */

    const indice =
        buscarPuntoMasCercano(
            puntos,
            tiempoObjetivo
        );


    const registro =
        puntos[
            indice
        ];


    if (
        !registro
    ) {

        return;

    }


    /*
     * X exacta del registro.
     */

    const x =
        convertirX(
            registro.tiempo,
            primerTiempo,
            ultimoTiempo,
            chartWidth
        );


    /*
     * Y exacta del registro.
     */

    const y =
        chartHeight -
        (
            (
                registro.valor -
                min
            ) /
            rango
        ) *
        chartHeight;


    /*
     * LÍNEA VERTICAL.
     */

    vertical.setAttribute(
        "x1",
        x
    );


    vertical.setAttribute(
        "x2",
        x
    );


    vertical.setAttribute(
        "y1",
        0
    );


    vertical.setAttribute(
        "y2",
        chartHeight
    );


    /*
     * LÍNEA HORIZONTAL.
     */

    horizontal.setAttribute(
        "x1",
        0
    );


    horizontal.setAttribute(
        "x2",
        chartWidth
    );


    horizontal.setAttribute(
        "y1",
        y
    );


    horizontal.setAttribute(
        "y2",
        y
    );


    /*
     * PUNTO.
     */

    punto.setAttribute(
        "cx",
        x
    );


    punto.setAttribute(
        "cy",
        y
    );


    layer.style.display =
        "";


    /*
     * DATOS DEL TOOLTIP.
     */

    const titulo =
        tooltip.querySelector(
            ".monitor-cursor-tooltip-title"
        );


    const tiempo =
        tooltip.querySelector(
            ".monitor-cursor-tooltip-time"
        );


    const valor =
        tooltip.querySelector(
            ".monitor-cursor-tooltip-value"
        );


    if (
        titulo
    ) {

        titulo.textContent =
            config.nombre;

    }


    if (
        tiempo
    ) {

        tiempo.textContent =

            `${formatearFechaCursor(
                registro.timestamp
            )} · ${formatearHoraCursor(
                registro.timestamp
            )}`;

    }


    if (
        valor
    ) {

        valor.textContent =
            formatearValor(
                registro.valor,
                config
            );

    }


    posicionarTooltipCursor(
        contexto,
        x,
        y
    );

}


/* ============================================================
   BUSCAR PUNTO MÁS CERCANO

   BÚSQUEDA BINARIA.

   Esto permite trabajar correctamente incluso
   con miles de registros del CSV.
============================================================ */

function buscarPuntoMasCercano(
    puntos,
    objetivo
) {

    let izquierda =
        0;


    let derecha =
        puntos.length -
        1;


    while (
        izquierda <=
        derecha
    ) {

        const medio =
            Math.floor(
                (
                    izquierda +
                    derecha
                ) /
                2
            );


        const tiempo =
            puntos[
                medio
            ].tiempo;


        if (
            tiempo ===
            objetivo
        ) {

            return medio;

        }


        if (
            tiempo <
            objetivo
        ) {

            izquierda =
                medio +
                1;

        }

        else {

            derecha =
                medio -
                1;

        }

    }


    if (
        izquierda <=
        0
    ) {

        return 0;

    }


    if (
        izquierda >=
        puntos.length
    ) {

        return (
            puntos.length -
            1
        );

    }


    const anterior =
        izquierda -
        1;


    const siguiente =
        izquierda;


    const distanciaAnterior =
        Math.abs(
            puntos[
                anterior
            ].tiempo -
            objetivo
        );


    const distanciaSiguiente =
        Math.abs(
            puntos[
                siguiente
            ].tiempo -
            objetivo
        );


    return
        distanciaAnterior <=
        distanciaSiguiente

        ? anterior

        : siguiente;

}


/* ============================================================
   POSICIONAR TOOLTIP
============================================================ */

function posicionarTooltipCursor(
    contexto,
    x,
    y
) {

    const {

        chartArea,

        svg,

        tooltip,

        chartWidth,

        chartHeight,

        margin

    } = contexto;


    const svgRect =
        svg.getBoundingClientRect();


    const areaRect =
        chartArea.getBoundingClientRect();


    const escalaX =
        svgRect.width /
        (
            chartWidth +
            margin.left +
            margin.right
        );


    const escalaY =
        svgRect.height /
        (
            chartHeight +
            margin.top +
            margin.bottom
        );


    const puntoX =
        (
            svgRect.left -
            areaRect.left
        ) +
        (
            margin.left +
            x
        ) *
        escalaX;


    const puntoY =
        (
            svgRect.top -
            areaRect.top
        ) +
        (
            margin.top +
            y
        ) *
        escalaY;


    tooltip.style.display =
        "block";


    const ancho =
        tooltip.offsetWidth ||
        180;


    const alto =
        tooltip.offsetHeight ||
        65;


    /*
     * Primero intentamos arriba-derecha.
     */

    let left =
        puntoX +
        14;


    let top =
        puntoY -
        alto -
        14;


    /*
     * Si no cabe a la derecha,
     * lo colocamos a la izquierda.
     */

    if (
        left +
        ancho >
        chartArea.clientWidth -
        5
    ) {

        left =
            puntoX -
            ancho -
            14;

    }


    /*
     * Si no cabe arriba,
     * lo colocamos debajo.
     */

    if (
        top <
        5
    ) {

        top =
            puntoY +
            14;

    }


    /*
     * Mantener tooltip dentro.
     */

    left =
        Math.max(
            5,
            Math.min(
                left,
                chartArea.clientWidth -
                ancho -
                5
            )
        );


    top =
        Math.max(
            5,
            Math.min(
                top,
                chartArea.clientHeight -
                alto -
                5
            )
        );


    tooltip.style.left =
        `${left}px`;


    tooltip.style.top =
        `${top}px`;

}


/* ============================================================
   OCULTAR CURSOR
============================================================ */

function ocultarCursorGrafica(
    contexto
) {

    if (
        contexto.layer
    ) {

        contexto.layer.style.display =
            "none";

    }


    if (
        contexto.tooltip
    ) {

        contexto.tooltip.style.display =
            "none";

    }

}


/* ============================================================
   ESTILOS DEL CURSOR
============================================================ */

function agregarEstilosCursor() {

    if (
        document.getElementById(
            "bat-diag-monitor-cursor-style"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "bat-diag-monitor-cursor-style";


    style.textContent = `

        .monitor-chart .chart-area {

            position: relative;

            cursor: crosshair !important;

        }


        .monitor-cursor-layer {

            pointer-events: none;

        }


        .monitor-data-svg {

            overflow: visible;

        }


        .monitor-cursor-tooltip {

            position: absolute;

            z-index: 10000;

            min-width: 155px;

            max-width: 230px;

            padding: 9px 11px;

            border-radius: 8px;

            background:
                rgba(
                    10,
                    29,
                    55,
                    0.96
                );

            color: #ffffff;

            box-shadow:
                0 5px 18px
                rgba(
                    0,
                    0,
                    0,
                    0.24
                );

            pointer-events: none;

            font-family: inherit;

            line-height: 1.25;

            white-space: nowrap;

        }


        .monitor-cursor-tooltip-title {

            font-size: 12px;

            font-weight: 700;

            margin-bottom: 3px;

        }


        .monitor-cursor-tooltip-time {

            font-size: 11px;

            opacity: 0.82;

            margin-bottom: 4px;

        }


        .monitor-cursor-tooltip-value {

            font-size: 15px;

            font-weight: 700;

        }

    `;


    document.head.appendChild(
        style
    );

}


/* ============================================================
   FECHA DEL TOOLTIP
============================================================ */

function formatearFechaCursor(
    fecha
) {

    if (
        !fecha ||
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "--/--/----";

    }


    return [

        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        ),

        String(
            fecha.getMonth() +
            1
        ).padStart(
            2,
            "0"
        ),

        fecha.getFullYear()

    ].join("/");

}


/* ============================================================
   HORA DEL TOOLTIP
============================================================ */

function formatearHoraCursor(
    fecha
) {

    if (
        !fecha ||
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "--:--:--";

    }


    return [

        String(
            fecha.getHours()
        ).padStart(
            2,
            "0"
        ),

        String(
            fecha.getMinutes()
        ).padStart(
            2,
            "0"
        ),

        String(
            fecha.getSeconds()
        ).padStart(
            2,
            "0"
        )

    ].join(":");

}


/* ============================================================
   REDUCIR PUNTOS PARA DIBUJO
============================================================ */

function reducirPuntos(
    puntos,
    maximo
) {

    if (
        puntos.length <=
        maximo
    ) {

        return puntos;

    }


    const paso =
        (
            puntos.length -
            1
        ) /
        (
            maximo -
            1
        );


    const resultado = [];


    for (
        let i = 0;
        i < maximo;
        i++
    ) {

        resultado.push(
            puntos[
                Math.round(
                    i *
                    paso
                )
            ]
        );

    }


    return resultado;

}


/* ============================================================
   CONVERTIR X
============================================================ */

function convertirX(
    tiempo,
    minimo,
    maximo,
    ancho
) {

    if (
        maximo ===
        minimo
    ) {

        return ancho /
            2;

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

    ) *
    ancho;

}


/* ============================================================
   FORMATEAR VALOR
============================================================ */

function formatearValor(
    valor,
    config
) {

    const numero =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            numero
        )
    ) {

        return (
            "-- " +
            config.unidad
        );

    }


    return (

        numero.toFixed(
            config.precision
        ) +

        " " +

        config.unidad

    );

}


/* ============================================================
   FORMATEAR EJE Y
============================================================ */

function formatearNumeroEje(
    valor,
    precision
) {

    if (
        !Number.isFinite(
            valor
        )
    ) {

        return "--";

    }


    return Number(
        valor
    ).toFixed(
        precision
    );

}


/* ============================================================
   FORMATEAR TIEMPO
============================================================ */

function formatearTiempo(
    milisegundos
) {

    const segundos =
        Math.max(
            0,
            Math.round(
                milisegundos /
                1000
            )
        );


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


    const seg =
        segundos %
        60;


    if (
        horas === 0 &&
        minutos === 0
    ) {

        return (
            seg +
            " s"
        );

    }


    if (
        horas === 0
    ) {

        if (
            seg === 0
        ) {

            return (
                minutos +
                " min"
            );

        }


        return (

            minutos +
            "m " +
            seg +
            "s"

        );

    }


    return (

        String(
            horas
        ).padStart(
            2,
            "0"
        ) +

        ":" +

        String(
            minutos
        ).padStart(
            2,
            "0"
        ) +

        ":" +

        String(
            seg
        ).padStart(
            2,
            "0"
        )

    );

}


/* ============================================================
   CREAR ELEMENTO SVG
============================================================ */

function crearSVG(
    tipo
) {

    return document.createElementNS(

        "http://www.w3.org/2000/svg",

        tipo

    );

}


/* ============================================================
   MOSTRAR SIN DATOS
============================================================ */

function mostrarSinDatos() {

    document
        .querySelectorAll(
            ".monitor-chart[data-variable]"
        )
        .forEach(
            function (
                article
            ) {

                const chartArea =
                    article.querySelector(
                        ".chart-area"
                    );


                const dynamic =
                    article.querySelector(
                        ".monitor-dynamic-chart"
                    );


                const ejeY =
                    article.querySelector(
                        ".chart-y-axis"
                    );


                const ejeX =
                    article.querySelector(
                        ".chart-x-axis"
                    );


                if (
                    dynamic
                ) {

                    dynamic.innerHTML =
                        '<span class="monitor-no-data">Carga un CSV desde cargar-csv.js para visualizar los datos.</span>';

                }


                if (
                    ejeY
                ) {

                    ejeY.innerHTML =
                        "";

                }


                if (
                    ejeX
                ) {

                    ejeX.innerHTML =
                        "";

                }


                if (
                    chartArea
                ) {

                    chartArea.style.background =
                        "#ffffff";

                }

            }
        );


    /*
     * Mantener los IDs existentes.
     */

    [

        "voltage-value",

        "current-value",

        "battery-temperature-value",

        "ambient-temperature-value",

        "humidity-value"

    ].forEach(
        function (
            id
        ) {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    "--";

            }

        }
    );


    document
        .querySelectorAll(
            ".chart-current"
        )
        .forEach(
            function (
                elemento
            ) {

                elemento.textContent =
                    "--";

            }
        );


    const status =
        document.querySelector(
            ".acquisition-status strong"
        );


    const small =
        document.querySelector(
            ".acquisition-status small"
        );


    if (
        status
    ) {

        status.textContent =
            "Sin CSV";

    }


    if (
        small
    ) {

        small.textContent =
            "No hay registros cargados";

    }

}


/* ============================================================
   RELOJ DEL HEADER
============================================================ */

function actualizarReloj() {

    const ahora =
        new Date();


    const hora =
        ahora.toLocaleTimeString(
            "es-CO",
            {

                hour: "2-digit",

                minute: "2-digit",

                second: "2-digit"

            }
        );


    const fecha =
        ahora.toLocaleDateString(
            "es-CO",
            {

                day: "2-digit",

                month: "2-digit",

                year: "numeric"

            }
        );


    const strong =
        document.querySelector(
            ".common-header-clock strong"
        );


    const span =
        document.querySelector(
            ".common-header-clock span"
        );


    if (
        strong
    ) {

        strong.textContent =
            hora;

    }


    if (
        span
    ) {

        span.textContent =
            fecha;

    }

}


/* ============================================================
   FIN DE monitoreo.js
============================================================ */