/* =========================================================
   BAT-DIAG - registros-pdf.js
   ---------------------------------------------------------
   Exporta las pruebas de localStorage["batDiagRecords"]
   a un reporte imprimible / PDF.

   IMPORTANTE:
   Este archivo debe cargarse DESPUÉS de registros.js.
   ========================================================= */

"use strict";

(() => {

    const KEY = "batDiagRecords";


    /* =====================================================
       INICIO
       ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    function init() {

        replaceGeneralExport();

        document.addEventListener(
            "click",
            interceptRowExport,
            true
        );

    }


    /* =====================================================
       LEER REGISTROS
       ===================================================== */

    function getRecords() {

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(KEY) || "[]"
                );

            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.error(
                "BAT-DIAG: no se pudieron leer los registros",
                error
            );

            return [];

        }

    }


    /* =====================================================
       BOTÓN EXPORTAR TODO
       ===================================================== */

    function replaceGeneralExport() {

        const oldButton =
            document.querySelector(
                ".export-all-btn"
            );


        if (!oldButton) {
            return;
        }


        /*
         * registros.js ya le puso un evento al botón.
         * Al clonar el botón eliminamos ese evento.
         */
        const button =
            oldButton.cloneNode(true);


        oldButton.replaceWith(button);


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                exportAll();

            }
        );

    }


    /* =====================================================
       EXPORTAR UNA FILA
       ===================================================== */

    function interceptRowExport(event) {

        const button =
            event.target.closest(
                ".action-btn.export"
            );


        if (!button) {
            return;
        }


        const row =
            button.closest("tr");


        if (!row) {
            return;
        }


        const record =
            recordFromRow(row);


        if (!record) {
            return;
        }


        /*
         * Detenemos el exportador original.
         */
        event.preventDefault();

        event.stopPropagation();


        if (
            event.stopImmediatePropagation
        ) {

            event.stopImmediatePropagation();

        }


        exportRecord(record);

    }


    /* =====================================================
       BUSCAR REGISTRO POR ARCHIVO
       ===================================================== */

    function recordFromRow(row) {

        const records =
            getRecords();


        const fileElement =
            row.querySelector(
                ".file-name"
            );


        if (!fileElement) {
            return null;
        }


        const fileName =
            fileElement.textContent.trim();


        return records.find(
            function (record) {

                return (
                    record.fileName ===
                    fileName
                );

            }
        ) || null;

    }


    /* =====================================================
       EXPORTAR TODO
       ===================================================== */

    function exportAll() {

        const records =
            getRecords();


        if (!records.length) {

            alert(
                "No hay pruebas registradas para exportar."
            );

            return;

        }


        const html =
            buildReport(
                records,
                false
            );


        openPrintWindow(
            html,
            "BAT-DIAG - Reporte completo"
        );

    }


    /* =====================================================
       EXPORTAR UNA PRUEBA
       ===================================================== */

    function exportRecord(
        record
    ) {

        if (!record) {

            alert(
                "No se encontró la prueba seleccionada."
            );

            return;

        }


        const html =
            buildReport(
                [record],
                true
            );


        openPrintWindow(
            html,
            "BAT-DIAG - " +
            (
                record.fileName ||
                "Prueba"
            )
        );

    }


    /* =====================================================
       ABRIR REPORTE
       ===================================================== */

    function openPrintWindow(
        html,
        title
    ) {

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1400,height=950"
            );


        if (!printWindow) {

            alert(
                "El navegador bloqueó la ventana. " +
                "Permite ventanas emergentes para BAT-DIAG."
            );

            return;

        }


        printWindow.document.open();


        printWindow.document.write(

            `<!doctype html>

<html lang="es">

<head>

<meta charset="utf-8">

<title>
    ${esc(title)}
</title>


<style>

/* =====================================================
   PÁGINA
   ===================================================== */

@page {

    size: A4 landscape;

    margin: 9mm;

}


/* =====================================================
   BASE
   ===================================================== */

* {

    box-sizing: border-box;

}


body {

    margin: 0;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    color: #17345d;

    font-size: 8px;

    background: white;

}


.report {

    width: 100%;

}


/* =====================================================
   CABECERA
   ===================================================== */

.header {

    display: flex;

    justify-content:
        space-between;

    gap: 20px;

    border-bottom:
        3px solid #102a52;

    padding-bottom:
        9px;

    margin-bottom:
        10px;

}


.logo {

    font-size:
        22px;

    font-weight:
        800;

}


.logo b {

    color:
        #11b9c7;

}


h1 {

    font-size:
        16px;

    margin:
        4px 0;

}


.muted {

    color:
        #718096;

}


/* =====================================================
   TÍTULOS
   ===================================================== */

h2 {

    font-size:
        11px;

    border-bottom:
        1px solid #dce4ec;

    padding-bottom:
        4px;

    margin:
        10px 0 5px;

}


/* =====================================================
   TARJETAS
   ===================================================== */

.grid6 {

    display:
        grid;

    grid-template-columns:
        repeat(6, 1fr);

    gap:
        5px;

}


.grid5 {

    display:
        grid;

    grid-template-columns:
        repeat(5, 1fr);

    gap:
        5px;

}


.grid3 {

    display:
        grid;

    grid-template-columns:
        repeat(3, 1fr);

    gap:
        5px;

}


.card {

    border:
        1px solid #dce4ec;

    border-radius:
        5px;

    padding:
        6px;

    background:
        #f8fafc;

}


.card small {

    display:
        block;

    color:
        #718096;

    font-size:
        6.5px;

    margin-bottom:
        2px;

}


.card strong {

    font-size:
        9px;

    word-break:
        break-word;

}


/* =====================================================
   SEÑALES
   ===================================================== */

.signal {

    border:
        1px solid #dce4ec;

    border-radius:
        5px;

    overflow:
        hidden;

}


.signal .head {

    background:
        #102a52;

    color:
        white;

    padding:
        6px;

}


.signal .head strong {

    font-size:
        9px;

}


.signal .head small {

    display:
        block;

    margin-top:
        2px;

    font-size:
        6.5px;

}


.stats {

    display:
        grid;

    grid-template-columns:
        1fr 1fr;

}


.stat {

    padding:
        4px;

    border-top:
        1px solid #edf1f5;

}


.stat span {

    display:
        block;

    color:
        #718096;

    font-size:
        6.5px;

}


.stat strong {

    font-size:
        7.5px;

}


/* =====================================================
   INDICADORES
   ===================================================== */

.ind {

    display:
        grid;

    grid-template-columns:
        28px 1fr auto;

    gap:
        6px;

    align-items:
        center;

    border:
        1px solid #dce4ec;

    border-radius:
        5px;

    padding:
        6px;

}


.icon {

    width:
        28px;

    height:
        28px;

    border-radius:
        5px;

    background:
        #edf5fb;

    display:
        flex;

    align-items:
        center;

    justify-content:
        center;

    font-weight:
        bold;

}


.good {

    color:
        #159d42;

}


.moderate {

    color:
        #d78b00;

}


.bad {

    color:
        #d94b38;

}


/* =====================================================
   CONCLUSIÓN
   ===================================================== */

.conclusion {

    padding:
        8px;

    border:
        1px solid #dce4ec;

    border-left:
        4px solid #11b9c7;

    border-radius:
        5px;

    background:
        #f4fafb;

}


.conclusion strong {

    font-size:
        9px;

}


.conclusion p {

    margin:
        3px 0 0;

    color:
        #596b82;

    font-size:
        7px;

    line-height:
        1.45;

}


/* =====================================================
   GRÁFICAS
   ===================================================== */

.chartgrid {

    display:
        grid;

    grid-template-columns:
        1fr 1fr;

    gap:
        7px;

}


.chart {

    border:
        1px solid #dce4ec;

    border-radius:
        5px;

    padding:
        5px;

}


.chart h3 {

    font-size:
        8px;

    margin:
        0 0 3px;

}


svg {

    width:
        100%;

    height:
        135px;

    display:
        block;

}


/* =====================================================
   TABLA
   ===================================================== */

table {

    width:
        100%;

    border-collapse:
        collapse;

}


th {

    background:
        #102a52;

    color:
        white;

    text-align:
        left;

    padding:
        4px;

    font-size:
        6.5px;

}


td {

    padding:
        3px 4px;

    border-bottom:
        1px solid #e2e8ef;

    font-size:
        6.5px;

}


tr:nth-child(even) {

    background:
        #f7f9fb;

}


/* =====================================================
   METODOLOGÍA
   ===================================================== */

.method {

    padding:
        7px;

    background:
        #f7f9fb;

    border:
        1px solid #dce4ec;

    border-radius:
        5px;

    color:
        #667386;

    line-height:
        1.5;

}


/* =====================================================
   FOOTER
   ===================================================== */

.footer {

    border-top:
        1px solid #dce4ec;

    margin-top:
        9px;

    padding-top:
        5px;

    display:
        flex;

    justify-content:
        space-between;

    color:
        #7a8798;

    font-size:
        6.5px;

}


/* =====================================================
   SALTO DE PÁGINA
   ===================================================== */

.page {

    page-break-before:
        always;

}


/* =====================================================
   PANTALLA
   ===================================================== */

@media screen {

    body {

        background:
            #eef3f7;

        padding:
            20px;

    }


    .report {

        max-width:
            1400px;

        margin:
            auto;

        background:
            white;

        padding:
            24px;

        box-shadow:
            0 5px 25px #0002;

    }

}

</style>

</head>


<body>

${html}

</body>

</html>`

        );


        printWindow.document.close();


        setTimeout(
            function () {

                printWindow.focus();

                printWindow.print();

            },
            700
        );

    }


    /* =====================================================
       CONSTRUIR REPORTE
       ===================================================== */

    function buildReport(
        records,
        single
    ) {

        const generated =
            new Date()
                .toLocaleString(
                    "es-CO"
                );


        let output = `

<div class="report">


<div class="header">

    <div>

        <div class="logo">
            BAT-<b>DIAG</b>
        </div>

        <h1>
            Reporte técnico
            ${single ? "de prueba" : "completo"}
        </h1>

        <div class="muted">
            Diagnóstico de baterías basado
            en los registros CSV almacenados.
        </div>

    </div>


    <div class="muted">

        <b>
            Generado:
        </b>

        <br>

        ${esc(generated)}

    </div>

</div>
`;


        /* =================================================
           RESUMEN GENERAL
           ================================================= */

        if (!single) {

            output += `

<h2>
    Resumen del historial
</h2>


<div class="grid6">

    ${card(
        "Pruebas",
        records.length
    )}

    ${card(
        "Procesables",
        records.filter(
            r => analyze(r)
        ).length
    )}

    ${card(
        "Variables",
        5
    )}

    ${card(
        "Características",
        30
    )}

    ${card(
        "Almacenamiento",
        "localStorage"
    )}

    ${card(
        "Generado",
        generated
    )}

</div>


<h2>
    Historial
</h2>


<table>

<thead>

<tr>

<th>
    Fecha
</th>

<th>
    Archivo
</th>

<th>
    Batería
</th>

<th>
    Tipo
</th>

<th>
    Registros
</th>

<th>
    Duración
</th>

<th>
    Energía
</th>

<th>
    Estado
</th>

</tr>

</thead>


<tbody>
`;


            records.forEach(
                function (record) {

                    const analysis =
                        analyze(record);


                    const evaluation =
                        analysis
                            ? overall(
                                analysis
                            )
                            : {
                                label:
                                    "Sin datos",
                                cls:
                                    "moderate"
                            };


                    output += `

<tr>

<td>
    ${esc(
        record.endDate ||
        "—"
    )}
</td>

<td>
    ${esc(
        record.fileName ||
        "—"
    )}
</td>

<td>
    ${esc(
        record.battery ||
        "—"
    )}
</td>

<td>
    ${esc(
        record.testType ||
        "Descarga controlada"
    )}
</td>

<td>
    ${
        analysis
            ? analysis.n
            : "—"
    }
</td>

<td>
    ${
        analysis
            ? duration(
                analysis.minutes
            )
            : "—"
    }
</td>

<td>
    ${
        analysis
            ? num(
                analysis.energy,
                2
            ) + " Wh"
            : "—"
    }
</td>

<td class="${evaluation.cls}">
    ● ${evaluation.label}
</td>

</tr>
`;

                }
            );


            output += `

</tbody>

</table>
`;

        }


        /* =================================================
           DETALLE DE CADA PRUEBA
           ================================================= */

        records.forEach(
            function (
                record,
                index
            ) {

                const analysis =
                    analyze(record);


                if (!analysis) {

                    output += `

<section class="page">

<h2>
    Prueba ${index + 1}
</h2>


<div class="method">

    No fue posible procesar
    los datos de esta prueba.

</div>

</section>

`;

                    return;

                }


                output += buildRecord(
                    record,
                    analysis,
                    index + 1,
                    records.length
                );

            }
        );


        output += `

<div class="footer">

    <span>
        BAT-DIAG · Sistema de diagnóstico
    </span>

    <span>
        ${records.length}
        prueba(s)
    </span>

</div>


</div>
`;


        return output;

    }


    /* =====================================================
       DETALLE DE PRUEBA
       ===================================================== */

    function buildRecord(
        record,
        analysis,
        index,
        total
    ) {

        const evaluation =
            overall(
                analysis
            );


        const signals = [

            [
                "Voltaje",
                "V",
                analysis.voltage,
                "Rango",
                analysis.voltage.range
            ],

            [
                "Corriente",
                "A",
                analysis.current,
                "RMS",
                analysis.current.rms
            ],

            [
                "Temperatura batería",
                "°C",
                analysis.battTemp,
                "dT/dt",
                analysis.heating
            ],

            [
                "Temperatura ambiente",
                "°C",
                analysis.ambient,
                "Rango",
                analysis.ambient.range
            ],

            [
                "Humedad",
                "%",
                analysis.humidity,
                "Rango",
                analysis.humidity.range
            ]

        ];


        return `

<section class="page">


<div class="header">

<div>

    <div class="logo">
        BAT-<b>DIAG</b>
    </div>

    <h1>
        Diagnóstico de prueba
    </h1>

    <div class="muted">
        ${esc(
            record.fileName ||
            "Prueba"
        )}
    </div>

</div>


<div class="muted">

    Prueba ${index}
    de ${total}

    <br>

    ${esc(
        new Date()
            .toLocaleString(
                "es-CO"
            )
    )}

</div>

</div>


<h2>
    Identificación
</h2>


<div class="grid6">

    ${card(
        "Archivo",
        record.fileName ||
        "—"
    )}

    ${card(
        "Batería",
        record.battery ||
        "—"
    )}

    ${card(
        "Tipo",
        record.testType ||
        "Descarga controlada"
    )}

    ${card(
        "Registros",
        analysis.n
    )}

    ${card(
        "Inicio",
        dateTime(
            analysis.first
        )
    )}

    ${card(
        "Fin",
        dateTime(
            analysis.last
        )
    )}

    ${card(
        "Duración",
        duration(
            analysis.minutes
        )
    )}

    ${card(
        "Energía",
        num(
            analysis.energy,
            2
        ) + " Wh"
    )}

    ${card(
        "Columnas",
        record.columnCount ||
        7
    )}

    ${card(
        "Variables",
        5
    )}

    ${card(
        "Características",
        30
    )}

    ${card(
        "Correcciones",
        record.correctedRows ||
        0
    )}

</div>


<h2>
    Características estadísticas
</h2>


<div class="grid5">

    ${signals
        .map(
            function (signalData) {

                return signalCard(
                    signalData[0],
                    signalData[1],
                    signalData[2],
                    signalData[3],
                    signalData[4]
                );

            }
        )
        .join("")}

</div>


<h2>
    Indicadores de diagnóstico
</h2>


<div class="grid3">

    ${indicator(
        "ΔV",
        "Caída de voltaje",
        num(
            analysis.drop,
            2
        ) + " V",
        evalDrop(
            analysis.drop
        )
    )}

    ${indicator(
        "Ω",
        "Resistencia dinámica",
        resistance(
            analysis.resistance
        ),
        evalResistance(
            analysis.resistance
        )
    )}

    ${indicator(
        "t",
        "Tiempo de descarga",
        duration(
            analysis.minutes
        ),
        evalDuration(
            analysis.minutes
        )
    )}

    ${indicator(
        "E",
        "Energía entregada",
        num(
            analysis.energy,
            2
        ) + " Wh",
        evalEnergy(
            analysis.energy
        )
    )}

    ${indicator(
        "ΔT",
        "Incremento térmico",
        num(
            analysis.thermal,
            2
        ) + " °C",
        evalThermal(
            analysis.thermal
        )
    )}

    ${indicator(
        "dT",
        "Tasa de calentamiento",
        num(
            analysis.heating,
            3
        ) + " °C/min",
        evalHeating(
            analysis.heating
        )
    )}

</div>


<h2>
    Evaluación global
</h2>


<div class="conclusion">

    <strong>
        ${evaluation.label}
    </strong>

    <p>
        ${esc(
            evaluation.message
        )}
    </p>

</div>


<h2>
    Gráficas de comportamiento
</h2>


<div class="chartgrid">

    ${chart(
        "Voltaje",
        "voltage",
        "V",
        analysis.records
    )}

    ${chart(
        "Corriente",
        "current",
        "A",
        analysis.records
    )}

    ${chart(
        "Temperatura batería",
        "battTemp",
        "°C",
        analysis.records
    )}

    ${chart(
        "Temperatura ambiente",
        "ambient",
        "°C",
        analysis.records
    )}

</div>


<div
    class="chart"
    style="margin-top:7px"
>

    ${chart(
        "Humedad",
        "humidity",
        "%",
        analysis.records
    )}

</div>


<h2>
    Metodología
</h2>


<div class="method">

<b>
    Estadística:
</b>

media, mediana, máximo,
mínimo, desviación estándar
y rango/RMS.

<br>


<b>
    Energía:
</b>

integración trapezoidal
de V × |I| respecto al tiempo.

<br>


<b>
    Resistencia dinámica:
</b>

valor absoluto de la pendiente
de V respecto de I mediante
regresión lineal.

<br>


<b>
    Tasa térmica:
</b>

pendiente de temperatura
de batería respecto al tiempo
en minutos.

<br>


<b>
    Caída de voltaje:
</b>

máximo de voltaje
menos mínimo de voltaje.

<br>


<b>
    Incremento térmico:
</b>

máximo de temperatura
de batería menos mínimo.

<br>


<b>
    Nota:
</b>

la resistencia es un indicador
dinámico, no una medición
óhmica directa.

La energía no se compara
contra una capacidad nominal
si ésta no está disponible
en el CSV.

</div>


</section>

`;

    }


    /* =====================================================
       ANÁLISIS
       ===================================================== */

    function analyze(record) {

        if (
            !record ||
            !Array.isArray(
                record.rows
            ) ||
            record.rows.length < 1
        ) {

            return null;

        }


        const records =
            record.rows
                .map(
                    normalize
                )
                .filter(
                    Boolean
                )
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return a.t - b.t;

                    }
                );


        if (!records.length) {

            return null;

        }


        const voltage =
            stats(
                records.map(
                    x =>
                        x.voltage
                )
            );


        const current =
            stats(
                records.map(
                    x =>
                        x.current
                )
            );


        const battTemp =
            stats(
                records.map(
                    x =>
                        x.battTemp
                )
            );


        const ambient =
            stats(
                records.map(
                    x =>
                        x.ambient
                )
            );


        const humidity =
            stats(
                records.map(
                    x =>
                        x.humidity
                )
            );


        const first =
            records[0].t;


        const last =
            records[
                records.length - 1
            ].t;


        const minutes =
            Math.max(
                0,
                (
                    last -
                    first
                ) / 60000
            );


        /* =============================================
           ENERGÍA
           ============================================= */

        let energy = 0;


        for (
            let i = 1;
            i < records.length;
            i++
        ) {

            const previous =
                records[
                    i - 1
                ];


            const currentRecord =
                records[i];


            const deltaHours =
                (
                    currentRecord.t -
                    previous.t
                ) / 3600000;


            const powerPrevious =
                Math.abs(
                    previous.voltage *
                    previous.current
                );


            const powerCurrent =
                Math.abs(
                    currentRecord.voltage *
                    currentRecord.current
                );


            energy +=
                (
                    (
                        powerPrevious +
                        powerCurrent
                    ) / 2
                ) *
                deltaHours;

        }


        /* =============================================
           TASA TÉRMICA
           ============================================= */

        const timeMinutes =
            records.map(
                function (item) {

                    return (
                        item.t -
                        first
                    ) / 60000;

                }
            );


        const heating =
            slope(
                timeMinutes,
                records.map(
                    x =>
                        x.battTemp
                )
            );


        /* =============================================
           RESISTENCIA DINÁMICA
           ============================================= */

        const resistance =
            Math.abs(
                slope(
                    records.map(
                        x =>
                            x.current
                    ),
                    records.map(
                        x =>
                            x.voltage
                    )
                )
            );


        return {

            records,

            n:
                records.length,

            first,

            last,

            minutes,

            energy:
                Math.max(
                    0,
                    energy
                ),

            voltage,

            current,

            battTemp,

            ambient,

            humidity,

            drop:
                voltage.range,

            thermal:
                battTemp.range,

            heating,

            resistance

        };

    }


    /* =====================================================
       NORMALIZAR FILA CSV
       ===================================================== */

    function normalize(
        row
    ) {

        if (
            !Array.isArray(row) ||
            row.length < 7
        ) {

            return null;

        }


        const time =
            parseDate(
                row[0],
                row[1]
            );


        const values =
            row
                .slice(
                    2,
                    7
                )
                .map(
                    number
                );


        if (
            !time ||
            values.some(
                function (value) {

                    return !Number.isFinite(
                        value
                    );

                }
            )
        ) {

            return null;

        }


        return {

            t:
                time,

            ambient:
                values[0],

            battTemp:
                values[1],

            humidity:
                values[2],

            voltage:
                values[3],

            current:
                values[4]

        };

    }


    /* =====================================================
       FECHA
       ===================================================== */

    function parseDate(
        dateValue,
        timeValue
    ) {

        let match =
            String(
                dateValue ??
                ""
            )
                .trim()
                .match(
                    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
                );


        if (match) {

            const timeMatch =
                String(
                    timeValue ??
                    ""
                )
                    .match(
                        /^(\d{1,2}):(\d{2})(?::(\d{2}))?/
                    );


            return new Date(

                Number(
                    match[1]
                ),

                Number(
                    match[2]
                ) - 1,

                Number(
                    match[3]
                ),

                timeMatch
                    ? Number(
                        timeMatch[1]
                    )
                    : 0,

                timeMatch
                    ? Number(
                        timeMatch[2]
                    )
                    : 0,

                timeMatch &&
                timeMatch[3]
                    ? Number(
                        timeMatch[3]
                    )
                    : 0

            ).getTime();

        }


        /*
         * DD/MM/YYYY
         */

        match =
            String(
                dateValue ??
                ""
            )
                .trim()
                .match(
                    /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
                );


        if (!match) {

            return null;

        }


        const timeMatch =
            String(
                timeValue ??
                ""
            )
                .match(
                    /^(\d{1,2}):(\d{2})(?::(\d{2}))?/
                );


        return new Date(

            Number(
                match[3]
            ),

            Number(
                match[2]
            ) - 1,

            Number(
                match[1]
            ),

            timeMatch
                ? Number(
                    timeMatch[1]
                )
                : 0,

            timeMatch
                ? Number(
                    timeMatch[2]
                )
                : 0,

            timeMatch &&
            timeMatch[3]
                ? Number(
                    timeMatch[3]
                )
                : 0

        ).getTime();

    }


    /* =====================================================
       ESTADÍSTICAS
       ===================================================== */

    function stats(
        values
    ) {

        const valid =
            values.filter(
                Number.isFinite
            );


        if (!valid.length) {

            return {

                mean:
                    NaN,

                median:
                    NaN,

                max:
                    NaN,

                min:
                    NaN,

                std:
                    NaN,

                rms:
                    NaN,

                range:
                    NaN

            };

        }


        const sorted =
            [
                ...valid
            ]
                .sort(
                    function (
                        a,
                        b
                    ) {

                        return a - b;

                    }
                );


        const mean =
            valid.reduce(
                function (
                    total,
                    value
                ) {

                    return (
                        total +
                        value
                    );

                },
                0
            ) /
            valid.length;


        const middle =
            Math.floor(
                sorted.length / 2
            );


        const median =
            sorted.length % 2
                ? sorted[middle]
                : (
                    sorted[
                        middle - 1
                    ] +
                    sorted[
                        middle
                    ]
                ) / 2;


        const std =
            Math.sqrt(

                valid.reduce(
                    function (
                        total,
                        value
                    ) {

                        return (
                            total +
                            Math.pow(
                                value -
                                mean,
                                2
                            )
                        );

                    },
                    0
                ) /
                valid.length

            );


        const rms =
            Math.sqrt(

                valid.reduce(
                    function (
                        total,
                        value
                    ) {

                        return (
                            total +
                            value *
                            value
                        );

                    },
                    0
                ) /
                valid.length

            );


        const max =
            Math.max(
                ...valid
            );


        const min =
            Math.min(
                ...valid
            );


        return {

            mean,

            median,

            max,

            min,

            std,

            rms,

            range:
                max -
                min

        };

    }


    /* =====================================================
       REGRESIÓN LINEAL
       ===================================================== */

    function slope(
        x,
        y
    ) {

        if (
            x.length <
                2 ||
            y.length !==
                x.length
        ) {

            return NaN;

        }


        const meanX =
            x.reduce(
                (
                    a,
                    b
                ) =>
                    a + b,
                0
            ) /
            x.length;


        const meanY =
            y.reduce(
                (
                    a,
                    b
                ) =>
                    a + b,
                0
            ) /
            y.length;


        let numerator =
            0;


        let denominator =
            0;


        for (
            let i = 0;
            i < x.length;
            i++
        ) {

            numerator +=
                (
                    x[i] -
                    meanX
                ) *
                (
                    y[i] -
                    meanY
                );


            denominator +=
                Math.pow(
                    x[i] -
                    meanX,
                    2
                );

        }


        if (
            denominator ===
            0
        ) {

            return 0;

        }


        return (
            numerator /
            denominator
        );

    }


    /* =====================================================
       EVALUACIÓN
       ===================================================== */

    function overall(
        analysis
    ) {

        const moderate =
            [

                evalDrop(
                    analysis.drop
                ),

                evalResistance(
                    analysis.resistance
                ),

                evalThermal(
                    analysis.thermal
                ),

                evalHeating(
                    analysis.heating
                )

            ]
                .some(
                    function (item) {

                        return (
                            item.cls ===
                            "moderate"
                        );

                    }
                );


        if (moderate) {

            return {

                label:
                    "Condición moderada",

                cls:
                    "moderate",

                message:
                    "La batería presenta un comportamiento estable durante la prueba, aunque algunos indicadores derivados muestran valores que requieren seguimiento."

            };

        }


        return {

            label:
                "Condición buena",

            cls:
                "good",

            message:
                "La batería presenta un comportamiento estable durante la prueba, con los indicadores eléctricos y térmicos calculados dentro de los rangos establecidos."

        };

    }


    function ev(
        label,
        cls
    ) {

        return {

            label,

            cls

        };

    }


    function evalDrop(
        value
    ) {

        return value <= 0.50

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    function evalResistance(
        value
    ) {

        return Number.isFinite(
            value
        ) &&
        value <= 0.050

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    function evalDuration(
        value
    ) {

        return value >= 60

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    function evalEnergy(
        value
    ) {

        return value > 0

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    function evalThermal(
        value
    ) {

        return value <= 5

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    function evalHeating(
        value
    ) {

        return value <= 0.10

            ? ev(
                "Bueno",
                "good"
            )

            : ev(
                "Moderado",
                "moderate"
            );

    }


    /* =====================================================
       ELEMENTOS HTML
       ===================================================== */

    function indicator(
        icon,
        name,
        value,
        evaluation
    ) {

        return `

<div class="ind">

    <div class="icon">
        ${icon}
    </div>


    <div>

        <div>
            ${esc(name)}
        </div>

        <strong>
            ${esc(value)}
        </strong>

    </div>


    <div class="${evaluation.cls}">

        ●

        ${evaluation.label}

    </div>

</div>

`;

    }


    function signalCard(
        name,
        unit,
        statistics,
        specialName,
        specialValue
    ) {

        const specialUnit =
            specialName ===
            "dT/dt"

                ? "°C/min"

                : unit;


        return `

<div class="signal">


<div class="head">

    <strong>
        ${esc(name)}
    </strong>

    <small>
        Características estadísticas
    </small>

</div>


<div class="stats">

    ${stat(
        "Media",
        num(
            statistics.mean,
            2
        ) +
        " " +
        unit
    )}

    ${stat(
        "Mediana",
        num(
            statistics.median,
            2
        ) +
        " " +
        unit
    )}

    ${stat(
        "Máximo",
        num(
            statistics.max,
            2
        ) +
        " " +
        unit
    )}

    ${stat(
        "Mínimo",
        num(
            statistics.min,
            2
        ) +
        " " +
        unit
    )}

    ${stat(
        "Std",
        num(
            statistics.std,
            2
        ) +
        " " +
        unit
    )}

    ${stat(
        specialName,
        num(
            specialValue,
            3
        ) +
        " " +
        specialUnit
    )}

</div>


</div>

`;

    }


    function stat(
        label,
        value
    ) {

        return `

<div class="stat">

    <span>
        ${esc(label)}
    </span>

    <strong>
        ${esc(value)}
    </strong>

</div>

`;

    }


    function card(
        label,
        value
    ) {

        return `

<div class="card">

    <small>
        ${esc(label)}
    </small>

    <strong>
        ${esc(value)}
    </strong>

</div>

`;

    }


    /* =====================================================
       GRÁFICAS
       ===================================================== */

    function chart(
        title,
        key,
        unit,
        records
    ) {

        if (
            !records.length
        ) {

            return `
<div class="method">
    Sin datos para esta variable.
</div>
`;

        }


        /*
         * Reducimos a máximo 140 puntos
         * para que el PDF sea ligero.
         */

        const step =
            Math.max(
                1,
                Math.ceil(
                    records.length /
                    140
                )
            );


        const data =
            records.filter(
                function (
                    record,
                    index
                ) {

                    return (
                        index === 0 ||
                        index ===
                            records.length - 1 ||
                        index % step === 0
                    );

                }
            );


        const values =
            data
                .map(
                    function (record) {

                        return record[key];

                    }
                )
                .filter(
                    Number.isFinite
                );


        if (
            !values.length
        ) {

            return `
<div class="method">
    Sin datos.
</div>
`;

        }


        let min =
            Math.min(
                ...values
            );


        let max =
            Math.max(
                ...values
            );


        if (
            min === max
        ) {

            min -= 1;

            max += 1;

        }


        const width =
            700;


        const height =
            135;


        const left =
            45;


        const right =
            12;


        const top =
            10;


        const bottom =
            23;


        const innerWidth =
            width -
            left -
            right;


        const innerHeight =
            height -
            top -
            bottom;


        const points =
            data
                .map(
                    function (
                        record,
                        index
                    ) {

                        const x =
                            left +
                            (
                                index /
                                (
                                    data.length -
                                    1 ||
                                    1
                                )
                            ) *
                            innerWidth;


                        const y =
                            top +
                            (
                                1 -
                                (
                                    (
                                        record[key] -
                                        min
                                    ) /
                                    (
                                        max -
                                        min
                                    )
                                )
                            ) *
                            innerHeight;


                        return (
                            x.toFixed(1) +
                            "," +
                            y.toFixed(1)
                        );

                    }
                )
                .join(" ");


        let grid = "";


        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const y =
                top +
                (
                    i / 4
                ) *
                innerHeight;


            const value =
                max -
                (
                    i / 4
                ) *
                (
                    max -
                    min
                );


            grid += `

<line
    x1="${left}"
    y1="${y}"
    x2="${width - right}"
    y2="${y}"
    stroke="#e3e9ef"
/>


<text
    x="${left - 4}"
    y="${y + 3}"
    text-anchor="end"
    font-size="8"
    fill="#718096"
>
    ${value.toFixed(2)}
</text>

`;

        }


        return `

<div class="chart">

<h3>
    ${esc(title)}
</h3>


<svg
    viewBox="0 0 ${width} ${height}"
    xmlns="http://www.w3.org/2000/svg"
>


${grid}


<line
    x1="${left}"
    y1="${top}"
    x2="${left}"
    y2="${height - bottom}"
    stroke="#9aa9b9"
/>


<line
    x1="${left}"
    y1="${height - bottom}"
    x2="${width - right}"
    y2="${height - bottom}"
    stroke="#9aa9b9"
/>


<polyline
    points="${points}"
    fill="none"
    stroke="#11aebb"
    stroke-width="2"
    stroke-linejoin="round"
/>


<text
    x="${width - right}"
    y="10"
    text-anchor="end"
    font-size="8"
    fill="#718096"
>
    ${esc(unit)}
</text>


</svg>

</div>

`;

    }


    /* =====================================================
       FORMATO
       ===================================================== */

    function duration(
        minutes
    ) {

        if (
            !Number.isFinite(
                minutes
            )
        ) {

            return "—";

        }


        const total =
            Math.round(
                minutes
            );


        const hours =
            Math.floor(
                total / 60
            );


        const remaining =
            total % 60;


        if (
            hours === 0
        ) {

            return (
                total +
                " min"
            );

        }


        if (
            remaining === 0
        ) {

            return (
                hours +
                " h"
            );

        }


        return (
            hours +
            " h " +
            remaining +
            " min"
        );

    }


    function resistance(
        value
    ) {

        if (
            !Number.isFinite(
                value
            )
        ) {

            return "—";

        }


        return (
            (
                value *
                1000
            ).toFixed(1) +
            " mΩ"
        );

    }


    function dateTime(
        timestamp
    ) {

        if (
            !Number.isFinite(
                timestamp
            )
        ) {

            return "—";

        }


        return new Date(
            timestamp
        )
            .toLocaleString(
                "es-CO"
            );

    }


    function num(
        value,
        decimals
    ) {

        if (
            !Number.isFinite(
                value
            )
        ) {

            return "—";

        }


        return value.toFixed(
            decimals
        );

    }


    function number(
        value
    ) {

        return Number(
            String(
                value ??
                ""
            )
                .trim()
                .replace(
                    ",",
                    "."
                )
        );

    }


    function esc(
        value
    ) {

        return String(
            value ??
            ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            );

    }


    /* =====================================================
       API PÚBLICA
       ===================================================== */

    window.BATDiagPDF = {

        exportAll,

        exportRecord,

        getRecords,

        analyze

    };

})();