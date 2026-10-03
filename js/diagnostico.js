/* =========================================================
   BAT-DIAG
   diagnostico.js

   DIAGNÓSTICO DINÁMICO A PARTIR DEL CSV CARGADO

   Estructura del CSV:

   0 = Fecha
   1 = Hora
   2 = Temperatura ambiente
   3 = Temperatura batería
   4 = Humedad
   5 = Voltaje
   6 = Corriente

   Los datos son recuperados desde:

   sessionStorage["csvRows"]

========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CSV_COLUMNS = {

    DATE: 0,

    TIME: 1,

    AMBIENT_TEMP: 2,

    BATTERY_TEMP: 3,

    HUMIDITY: 4,

    VOLTAGE: 5,

    CURRENT: 6

};


/* =========================================================
   ESTADO
========================================================= */

let diagnosticData = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDiagnostic
);


function initializeDiagnostic() {

    loadDiagnosticData();

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    setupControlButtons();

}


/* =========================================================
   CARGAR DATOS DEL CSV
========================================================= */

function loadDiagnosticData() {

    const loaded =
        sessionStorage.getItem(
            "csvLoaded"
        );


    const storedRows =
        sessionStorage.getItem(
            "csvRows"
        );


    /*
     * Si no hay datos cargados,
     * no inventamos información.
     */

    if (
        loaded !== "true" ||
        !storedRows
    ) {

        showNoDataState();

        return;

    }


    try {

        const rows =
            JSON.parse(
                storedRows
            );


        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {

            showNoDataState();

            return;

        }


        diagnosticData =
            calculateDiagnostics(
                rows
            );


        if (!diagnosticData) {

            showNoDataState();

            return;

        }


        updateDiagnosticInterface(
            diagnosticData
        );


    } catch (error) {

        console.error(
            "Error cargando datos del diagnóstico:",
            error
        );


        showNoDataState();

    }

}


/* =========================================================
   CALCULAR DIAGNÓSTICO
========================================================= */

function calculateDiagnostics(
    rows
) {

    const records =
        rows
            .map(
                normalizeRecord
            )
            .filter(
                Boolean
            );


    if (
        records.length === 0
    ) {

        return null;

    }


    /*
     * Ordenar por fecha y hora.
     */

    records.sort(
        function (
            a,
            b
        ) {

            return (
                a.dateTime.getTime() -
                b.dateTime.getTime()
            );

        }
    );


    /*
     * Obtener valores individuales.
     */

    const ambient =
        records.map(
            function (record) {

                return record.ambientTemp;

            }
        );


    const batteryTemp =
        records.map(
            function (record) {

                return record.batteryTemp;

            }
        );


    const humidity =
        records.map(
            function (record) {

                return record.humidity;

            }
        );


    const voltage =
        records.map(
            function (record) {

                return record.voltage;

            }
        );


    const current =
        records.map(
            function (record) {

                return record.current;

            }
        );


    /*
     * Estadísticas.
     */

    const voltageStats =
        calculateStatistics(
            voltage
        );


    const currentStats =
        calculateStatistics(
            current
        );


    const batteryTempStats =
        calculateStatistics(
            batteryTemp
        );


    const ambientStats =
        calculateStatistics(
            ambient
        );


    const humidityStats =
        calculateStatistics(
            humidity
        );


    /*
     * Primera y última medición.
     */

    const firstDate =
        records[0].dateTime;


    const lastDate =
        records[
            records.length - 1
        ].dateTime;


    /*
     * Duración.
     */

    const durationMinutes =
        Math.max(
            0,
            (
                lastDate.getTime() -
                firstDate.getTime()
            ) / 60000
        );


    /*
     * Energía.
     */

    const energyWh =
        calculateEnergyWh(
            records
        );


    /*
     * Incremento térmico.
     */

    const thermalIncrease =
        batteryTempStats.max -
        batteryTempStats.min;


    /*
     * Tasa de calentamiento.
     */

    const heatingRate =
        calculateHeatingRate(
            records
        );


    /*
     * Caída de voltaje.
     */

    const voltageDrop =
        voltageStats.max -
        voltageStats.min;


    /*
     * Resistencia dinámica estimada.
     */

    const internalResistanceOhm =
        calculateDynamicResistance(
            records
        );


    return {

        records: records,

        rowCount:
            records.length,

        firstDate:
            firstDate,

        lastDate:
            lastDate,

        durationMinutes:
            durationMinutes,

        energyWh:
            energyWh,

        voltageDrop:
            voltageDrop,

        internalResistanceOhm:
            internalResistanceOhm,

        thermalIncrease:
            thermalIncrease,

        heatingRate:
            heatingRate,

        voltage:
            voltageStats,

        current:
            currentStats,

        batteryTemp:
            batteryTempStats,

        ambientTemp:
            ambientStats,

        humidity:
            humidityStats

    };

}


/* =========================================================
   NORMALIZAR REGISTRO
========================================================= */

function normalizeRecord(
    row
) {

    if (
        !Array.isArray(row) ||
        row.length < 7
    ) {

        return null;

    }


    const date =
        String(
            row[
                CSV_COLUMNS.DATE
            ]
        ).trim();


    const time =
        String(
            row[
                CSV_COLUMNS.TIME
            ]
        ).trim();


    const ambientTemp =
        toNumber(
            row[
                CSV_COLUMNS.AMBIENT_TEMP
            ]
        );


    const batteryTemp =
        toNumber(
            row[
                CSV_COLUMNS.BATTERY_TEMP
            ]
        );


    const humidity =
        toNumber(
            row[
                CSV_COLUMNS.HUMIDITY
            ]
        );


    const voltage =
        toNumber(
            row[
                CSV_COLUMNS.VOLTAGE
            ]
        );


    const current =
        toNumber(
            row[
                CSV_COLUMNS.CURRENT
            ]
        );


    const dateTime =
        parseDateTime(
            date,
            time
        );


    if (
        !dateTime ||
        !Number.isFinite(
            ambientTemp
        ) ||
        !Number.isFinite(
            batteryTemp
        ) ||
        !Number.isFinite(
            humidity
        ) ||
        !Number.isFinite(
            voltage
        ) ||
        !Number.isFinite(
            current
        )
    ) {

        return null;

    }


    return {

        date: date,

        time: time,

        dateTime: dateTime,

        ambientTemp:
            ambientTemp,

        batteryTemp:
            batteryTemp,

        humidity:
            humidity,

        voltage:
            voltage,

        current:
            current

    };

}


/* =========================================================
   CONVERTIR A NÚMERO
========================================================= */

function toNumber(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return NaN;

    }


    return Number(
        String(value)
            .trim()
            .replace(
                ",",
                "."
            )
    );

}


/* =========================================================
   PARSEAR FECHA Y HORA
========================================================= */

function parseDateTime(
    dateValue,
    timeValue
) {

    const dateMatch =
        String(dateValue)
            .trim()
            .match(
                /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
            );


    const timeMatch =
        String(timeValue)
            .trim()
            .match(
                /^(\d{1,2}):(\d{2}):(\d{2})$/
            );


    if (
        !dateMatch ||
        !timeMatch
    ) {

        return null;

    }


    const date =
        new Date(

            Number(
                dateMatch[1]
            ),

            Number(
                dateMatch[2]
            ) - 1,

            Number(
                dateMatch[3]
            ),

            Number(
                timeMatch[1]
            ),

            Number(
                timeMatch[2]
            ),

            Number(
                timeMatch[3]
            )

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


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function calculateStatistics(
    values
) {

    const valid =
        values.filter(
            function (value) {

                return Number.isFinite(
                    value
                );

            }
        );


    if (
        valid.length === 0
    ) {

        return {

            mean: NaN,

            median: NaN,

            max: NaN,

            min: NaN,

            std: NaN,

            rms: NaN,

            range: NaN

        };

    }


    /*
     * MEDIA
     */

    const sum =
        valid.reduce(
            function (
                total,
                value
            ) {

                return total + value;

            },
            0
        );


    const mean =
        sum /
        valid.length;


    /*
     * MEDIANA
     */

    const sorted =
        [...valid].sort(
            function (
                a,
                b
            ) {

                return a - b;

            }
        );


    let median;


    if (
        sorted.length % 2 === 0
    ) {

        const middle =
            sorted.length / 2;


        median =
            (
                sorted[
                    middle - 1
                ] +
                sorted[
                    middle
                ]
            ) / 2;

    } else {

        median =
            sorted[
                Math.floor(
                    sorted.length / 2
                )
            ];

    }


    /*
     * DESVIACIÓN ESTÁNDAR
     */

    const squaredDeviation =
        valid.reduce(
            function (
                total,
                value
            ) {

                return (
                    total +
                    Math.pow(
                        value - mean,
                        2
                    )
                );

            },
            0
        );


    const std =
        Math.sqrt(
            squaredDeviation /
            valid.length
        );


    /*
     * RMS
     */

    const squaredValues =
        valid.reduce(
            function (
                total,
                value
            ) {

                return (
                    total +
                    value * value
                );

            },
            0
        );


    const rms =
        Math.sqrt(
            squaredValues /
            valid.length
        );


    /*
     * MÁXIMO Y MÍNIMO
     */

    const max =
        Math.max(
            ...valid
        );


    const min =
        Math.min(
            ...valid
        );


    return {

        mean: mean,

        median: median,

        max: max,

        min: min,

        std: std,

        rms: rms,

        range:
            max - min

    };

}


/* =========================================================
   CALCULAR ENERGÍA
========================================================= */

function calculateEnergyWh(
    records
) {

    if (
        records.length < 2
    ) {

        return 0;

    }


    let energyWh = 0;


    for (
        let i = 1;
        i < records.length;
        i++
    ) {

        const previous =
            records[
                i - 1
            ];


        const current =
            records[i];


        const deltaHours =
            (
                current.dateTime.getTime() -
                previous.dateTime.getTime()
            ) /
            3600000;


        /*
         * Potencia del punto anterior.
         */

        const powerPrevious =
            Math.abs(
                previous.voltage *
                previous.current
            );


        /*
         * Potencia del punto actual.
         */

        const powerCurrent =
            Math.abs(
                current.voltage *
                current.current
            );


        /*
         * Integración trapezoidal.
         */

        energyWh +=
            (
                (
                    powerPrevious +
                    powerCurrent
                ) / 2
            ) *
            deltaHours;

    }


    return Math.max(
        0,
        energyWh
    );

}


/* =========================================================
   TASA DE CALENTAMIENTO
========================================================= */

function calculateHeatingRate(
    records
) {

    if (
        records.length < 2
    ) {

        return 0;

    }


    const firstTime =
        records[0]
            .dateTime
            .getTime();


    const x =
        records.map(
            function (
                record
            ) {

                return (
                    record.dateTime.getTime() -
                    firstTime
                ) / 60000;

            }
        );


    const y =
        records.map(
            function (
                record
            ) {

                return record.batteryTemp;

            }
        );


    return calculateSlope(
        x,
        y
    );

}


/* =========================================================
   RESISTENCIA DINÁMICA ESTIMADA
========================================================= */

function calculateDynamicResistance(
    records
) {

    if (
        records.length < 2
    ) {

        return NaN;

    }


    const currents =
        records.map(
            function (
                record
            ) {

                return record.current;

            }
        );


    const voltages =
        records.map(
            function (
                record
            ) {

                return record.voltage;

            }
        );


    const slope =
        calculateSlope(
            currents,
            voltages
        );


    if (
        !Number.isFinite(
            slope
        )
    ) {

        return NaN;

    }


    return Math.abs(
        slope
    );

}


/* =========================================================
   REGRESIÓN LINEAL
========================================================= */

function calculateSlope(
    x,
    y
) {

    if (
        x.length !== y.length ||
        x.length < 2
    ) {

        return NaN;

    }


    const meanX =
        x.reduce(
            function (
                total,
                value
            ) {

                return total + value;

            },
            0
        ) /
        x.length;


    const meanY =
        y.reduce(
            function (
                total,
                value
            ) {

                return total + value;

            },
            0
        ) /
        y.length;


    let numerator = 0;

    let denominator = 0;


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
        denominator === 0
    ) {

        return 0;

    }


    return (
        numerator /
        denominator
    );

}


/* =========================================================
   ACTUALIZAR TODA LA INTERFAZ
========================================================= */

function updateDiagnosticInterface(
    data
) {

    if (!data) {

        showNoDataState();

        return;

    }


    updateSummary(
        data
    );


    updateCharacteristicCards(
        data
    );


    updateIndicators(
        data
    );


    updateConclusion(
        data
    );


    updateDiagnosticHeader(
        data
    );

}


/* =========================================================
   RESUMEN
========================================================= */

function updateSummary(
    data
) {

    const summaryItems =
        document.querySelectorAll(
            ".summary-item"
        );


    if (
        summaryItems.length < 4
    ) {

        return;

    }


    /*
     * ESTADO
     */

    const stateStrong =
        summaryItems[0]
            .querySelector(
                "strong"
            );


    if (stateStrong) {

        stateStrong.textContent =
            "Completo";

    }


    /*
     * VARIABLES
     *
     * El CSV tiene:
     *
     * Temperatura ambiente
     * Temperatura batería
     * Humedad
     * Voltaje
     * Corriente
     *
     * = 5 variables de medición.
     */

    const variablesStrong =
        summaryItems[1]
            .querySelector(
                "strong"
            );


    if (variablesStrong) {

        variablesStrong.textContent =
            "5";

    }


    /*
     * CARACTERÍSTICAS
     */

    const featuresStrong =
        summaryItems[2]
            .querySelector(
                "strong"
            );


    if (featuresStrong) {

        featuresStrong.textContent =
            "30";

    }


    /*
     * DURACIÓN
     */

    const durationStrong =
        summaryItems[3]
            .querySelector(
                "strong"
            );


    if (durationStrong) {

        durationStrong.textContent =
            formatDuration(
                data.durationMinutes
            );

    }

}


/* =========================================================
   TARJETAS DE CARACTERÍSTICAS
========================================================= */

function updateCharacteristicCards(
    data
) {

    const cards =
        document.querySelectorAll(
            ".characteristic-card"
        );


    if (
        cards.length < 5
    ) {

        console.warn(
            "No se encontraron las 5 tarjetas de características."
        );

        return;

    }


    /*
     * -----------------------------------------------------
     * VOLTAJE
     * -----------------------------------------------------
     */

    updateStatCard(
        cards[0],
        [

            formatValue(
                data.voltage.mean,
                2,
                " V"
            ),

            formatValue(
                data.voltage.median,
                2,
                " V"
            ),

            formatValue(
                data.voltage.max,
                2,
                " V"
            ),

            formatValue(
                data.voltage.min,
                2,
                " V"
            ),

            formatValue(
                data.voltage.std,
                2,
                " V"
            ),

            formatValue(
                data.voltage.range,
                2,
                " V"
            )

        ]
    );


    /*
     * -----------------------------------------------------
     * CORRIENTE
     * -----------------------------------------------------
     */

    updateStatCard(
        cards[1],
        [

            formatValue(
                data.current.mean,
                2,
                " A"
            ),

            formatValue(
                data.current.median,
                2,
                " A"
            ),

            formatValue(
                data.current.max,
                2,
                " A"
            ),

            formatValue(
                data.current.min,
                2,
                " A"
            ),

            formatValue(
                data.current.std,
                2,
                " A"
            ),

            formatValue(
                data.current.rms,
                2,
                " A"
            )

        ]
    );


    /*
     * -----------------------------------------------------
     * TEMPERATURA BATERÍA
     * -----------------------------------------------------
     */

    updateStatCard(
        cards[2],
        [

            formatValue(
                data.batteryTemp.mean,
                2,
                " °C"
            ),

            formatValue(
                data.batteryTemp.median,
                2,
                " °C"
            ),

            formatValue(
                data.batteryTemp.max,
                2,
                " °C"
            ),

            formatValue(
                data.batteryTemp.min,
                2,
                " °C"
            ),

            formatValue(
                data.batteryTemp.std,
                2,
                " °C"
            ),

            formatValue(
                data.heatingRate,
                3,
                " °C/min"
            )

        ]
    );


    /*
     * -----------------------------------------------------
     * TEMPERATURA AMBIENTE
     * -----------------------------------------------------
     */

    updateStatCard(
        cards[3],
        [

            formatValue(
                data.ambientTemp.mean,
                2,
                " °C"
            ),

            formatValue(
                data.ambientTemp.median,
                2,
                " °C"
            ),

            formatValue(
                data.ambientTemp.max,
                2,
                " °C"
            ),

            formatValue(
                data.ambientTemp.min,
                2,
                " °C"
            ),

            formatValue(
                data.ambientTemp.std,
                2,
                " °C"
            ),

            formatValue(
                data.ambientTemp.range,
                2,
                " °C"
            )

        ]
    );


    /*
     * -----------------------------------------------------
     * HUMEDAD
     * -----------------------------------------------------
     */

    updateStatCard(
        cards[4],
        [

            formatValue(
                data.humidity.mean,
                2,
                " %"
            ),

            formatValue(
                data.humidity.median,
                2,
                " %"
            ),

            formatValue(
                data.humidity.max,
                2,
                " %"
            ),

            formatValue(
                data.humidity.min,
                2,
                " %"
            ),

            formatValue(
                data.humidity.std,
                2,
                " %"
            ),

            formatValue(
                data.humidity.range,
                2,
                " %"
            )

        ]
    );

}


/* =========================================================
   ACTUALIZAR TARJETA
========================================================= */

function updateStatCard(
    card,
    values
) {

    if (!card) {

        return;

    }


    const stats =
        card.querySelectorAll(
            ".stat strong"
        );


    values.forEach(
        function (
            value,
            index
        ) {

            if (
                stats[index]
            ) {

                stats[index]
                    .textContent =
                    value;

            }

        }
    );

}


/* =========================================================
   INDICADORES
========================================================= */

function updateIndicators(
    data
) {

    const indicators =
        document.querySelectorAll(
            ".diagnostic-indicator"
        );


    if (
        indicators.length < 6
    ) {

        console.warn(
            "No se encontraron los 6 indicadores."
        );

        return;

    }


    /*
     * 1 — CAÍDA DE VOLTAJE
     */

    setIndicatorValue(
        indicators[0],
        formatValue(
            data.voltageDrop,
            2,
            " V"
        )
    );


    setIndicatorStatus(
        indicators[0],
        evaluateVoltageDrop(
            data.voltageDrop
        )
    );


    /*
     * 2 — RESISTENCIA INTERNA
     */

    setIndicatorValue(
        indicators[1],
        formatResistance(
            data.internalResistanceOhm
        )
    );


    setIndicatorStatus(
        indicators[1],
        evaluateResistance(
            data.internalResistanceOhm
        )
    );


    /*
     * 3 — TIEMPO
     */

    setIndicatorValue(
        indicators[2],
        formatDuration(
            data.durationMinutes
        )
    );


    setIndicatorStatus(
        indicators[2],
        evaluateDuration(
            data.durationMinutes
        )
    );


    /*
     * 4 — ENERGÍA
     */

    setIndicatorValue(
        indicators[3],
        formatValue(
            data.energyWh,
            2,
            " Wh"
        )
    );


    setIndicatorStatus(
        indicators[3],
        evaluateEnergy(
            data.energyWh
        )
    );


    /*
     * 5 — INCREMENTO TÉRMICO
     */

    setIndicatorValue(
        indicators[4],
        formatValue(
            data.thermalIncrease,
            2,
            " °C"
        )
    );


    setIndicatorStatus(
        indicators[4],
        evaluateThermalIncrease(
            data.thermalIncrease
        )
    );


    /*
     * 6 — TASA DE CALENTAMIENTO
     */

    setIndicatorValue(
        indicators[5],
        formatValue(
            data.heatingRate,
            3,
            " °C/min"
        )
    );


    setIndicatorStatus(
        indicators[5],
        evaluateHeatingRate(
            data.heatingRate
        )
    );

}


/* =========================================================
   COLOCAR VALOR
========================================================= */

function setIndicatorValue(
    indicator,
    value
) {

    const element =
        indicator.querySelector(
            ".indicator-content strong"
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   COLOCAR ESTADO
========================================================= */

function setIndicatorStatus(
    indicator,
    status
) {

    const element =
        indicator.querySelector(
            ".indicator-status"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "● " +
        status.label;


    element.classList.remove(
        "good",
        "moderate"
    );


    element.classList.add(
        status.className
    );

}


/* =========================================================
   EVALUAR CAÍDA DE VOLTAJE
========================================================= */

function evaluateVoltageDrop(
    value
) {

    if (
        !Number.isFinite(value)
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    if (
        value <= 0.50
    ) {

        return {

            label:
                "Bueno",

            className:
                "good"

        };

    }


    return {

        label:
            "Moderado",

        className:
            "moderate"

    };

}


/* =========================================================
   EVALUAR RESISTENCIA
========================================================= */

function evaluateResistance(
    value
) {

    if (
        !Number.isFinite(value)
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    /*
     * Es una resistencia dinámica estimada
     * mediante los datos V/I.
     */

    if (
        value <= 0.050
    ) {

        return {

            label:
                "Bueno",

            className:
                "good"

        };

    }


    return {

        label:
            "Moderado",

        className:
            "moderate"

    };

}


/* =========================================================
   EVALUAR DURACIÓN
========================================================= */

function evaluateDuration(
    minutes
) {

    if (
        !Number.isFinite(minutes)
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    if (
        minutes >= 60
    ) {

        return {

            label:
                "Bueno",

            className:
                "good"

        };

    }


    return {

        label:
            "Moderado",

        className:
            "moderate"

    };

}


/* =========================================================
   EVALUAR ENERGÍA
========================================================= */

function evaluateEnergy(
    energyWh
) {

    if (
        !Number.isFinite(
            energyWh
        ) ||
        energyWh <= 0
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    /*
     * El CSV no contiene la capacidad nominal
     * de la batería.
     *
     * Por eso no se compara la energía
     * contra un valor inventado.
     */

    return {

        label:
            "Bueno",

        className:
            "good"

    };

}


/* =========================================================
   EVALUAR INCREMENTO TÉRMICO
========================================================= */

function evaluateThermalIncrease(
    value
) {

    if (
        !Number.isFinite(value)
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    if (
        value <= 5
    ) {

        return {

            label:
                "Bueno",

            className:
                "good"

        };

    }


    return {

        label:
            "Moderado",

        className:
            "moderate"

    };

}


/* =========================================================
   EVALUAR TASA DE CALENTAMIENTO
========================================================= */

function evaluateHeatingRate(
    value
) {

    if (
        !Number.isFinite(value)
    ) {

        return {

            label:
                "No disponible",

            className:
                "moderate"

        };

    }


    if (
        value <= 0.10
    ) {

        return {

            label:
                "Bueno",

            className:
                "good"

        };

    }


    return {

        label:
            "Moderado",

        className:
            "moderate"

    };

}


/* =========================================================
   CONCLUSIÓN
========================================================= */

function updateConclusion(
    data
) {

    const conclusion =
        document.querySelector(
            ".diagnostic-conclusion"
        );


    if (!conclusion) {

        return;

    }


    const text =
        conclusion.querySelector(
            "p"
        );


    const status =
        conclusion.querySelector(
            ".conclusion-status"
        );


    const evaluation =
        evaluateOverallCondition(
            data
        );


    if (text) {

        text.textContent =
            evaluation.message;

    }


    if (status) {

        status.textContent =
            evaluation.label;


        status.style.background =
            evaluation.background;


        status.style.color =
            evaluation.color;

    }

}


/* =========================================================
   EVALUACIÓN GENERAL
========================================================= */

function evaluateOverallCondition(
    data
) {

    let moderateCount = 0;


    const voltageStatus =
        evaluateVoltageDrop(
            data.voltageDrop
        );


    const resistanceStatus =
        evaluateResistance(
            data.internalResistanceOhm
        );


    const thermalStatus =
        evaluateThermalIncrease(
            data.thermalIncrease
        );


    const heatingStatus =
        evaluateHeatingRate(
            data.heatingRate
        );


    if (
        voltageStatus.className ===
        "moderate"
    ) {

        moderateCount++;

    }


    if (
        resistanceStatus.className ===
        "moderate"
    ) {

        moderateCount++;

    }


    if (
        thermalStatus.className ===
        "moderate"
    ) {

        moderateCount++;

    }


    if (
        heatingStatus.className ===
        "moderate"
    ) {

        moderateCount++;

    }


    /*
     * Todo dentro de rango.
     */

    if (
        moderateCount === 0
    ) {

        return {

            label:
                "Condición buena",

            color:
                "#159d42",

            background:
                "rgba(21, 157, 66, 0.10)",

            message:
                "La batería presenta un comportamiento estable durante la prueba, con los indicadores eléctricos y térmicos calculados dentro de los rangos establecidos."

        };

    }


    /*
     * Algún indicador requiere seguimiento.
     */

    return {

        label:
            "Condición moderada",

        color:
            "#d78b00",

        background:
            "rgba(233, 154, 8, 0.10)",

        message:
            "La batería presenta un comportamiento estable durante la prueba, aunque algunos indicadores derivados muestran valores que requieren seguimiento."

    };

}


/* =========================================================
   CABECERA
========================================================= */

function updateDiagnosticHeader(
    data
) {

    const status =
        document.querySelector(
            ".diagnostic-status strong"
        );


    const detail =
        document.querySelector(
            ".diagnostic-status small"
        );


    if (status) {

        status.textContent =
            "Análisis disponible";

    }


    if (detail) {

        detail.textContent =
            "Datos procesados: " +
            formatDuration(
                data.durationMinutes
            );

    }

}


/* =========================================================
   SIN DATOS
========================================================= */

function showNoDataState() {

    const status =
        document.querySelector(
            ".diagnostic-status strong"
        );


    const detail =
        document.querySelector(
            ".diagnostic-status small"
        );


    if (status) {

        status.textContent =
            "Sin datos CSV";

    }


    if (detail) {

        detail.textContent =
            "Carga primero un archivo CSV";

    }


    const conclusionText =
        document.querySelector(
            ".diagnostic-conclusion p"
        );


    if (conclusionText) {

        conclusionText.textContent =
            "No hay datos de medición disponibles. Carga y valida un archivo CSV desde BAT-DIAG para generar el diagnóstico.";

    }


    const conclusionStatus =
        document.querySelector(
            ".conclusion-status"
        );


    if (conclusionStatus) {

        conclusionStatus.textContent =
            "Sin datos";


        conclusionStatus.style.background =
            "#edf1f5";


        conclusionStatus.style.color =
            "#667386";

    }

}


/* =========================================================
   FORMATEAR VALOR
========================================================= */

function formatValue(
    value,
    decimals,
    unit
) {

    if (
        !Number.isFinite(value)
    ) {

        return "—";

    }


    return (
        value.toFixed(
            decimals
        ) +
        unit
    );

}


/* =========================================================
   FORMATEAR RESISTENCIA
========================================================= */

function formatResistance(
    ohm
) {

    if (
        !Number.isFinite(ohm)
    ) {

        return "—";

    }


    const milliOhm =
        ohm * 1000;


    if (
        Math.abs(
            milliOhm
        ) < 1000
    ) {

        return (
            milliOhm.toFixed(1) +
            " mΩ"
        );

    }


    return (
        ohm.toFixed(2) +
        " Ω"
    );

}


/* =========================================================
   FORMATEAR DURACIÓN
========================================================= */

function formatDuration(
    minutes
) {

    if (
        !Number.isFinite(minutes)
    ) {

        return "—";

    }


    const totalMinutes =
        Math.round(
            minutes
        );


    if (
        totalMinutes < 60
    ) {

        return (
            totalMinutes +
            " min"
        );

    }


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const remainingMinutes =
        totalMinutes % 60;


    if (
        remainingMinutes === 0
    ) {

        return (
            hours +
            " h"
        );

    }


    return (
        hours +
        " h " +
        remainingMinutes +
        " min"
    );

}


/* =========================================================
   RELOJ
========================================================= */

function updateClock() {

    const now =
        new Date();


    const timeElement =
        document.getElementById(
            "current-time"
        );


    const dateElement =
        document.getElementById(
            "current-date"
        );


    if (timeElement) {

        timeElement.textContent =
            now.toLocaleTimeString(
                "es-CO",
                {

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"

                }
            );

    }


    if (dateElement) {

        dateElement.textContent =
            now.toLocaleDateString(
                "es-CO",
                {

                    day:
                        "2-digit",

                    month:
                        "2-digit",

                    year:
                        "numeric"

                }
            );

    }

}


/* =========================================================
   BOTONES INICIAR / DETENER
========================================================= */

function setupControlButtons() {

    const startButton =
        document.getElementById(
            "btn-start"
        );


    const stopButton =
        document.getElementById(
            "btn-stop"
        );


    /*
     * BOTÓN INICIAR
     */

    if (startButton) {

        startButton.addEventListener(
            "click",
            function () {

                startButton.classList.add(
                    "active"
                );


                if (stopButton) {

                    stopButton.classList.remove(
                        "active"
                    );

                }


                console.log(
                    "BAT-DIAG: diagnóstico activo."
                );

            }
        );

    }


    /*
     * BOTÓN DETENER
     */

    if (stopButton) {

        stopButton.addEventListener(
            "click",
            function () {

                stopButton.classList.add(
                    "active"
                );


                if (startButton) {

                    startButton.classList.remove(
                        "active"
                    );

                }


                console.log(
                    "BAT-DIAG: diagnóstico detenido."
                );

            }
        );

    }

}


/* =========================================================
   DEBUG

   En consola puedes escribir:

   window.batDiagDiagnosticData

   para ver todos los resultados calculados.
========================================================= */

Object.defineProperty(
    window,
    "batDiagDiagnosticData",
    {

        get:
            function () {

                return diagnosticData;

            }

    }
);