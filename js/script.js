"use strict";

/*
============================================================
 BAT-DIAG
 js/script.js

 CONTROLADOR PRINCIPAL

 FLUJO:

 carga-csv.js
      ↓
 sessionStorage
      ↓
 csvRows
      ↓
 script.js
      ↓
 normalización
      ↓
 cálculos matemáticos
      ↓
 interfaz
      ↓
 graficas.js


 FORMATO REAL DE csvRows:

 [
   [
     "2025-05-15",
     "10:35:42",
     "27.4",
     "33.7",
     "62.3",
     "12.31",
     "-3.48"
   ],
   ...
 ]


 POSICIONES:

 0 = Fecha
 1 = Hora
 2 = Temperatura ambiente
 3 = Temperatura batería
 4 = Humedad
 5 = Voltaje
 6 = Corriente
============================================================
*/


/* =========================================================
   ESTADO GLOBAL
========================================================= */

const BAT_DIAG_STATE = {

    measurements: [],

    latest: null,

    fileName: "--",

    storage: {

        name: "--",

        usedGB: null,

        totalGB: null,

        freeGB: null,

        usedPercent: null,

        freePercent: null

    },

    durationSeconds: 0,

    calculations: {},

    initialized: false

};


/* =========================================================
   API GLOBAL
========================================================= */

window.BAT_DIAG_DATA = {

    measurements: [],

    latest: null,

    fileName: "--",

    calculations: {},

    storage: {}

};


window.BAT_DIAG_CHART_DATA = {

    measurements: [],

    latest: null,

    variable: "voltaje"

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarBATDIAG
);


function iniciarBATDIAG() {

    console.log(
        "BAT-DIAG: iniciando..."
    );


    cargarDatosPersistidos();


    if (
        !BAT_DIAG_STATE.measurements.length
    ) {

        mostrarEstadoSinDatos();


        console.warn(
            "BAT-DIAG: no existen mediciones."
        );


        publicarDatos();


        notificarGrafica();


        return;

    }


    procesarDatos();


    actualizarInterfaz();


    publicarDatos();


    notificarGrafica();


    BAT_DIAG_STATE.initialized =
        true;


    console.log(
        "BAT-DIAG: datos cargados correctamente."
    );


    console.log(
        "Registros:",
        BAT_DIAG_STATE.measurements.length
    );

}


/* =========================================================
   CARGAR DATOS PERSISTIDOS
========================================================= */

function cargarDatosPersistidos() {

    /*
     * -----------------------------------------------------
     * 1. CSV
     * -----------------------------------------------------
     */

    const csvRows =
        sessionStorage.getItem(
            "csvRows"
        );


    if (
        csvRows
    ) {

        try {

            const filas =
                JSON.parse(
                    csvRows
                );


            if (
                Array.isArray(
                    filas
                )
            ) {

                BAT_DIAG_STATE.measurements =
                    filas;


                console.log(
                    "BAT-DIAG: mediciones cargadas desde csvRows:",
                    filas.length
                );

            }

        } catch (error) {

            console.error(
                "BAT-DIAG: error leyendo csvRows:",
                error
            );

        }

    }


    /*
     * -----------------------------------------------------
     * 2. NOMBRE DEL CSV
     * -----------------------------------------------------
     */

    BAT_DIAG_STATE.fileName =
        sessionStorage.getItem(
            "csvFileName"
        ) ||
        sessionStorage.getItem(
            "fileName"
        ) ||
        "--";


    /*
     * -----------------------------------------------------
     * 3. UNIDAD DE ALMACENAMIENTO
     * -----------------------------------------------------
     */

    const storageName =
        sessionStorage.getItem(
            "storageUnit"
        );


    const storageTotal =
        convertirNumero(
            sessionStorage.getItem(
                "storageTotalGB"
            )
        );


    const storageUsed =
        convertirNumero(
            sessionStorage.getItem(
                "storageUsedGB"
            )
        );


    const storageFree =
        convertirNumero(
            sessionStorage.getItem(
                "storageFreeGB"
            )
        );


    let storageUsedPercent =
        convertirNumero(
            sessionStorage.getItem(
                "storageUsedPercent"
            )
        );


    /*
     * -----------------------------------------------------
     * SI NO EXISTE EL PORCENTAJE,
     * CALCULARLO.
     *
     * porcentaje =
     *
     * usados / capacidad total × 100
     * -----------------------------------------------------
     */

    if (
        !Number.isFinite(
            storageUsedPercent
        ) &&
        Number.isFinite(
            storageUsed
        ) &&
        Number.isFinite(
            storageTotal
        ) &&
        storageTotal > 0
    ) {

        storageUsedPercent =
            (
                storageUsed /
                storageTotal
            ) *
            100;

    }


    let freePercent =
        NaN;


    if (
        Number.isFinite(
            storageUsedPercent
        )
    ) {

        freePercent =
            100 -
            storageUsedPercent;

    }


    BAT_DIAG_STATE.storage = {

        name:
            storageName ||
            "--",

        usedGB:
            Number.isFinite(
                storageUsed
            )
                ? storageUsed
                : null,

        totalGB:
            Number.isFinite(
                storageTotal
            )
                ? storageTotal
                : null,

        freeGB:
            Number.isFinite(
                storageFree
            )
                ? storageFree
                : (
                    Number.isFinite(
                        storageUsed
                    ) &&
                    Number.isFinite(
                        storageTotal
                    )
                        ? storageTotal -
                          storageUsed
                        : null
                ),

        usedPercent:
            Number.isFinite(
                storageUsedPercent
            )
                ? storageUsedPercent
                : null,

        freePercent:
            Number.isFinite(
                freePercent
            )
                ? freePercent
                : null

    };


    /*
     * -----------------------------------------------------
     * 4. RESPALDO: batDiagSession
     * -----------------------------------------------------
     */

    const session =
        sessionStorage.getItem(
            "batDiagSession"
        );


    if (
        session
    ) {

        try {

            const parsed =
                JSON.parse(
                    session
                );


            /*
             * Nombre del archivo.
             */

            if (
                BAT_DIAG_STATE.fileName ===
                "--"
            ) {

                BAT_DIAG_STATE.fileName =
                    parsed.fileName ||
                    "--";

            }


            /*
             * Unidad.
             */

            if (
                BAT_DIAG_STATE.storage.name ===
                "--" &&
                parsed.storageUnit
            ) {

                BAT_DIAG_STATE.storage.name =
                    parsed.storageUnit;

            }


            /*
             * Capacidad.
             */

            if (
                !Number.isFinite(
                    BAT_DIAG_STATE.storage.totalGB
                )
            ) {

                const total =
                    convertirNumero(
                        parsed.storageTotalGB
                    );


                if (
                    Number.isFinite(
                        total
                    )
                ) {

                    BAT_DIAG_STATE.storage.totalGB =
                        total;

                }

            }


            /*
             * Usado.
             */

            if (
                !Number.isFinite(
                    BAT_DIAG_STATE.storage.usedGB
                )
            ) {

                const used =
                    convertirNumero(
                        parsed.storageUsedGB
                    );


                if (
                    Number.isFinite(
                        used
                    )
                ) {

                    BAT_DIAG_STATE.storage.usedGB =
                        used;

                }

            }


            /*
             * Libre.
             */

            if (
                !Number.isFinite(
                    BAT_DIAG_STATE.storage.freeGB
                )
            ) {

                const free =
                    convertirNumero(
                        parsed.storageFreeGB
                    );


                if (
                    Number.isFinite(
                        free
                    )
                ) {

                    BAT_DIAG_STATE.storage.freeGB =
                        free;

                }

            }


            /*
             * Porcentaje.
             */

            if (
                !Number.isFinite(
                    BAT_DIAG_STATE.storage.usedPercent
                )
            ) {

                const porcentaje =
                    convertirNumero(
                        parsed.storageUsedPercent
                    );


                if (
                    Number.isFinite(
                        porcentaje
                    )
                ) {

                    BAT_DIAG_STATE.storage.usedPercent =
                        porcentaje;


                    BAT_DIAG_STATE.storage.freePercent =
                        100 -
                        porcentaje;

                }

            }


            /*
             * Si todavía no existe porcentaje,
             * calcularlo.
             */

            if (
                !Number.isFinite(
                    BAT_DIAG_STATE.storage.usedPercent
                ) &&
                Number.isFinite(
                    BAT_DIAG_STATE.storage.usedGB
                ) &&
                Number.isFinite(
                    BAT_DIAG_STATE.storage.totalGB
                ) &&
                BAT_DIAG_STATE.storage.totalGB > 0
            ) {

                BAT_DIAG_STATE.storage.usedPercent =
                    (
                        BAT_DIAG_STATE.storage.usedGB /
                        BAT_DIAG_STATE.storage.totalGB
                    ) *
                    100;


                BAT_DIAG_STATE.storage.freePercent =
                    100 -
                    BAT_DIAG_STATE.storage.usedPercent;

            }


        } catch (error) {

            console.warn(
                "BAT-DIAG: error leyendo batDiagSession.",
                error
            );

        }

    }


    /*
     * -----------------------------------------------------
     * 5. RESPALDO DE FORMATOS ANTIGUOS
     * -----------------------------------------------------
     */

    if (
        !BAT_DIAG_STATE.measurements.length
    ) {

        cargarFormatoAnterior();

    }

}


/* =========================================================
   COMPATIBILIDAD CON FORMATOS ANTERIORES
========================================================= */

function cargarFormatoAnterior() {

    const claves = [

        "BAT_DIAG_DATA",

        "batDiagData",

        "bat_diag_data",

        "csvData",

        "csv_data",

        "datosCSV",

        "datosCsv",

        "pruebaCSV",

        "batDiagCSV"

    ];


    for (
        const clave of claves
    ) {

        const contenido =
            sessionStorage.getItem(
                clave
            );


        if (
            !contenido
        ) {

            continue;

        }


        try {

            const datos =
                JSON.parse(
                    contenido
                );


            if (
                Array.isArray(
                    datos
                )
            ) {

                BAT_DIAG_STATE.measurements =
                    datos;

                break;

            }


            if (
                Array.isArray(
                    datos.measurements
                )
            ) {

                BAT_DIAG_STATE.measurements =
                    datos.measurements;

                break;

            }


            if (
                Array.isArray(
                    datos.rows
                )
            ) {

                BAT_DIAG_STATE.measurements =
                    datos.rows;

                break;

            }


            if (
                Array.isArray(
                    datos.data
                )
            ) {

                BAT_DIAG_STATE.measurements =
                    datos.data;

                break;

            }

        } catch (error) {

            console.warn(
                "BAT-DIAG: error leyendo:",
                clave
            );

        }

    }

}


/* =========================================================
   PROCESAR DATOS
========================================================= */

function procesarDatos() {

    const originales =
        BAT_DIAG_STATE.measurements;


    const procesados = [];


    for (
        let i = 0;
        i < originales.length;
        i++
    ) {

        const registro =
            normalizarRegistro(
                originales[i],
                i
            );


        if (
            registro
        ) {

            procesados.push(
                registro
            );

        }

    }


    /*
     * Orden cronológico.
     */

    procesados.sort(
        function (
            a,
            b
        ) {

            return (
                a.timestamp.getTime() -
                b.timestamp.getTime()
            );

        }
    );


    BAT_DIAG_STATE.measurements =
        procesados;


    BAT_DIAG_STATE.latest =
        procesados.length
            ? procesados[
                procesados.length - 1
            ]
            : null;


    /*
     * Duración real:
     *
     * última fecha/hora
     * -
     * primera fecha/hora
     */

    BAT_DIAG_STATE.durationSeconds =
        calcularDuracionSegundos(
            procesados
        );


    /*
     * Cálculos.
     */

    BAT_DIAG_STATE.calculations =
        calcularIndicadores(
            procesados
        );


    console.log(
        "BAT-DIAG: mediciones normalizadas:",
        procesados.length
    );


    console.log(
        "BAT-DIAG: última medición:",
        BAT_DIAG_STATE.latest
    );


    console.log(
        "BAT-DIAG: duración:",
        BAT_DIAG_STATE.durationSeconds,
        "segundos"
    );

}


/* =========================================================
   NORMALIZAR REGISTRO
========================================================= */

function normalizarRegistro(
    fila,
    indice
) {

    if (
        !fila
    ) {

        return null;

    }


    /*
     * FORMATO REAL:
     *
     * [fecha,
     *  hora,
     *  tempAmbiente,
     *  tempBateria,
     *  humedad,
     *  voltaje,
     *  corriente]
     */

    if (
        Array.isArray(
            fila
        )
    ) {

        return normalizarFilaBATDIAG(
            fila,
            indice
        );

    }


    /*
     * Compatibilidad con objetos.
     */

    return normalizarObjeto(
        fila,
        indice
    );

}


/* =========================================================
   NORMALIZAR FILA BAT-DIAG
========================================================= */

function normalizarFilaBATDIAG(
    fila,
    indice
) {

    if (
        fila.length < 7
    ) {

        return null;

    }


    const timestamp =
        interpretarFechaHora(
            fila[0],
            fila[1]
        );


    if (
        !timestamp
    ) {

        return null;

    }


    const tempAmbiente =
        convertirNumero(
            fila[2]
        );


    const tempBateria =
        convertirNumero(
            fila[3]
        );


    const humedad =
        convertirNumero(
            fila[4]
        );


    const voltaje =
        convertirNumero(
            fila[5]
        );


    const corriente =
        convertirNumero(
            fila[6]
        );


    return {

        timestamp,

        voltaje,

        corriente,

        tempBateria,

        tempAmbiente,

        humedad,

        indice

    };

}


/* =========================================================
   NORMALIZAR OBJETO
========================================================= */

function normalizarObjeto(
    fila,
    indice
) {

    const timestamp =
        obtenerTimestamp(
            fila
        );


    if (
        !timestamp
    ) {

        return null;

    }


    return {

        timestamp,

        voltaje:
            obtenerValor(
                fila,
                [
                    "voltaje",
                    "voltage",
                    "v",
                    "tension",
                    "tensión"
                ]
            ),

        corriente:
            obtenerValor(
                fila,
                [
                    "corriente",
                    "current",
                    "i"
                ]
            ),

        tempBateria:
            obtenerValor(
                fila,
                [
                    "temperatura_bateria",
                    "temperatura bateria",
                    "temp_bateria",
                    "tempbateria",
                    "battery_temperature"
                ]
            ),

        tempAmbiente:
            obtenerValor(
                fila,
                [
                    "temperatura_ambiente",
                    "temperatura ambiente",
                    "temp_ambiente",
                    "tempambiente",
                    "ambient_temperature"
                ]
            ),

        humedad:
            obtenerValor(
                fila,
                [
                    "humedad",
                    "humedad_relativa",
                    "humedad relativa",
                    "humidity",
                    "relative_humidity"
                ]
            ),

        indice

    };

}


/* =========================================================
   OBTENER TIMESTAMP DE OBJETO
========================================================= */

function obtenerTimestamp(
    fila
) {

    const campos = [

        "timestamp",

        "datetime",

        "dateTime",

        "fecha_hora",

        "fecha hora",

        "fechaHora"

    ];


    for (
        const campo of campos
    ) {

        if (
            fila[campo] !== undefined
        ) {

            const fecha =
                interpretarFechaHora(
                    fila[campo],
                    ""
                );


            if (
                fecha
            ) {

                return fecha;

            }

        }

    }


    const fecha =
        fila.fecha ??
        fila.Fecha ??
        fila.date ??
        fila.Date;


    const hora =
        fila.hora ??
        fila.Hora ??
        fila.time ??
        fila.Time;


    if (
        fecha
    ) {

        return interpretarFechaHora(
            fecha,
            hora || ""
        );

    }


    return null;

}


/* =========================================================
   INTERPRETAR FECHA Y HORA
========================================================= */

function interpretarFechaHora(
    fecha,
    hora
) {

    const fechaTexto =
        String(
            fecha ?? ""
        )
            .trim();


    const horaTexto =
        String(
            hora ?? ""
        )
            .trim();


    if (
        !fechaTexto
    ) {

        return null;

    }


    /*
     * YYYY-MM-DD
     */

    let match =
        fechaTexto.match(
            /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/
        );


    if (
        match
    ) {

        const partesHora =
            horaTexto.match(
                /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
            );


        const horas =
            partesHora
                ? Number(
                    partesHora[1]
                )
                : 0;


        const minutos =
            partesHora
                ? Number(
                    partesHora[2]
                )
                : 0;


        const segundos =
            partesHora
                ? Number(
                    partesHora[3] || 0
                )
                : 0;


        const resultado =
            new Date(

                Number(
                    match[1]
                ),

                Number(
                    match[2]
                ) - 1,

                Number(
                    match[3]
                ),

                horas,

                minutos,

                segundos

            );


        return esFechaValida(
            resultado
        )
            ? resultado
            : null;

    }


    /*
     * DD/MM/YYYY
     */

    match =
        fechaTexto.match(
            /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/
        );


    if (
        match
    ) {

        const partesHora =
            horaTexto.match(
                /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
            );


        const horas =
            partesHora
                ? Number(
                    partesHora[1]
                )
                : 0;


        const minutos =
            partesHora
                ? Number(
                    partesHora[2]
                )
                : 0;


        const segundos =
            partesHora
                ? Number(
                    partesHora[3] || 0
                )
                : 0;


        const resultado =
            new Date(

                Number(
                    match[3]
                ),

                Number(
                    match[2]
                ) - 1,

                Number(
                    match[1]
                ),

                horas,

                minutos,

                segundos

            );


        return esFechaValida(
            resultado
        )
            ? resultado
            : null;

    }


    /*
     * Fecha y hora juntas.
     */

    const combinada =
        horaTexto
            ? `${fechaTexto} ${horaTexto}`
            : fechaTexto;


    const fechaNativa =
        new Date(
            combinada
        );


    if (
        esFechaValida(
            fechaNativa
        )
    ) {

        return fechaNativa;

    }


    return null;

}


/* =========================================================
   FECHA VÁLIDA
========================================================= */

function esFechaValida(
    fecha
) {

    return (
        fecha instanceof Date &&
        !isNaN(
            fecha.getTime()
        )
    );

}


/* =========================================================
   OBTENER VALOR DE OBJETO
========================================================= */

function obtenerValor(
    objeto,
    campos
) {

    for (
        const campo of campos
    ) {

        if (
            objeto[campo] !== undefined
        ) {

            const numero =
                convertirNumero(
                    objeto[campo]
                );


            if (
                Number.isFinite(
                    numero
                )
            ) {

                return numero;

            }

        }

    }


    const claves =
        Object.keys(
            objeto
        );


    for (
        const campo of campos
    ) {

        const buscado =
            normalizarTexto(
                campo
            );


        for (
            const clave of claves
        ) {

            if (
                normalizarTexto(
                    clave
                ) === buscado
            ) {

                const numero =
                    convertirNumero(
                        objeto[clave]
                    );


                if (
                    Number.isFinite(
                        numero
                    )
                ) {

                    return numero;

                }

            }

        }

    }


    return NaN;

}


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(
    texto
) {

    return String(
        texto ?? ""
    )
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[\s_\-]+/g,
            ""
        );

}


/* =========================================================
   CONVERTIR NÚMERO
========================================================= */

function convertirNumero(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return NaN;

    }


    if (
        typeof valor === "number"
    ) {

        return Number.isFinite(
            valor
        )
            ? valor
            : NaN;

    }


    let texto =
        String(
            valor
        )
            .trim();


    if (
        !texto
    ) {

        return NaN;

    }


    /*
     * Quitar comillas.
     */

    texto =
        texto.replace(
            /^["']|["']$/g,
            ""
        );


    /*
     * Quitar unidades comunes.
     */

    texto =
        texto.replace(
            /(%|°c|°C|v|V|a|A|gb|GB|wh|Wh|mΩ|mohm)/g,
            ""
        )
            .trim();


    /*
     * Manejar coma decimal.
     */

    if (
        texto.includes(",") &&
        texto.includes(".")
    ) {

        if (
            texto.lastIndexOf(",") >
            texto.lastIndexOf(".")
        ) {

            texto =
                texto
                    .replace(
                        /\./g,
                        ""
                    )
                    .replace(
                        ",",
                        "."
                    );

        } else {

            texto =
                texto.replace(
                    /,/g,
                    ""
                );

        }

    } else if (
        texto.includes(",")
    ) {

        texto =
            texto.replace(
                ",",
                "."
            );

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


/* =========================================================
   CALCULAR DURACIÓN
========================================================= */

function calcularDuracionSegundos(
    datos
) {

    if (
        !datos ||
        datos.length < 2
    ) {

        return 0;

    }


    const primera =
        datos[0];


    const ultima =
        datos[
            datos.length - 1
        ];


    if (
        !primera ||
        !ultima ||
        !primera.timestamp ||
        !ultima.timestamp
    ) {

        return 0;

    }


    const diferencia =
        ultima.timestamp.getTime() -
        primera.timestamp.getTime();


    if (
        !Number.isFinite(
            diferencia
        ) ||
        diferencia < 0
    ) {

        return 0;

    }


    return Math.floor(
        diferencia /
        1000
    );

}


/* =========================================================
   FORMATO DE DURACIÓN
========================================================= */

function formatearDuracion(
    segundos
) {

    if (
        !Number.isFinite(
            segundos
        ) ||
        segundos < 0
    ) {

        return "--";

    }


    const totalSegundos =
        Math.max(
            0,
            Math.floor(
                segundos
            )
        );


    /*
     * Menos de una hora:
     *
     * minutos.
     *
     * Ejemplo:
     * 8 min
     * 42 min
     */

    if (
        totalSegundos < 3600
    ) {

        const minutos =
            totalSegundos /
            60;


        if (
            minutos < 1
        ) {

            return `${totalSegundos} s`;

        }


        return (
            `${Math.round(
                minutos
            )} min`
        );

    }


    /*
     * Una hora o más:
     *
     * horas.
     *
     * Ejemplo:
     * 1 h
     * 1.5 h
     * 2.25 h
     */

    const horas =
        totalSegundos /
        3600;


    let texto =
        horas.toFixed(
            2
        );


    texto =
        texto
            .replace(
                /\.00$/,
                ""
            )
            .replace(
                /(\.\d)0$/,
                "$1"
            );


    return (
        `${texto} h`
    );

}


/* =========================================================
   CÁLCULOS
========================================================= */

function calcularIndicadores(
    datos
) {

    const voltajes =
        obtenerValoresValidos(
            datos,
            "voltaje"
        );


    const corrientes =
        obtenerValoresValidos(
            datos,
            "corriente"
        );


    const temperaturasBateria =
        obtenerValoresValidos(
            datos,
            "tempBateria"
        );


    const temperaturasAmbiente =
        obtenerValoresValidos(
            datos,
            "tempAmbiente"
        );


    const humedades =
        obtenerValoresValidos(
            datos,
            "humedad"
        );


    const primeraV =
        primerValor(
            voltajes
        );


    const ultimaV =
        ultimoValor(
            voltajes
        );


    const primeraT =
        primerValor(
            temperaturasBateria
        );


    const ultimaT =
        ultimoValor(
            temperaturasBateria
        );


    /*
     * -----------------------------------------------------
     * CAÍDA DE VOLTAJE
     *
     * ΔV = V inicial - V final
     * -----------------------------------------------------
     */

    let caidaVoltaje =
        NaN;


    if (
        Number.isFinite(
            primeraV
        ) &&
        Number.isFinite(
            ultimaV
        )
    ) {

        caidaVoltaje =
            primeraV -
            ultimaV;

    }


    /*
     * -----------------------------------------------------
     * INCREMENTO TÉRMICO
     *
     * ΔT = T final - T inicial
     * -----------------------------------------------------
     */

    let incrementoTermico =
        NaN;


    if (
        Number.isFinite(
            primeraT
        ) &&
        Number.isFinite(
            ultimaT
        )
    ) {

        incrementoTermico =
            ultimaT -
            primeraT;

    }


    /*
     * -----------------------------------------------------
     * TASA DE CALENTAMIENTO
     *
     * dT/dt
     *
     * °C/min
     * -----------------------------------------------------
     */

    let tasaCalentamiento =
        NaN;


    const duracionMinutos =
        BAT_DIAG_STATE.durationSeconds /
        60;


    if (
        Number.isFinite(
            incrementoTermico
        ) &&
        duracionMinutos > 0
    ) {

        tasaCalentamiento =
            incrementoTermico /
            duracionMinutos;

    }


    /*
     * -----------------------------------------------------
     * RESISTENCIA INTERNA APROXIMADA
     *
     * R = ΔV / |I|
     *
     * Ω → mΩ
     * -----------------------------------------------------
     */

    let resistenciaInterna =
        NaN;


    const corrientePromedio =
        promedioAbsoluto(
            corrientes
        );


    if (
        Number.isFinite(
            caidaVoltaje
        ) &&
        Number.isFinite(
            corrientePromedio
        ) &&
        corrientePromedio > 0
    ) {

        resistenciaInterna =
            (
                caidaVoltaje /
                corrientePromedio
            ) *
            1000;

    }


    /*
     * -----------------------------------------------------
     * ENERGÍA
     *
     * E = Σ(P × Δt)
     *
     * P = |V × I|
     * -----------------------------------------------------
     */

    const energiaWh =
        calcularEnergia(
            datos
        );


    return {

        voltaje:
            estadistica(
                voltajes
            ),

        corriente:
            estadistica(
                corrientes
            ),

        tempBateria:
            estadistica(
                temperaturasBateria
            ),

        tempAmbiente:
            estadistica(
                temperaturasAmbiente
            ),

        humedad:
            estadistica(
                humedades
            ),

        indicadores: {

            caidaVoltaje,

            resistenciaInterna,

            tiempoDescarga:
                BAT_DIAG_STATE.durationSeconds,

            tiempoDescargaMin:
                BAT_DIAG_STATE.durationSeconds /
                60,

            energiaWh,

            incrementoTermico,

            tasaCalentamiento

        }

    };

}


/* =========================================================
   OBTENER VALORES VÁLIDOS
========================================================= */

function obtenerValoresValidos(
    datos,
    propiedad
) {

    return datos
        .map(
            registro =>
                Number(
                    registro[
                        propiedad
                    ]
                )
        )
        .filter(
            valor =>
                Number.isFinite(
                    valor
                )
        );

}


/* =========================================================
   ESTADÍSTICA
========================================================= */

function estadistica(
    valores
) {

    if (
        !valores.length
    ) {

        return {

            media: NaN,

            mediana: NaN,

            minimo: NaN,

            maximo: NaN,

            std: NaN,

            rms: NaN,

            rango: NaN

        };

    }


    const media =
        valores.reduce(
            (
                suma,
                valor
            ) =>
                suma +
                valor,
            0
        ) /
        valores.length;


    const ordenados =
        [
            ...valores
        ].sort(
            (
                a,
                b
            ) =>
                a -
                b
        );


    let mediana;


    if (
        ordenados.length % 2 === 0
    ) {

        const mitad =
            ordenados.length /
            2;


        mediana =
            (
                ordenados[
                    mitad - 1
                ] +
                ordenados[
                    mitad
                ]
            ) /
            2;

    } else {

        mediana =
            ordenados[
                Math.floor(
                    ordenados.length /
                    2
                )
            ];

    }


    const minimo =
        Math.min(
            ...valores
        );


    const maximo =
        Math.max(
            ...valores
        );


    const varianza =
        valores.reduce(
            (
                suma,
                valor
            ) =>
                suma +
                Math.pow(
                    valor -
                    media,
                    2
                ),
            0
        ) /
        valores.length;


    const std =
        Math.sqrt(
            varianza
        );


    const rms =
        Math.sqrt(

            valores.reduce(
                (
                    suma,
                    valor
                ) =>
                    suma +
                    valor *
                    valor,
                0
            ) /
            valores.length

        );


    return {

        media,

        mediana,

        minimo,

        maximo,

        std,

        rms,

        rango:
            maximo -
            minimo

    };

}


/* =========================================================
   PRIMER VALOR
========================================================= */

function primerValor(
    valores
) {

    return valores.length
        ? valores[0]
        : NaN;

}


/* =========================================================
   ÚLTIMO VALOR
========================================================= */

function ultimoValor(
    valores
) {

    return valores.length
        ? valores[
            valores.length - 1
        ]
        : NaN;

}


/* =========================================================
   PROMEDIO ABSOLUTO
========================================================= */

function promedioAbsoluto(
    valores
) {

    if (
        !valores.length
    ) {

        return NaN;

    }


    return valores.reduce(
        (
            suma,
            valor
        ) =>
            suma +
            Math.abs(
                valor
            ),
        0
    ) /
    valores.length;

}


/* =========================================================
   ENERGÍA
========================================================= */

function calcularEnergia(
    datos
) {

    if (
        datos.length < 2
    ) {

        return NaN;

    }


    let energiaWh =
        0;


    for (
        let i = 1;
        i < datos.length;
        i++
    ) {

        const anterior =
            datos[
                i - 1
            ];


        const actual =
            datos[i];


        const voltaje =
            Number(
                anterior.voltaje
            );


        const corriente =
            Number(
                anterior.corriente
            );


        if (
            !Number.isFinite(
                voltaje
            ) ||
            !Number.isFinite(
                corriente
            )
        ) {

            continue;

        }


        const deltaSegundos =
            (
                actual.timestamp.getTime() -
                anterior.timestamp.getTime()
            ) /
            1000;


        if (
            !Number.isFinite(
                deltaSegundos
            ) ||
            deltaSegundos <= 0
        ) {

            continue;

        }


        /*
         * P = V × I
         */

        const potencia =
            Math.abs(
                voltaje *
                corriente
            );


        /*
         * E = P × t
         *
         * segundos → horas
         */

        energiaWh +=
            potencia *
            (
                deltaSegundos /
                3600
            );

    }


    return energiaWh;

}


/* =========================================================
   ACTUALIZAR INTERFAZ
========================================================= */

function actualizarInterfaz() {

    actualizarEstadoSistema();

    actualizarTiempo();

    actualizarArchivo();

    actualizarAlmacenamiento();

    actualizarVariables();

    actualizarIndicadores();

    actualizarDuracion();

}


/* =========================================================
   ESTADO DEL SISTEMA
========================================================= */

function actualizarEstadoSistema() {

    document
        .querySelectorAll(
            "[data-system-status]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "Datos de prueba cargados";

            }
        );


    const elemento =
        document.getElementById(
            "system-status"
        );


    if (
        elemento
    ) {

        elemento.textContent =
            "Datos de prueba cargados";

    }

}


/* =========================================================
   TIEMPO TRANSCURRIDO
========================================================= */

function actualizarTiempo() {

    const texto =
        formatearDuracion(
            BAT_DIAG_STATE.durationSeconds
        );


    const ids = [

        "elapsed-time",

        "tiempo-transcurrido",

        "elapsedTime",

        "tiempoTranscurrido"

    ];


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    texto;

            }

        }
    );


    document
        .querySelectorAll(
            "[data-elapsed-time]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    texto;

            }
        );

}


/* =========================================================
   ARCHIVO
========================================================= */

function actualizarArchivo() {

    const ids = [

        "current-file",

        "archivo-actual",

        "currentFile",

        "archivoActual"

    ];


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    BAT_DIAG_STATE.fileName;

            }

        }
    );


    document
        .querySelectorAll(
            "[data-current-file]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    BAT_DIAG_STATE.fileName;

            }
        );

}


/* =========================================================
   ALMACENAMIENTO
========================================================= */

function actualizarAlmacenamiento() {

    const storage =
        BAT_DIAG_STATE.storage;


    const nombre =
        storage.name ||
        "--";


    /*
     * -----------------------------------------------------
     * PORCENTAJE
     * -----------------------------------------------------
     *
     * Si por alguna razón no llegó desde
     * carga-csv.js, lo calculamos:
     *
     * usado / total × 100
     */

    let porcentaje =
        convertirNumero(
            storage.usedPercent
        );


    if (
        !Number.isFinite(
            porcentaje
        ) &&
        Number.isFinite(
            storage.usedGB
        ) &&
        Number.isFinite(
            storage.totalGB
        ) &&
        storage.totalGB > 0
    ) {

        porcentaje =
            (
                storage.usedGB /
                storage.totalGB
            ) *
            100;

    }


    /*
     * Limitar entre 0 y 100.
     */

    if (
        Number.isFinite(
            porcentaje
        )
    ) {

        porcentaje =
            Math.max(
                0,
                Math.min(
                    100,
                    porcentaje
                )
            );


        storage.usedPercent =
            porcentaje;


        storage.freePercent =
            100 -
            porcentaje;

    }


    /*
     * -----------------------------------------------------
     * NOMBRE DE LA UNIDAD
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-name]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    nombre;

            }
        );


    const idsNombre = [

        "storage-name",

        "storageName",

        "almacenamiento"

    ];


    idsNombre.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    nombre;

            }

        }
    );


    /*
     * -----------------------------------------------------
     * PORCENTAJE DENTRO DEL CÍRCULO
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-percent]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    Number.isFinite(
                        porcentaje
                    )
                        ? porcentaje.toFixed(
                            1
                        ) +
                          "%"
                        : "--";

            }
        );


    /*
     * -----------------------------------------------------
     * PORCENTAJE OCUPADO
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-used]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    Number.isFinite(
                        porcentaje
                    )
                        ? porcentaje.toFixed(
                            1
                        ) +
                          "% ocupado"
                        : "--";

            }
        );


    /*
     * -----------------------------------------------------
     * ANILLO CIRCULAR
     *
     * El index utiliza:
     *
     * <circle r="48">
     *
     * Circunferencia:
     *
     * C = 2πr
     *
     * C ≈ 301.59
     *
     * El porcentaje determina cuánto
     * del círculo queda visible.
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-ring]"
        )
        .forEach(
            elemento => {

                const radio =
                    Number(
                        elemento.getAttribute(
                            "r"
                        )
                    ) ||
                    48;


                const circunferencia =
                    2 *
                    Math.PI *
                    radio;


                elemento.style.strokeDasharray =
                    `${circunferencia}`;


                if (
                    Number.isFinite(
                        porcentaje
                    )
                ) {

                    const porcentajeLimitado =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                porcentaje
                            )
                        );


                    /*
                     * 0%:
                     * offset = circunferencia
                     *
                     * 100%:
                     * offset = 0
                     */

                    const offset =
                        circunferencia *
                        (
                            1 -
                            porcentajeLimitado /
                            100
                        );


                    elemento.style.strokeDashoffset =
                        offset;

                } else {

                    elemento.style.strokeDashoffset =
                        circunferencia;

                }

            }
        );


    /*
     * -----------------------------------------------------
     * BARRA HORIZONTAL
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-progress]"
        )
        .forEach(
            elemento => {

                elemento.style.width =
                    Number.isFinite(
                        porcentaje
                    )
                        ? porcentaje + "%"
                        : "0%";

            }
        );


    /*
     * -----------------------------------------------------
     * CAPACIDAD
     * -----------------------------------------------------
     */

    let capacidad =
        "--";


    if (
        Number.isFinite(
            storage.usedGB
        ) &&
        Number.isFinite(
            storage.totalGB
        )
    ) {

        capacidad =
            `${storage.usedGB.toFixed(
                1
            )} GB / ` +
            `${storage.totalGB.toFixed(
                1
            )} GB`;

    }


    document
        .querySelectorAll(
            "[data-storage-capacity]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    capacidad;

            }
        );


    /*
     * -----------------------------------------------------
     * ESPACIO LIBRE
     * -----------------------------------------------------
     */

    let porcentajeLibre =
        convertirNumero(
            storage.freePercent
        );


    if (
        !Number.isFinite(
            porcentajeLibre
        ) &&
        Number.isFinite(
            porcentaje
        )
    ) {

        porcentajeLibre =
            100 -
            porcentaje;

    }


    document
        .querySelectorAll(
            "[data-storage-free]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    Number.isFinite(
                        porcentajeLibre
                    )
                        ? porcentajeLibre.toFixed(
                            1
                        ) +
                          "% libre"
                        : "--";

            }
        );


    /*
     * -----------------------------------------------------
     * ATRIBUTO DATA
     * -----------------------------------------------------
     */

    document
        .querySelectorAll(
            "[data-storage-percent]"
        )
        .forEach(
            elemento => {

                if (
                    Number.isFinite(
                        porcentaje
                    )
                ) {

                    elemento.dataset.value =
                        porcentaje;

                }

            }
        );


    /*
     * -----------------------------------------------------
     * CONSOLA
     * -----------------------------------------------------
     */

    console.log(
        "BAT-DIAG almacenamiento:",
        {
            unidad:
                storage.name,

            usadoGB:
                storage.usedGB,

            totalGB:
                storage.totalGB,

            libreGB:
                storage.freeGB,

            porcentajeUsado:
                porcentaje,

            porcentajeLibre:
                porcentajeLibre
        }
    );

}


/* =========================================================
   VARIABLES MEDIDAS
========================================================= */

function actualizarVariables() {

    const latest =
        BAT_DIAG_STATE.latest;


    if (
        !latest
    ) {

        return;

    }


    actualizarValor(
        [
            "voltage-value",
            "voltaje-value",
            "current-voltage",
            "voltage"
        ],
        latest.voltaje,
        "V"
    );


    actualizarValor(
        [
            "current-value",
            "corriente-value",
            "current"
        ],
        latest.corriente,
        "A"
    );


    actualizarValor(
        [
            "battery-temperature-value",
            "battery-temp-value",
            "temp-bateria-value",
            "battery-temperature"
        ],
        latest.tempBateria,
        "°C"
    );


    actualizarValor(
        [
            "ambient-temperature-value",
            "ambient-temp-value",
            "temp-ambiente-value",
            "ambient-temperature"
        ],
        latest.tempAmbiente,
        "°C"
    );


    actualizarValor(
        [
            "humidity-value",
            "humedad-value",
            "humidity"
        ],
        latest.humedad,
        "%"
    );

}


/* =========================================================
   ACTUALIZAR VALOR
========================================================= */

function actualizarValor(
    ids,
    numero,
    unidad
) {

    const texto =
        Number.isFinite(
            numero
        )
            ? formatearValor(
                numero
            ) +
              " " +
              unidad
            : "--";


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    texto;

            }

        }
    );

}


/* =========================================================
   FORMATEAR VALOR
========================================================= */

function formatearValor(
    valor
) {

    if (
        Math.abs(
            valor
        ) >= 100
    ) {

        return valor.toFixed(
            0
        );

    }


    return valor.toFixed(
        2
    );

}


/* =========================================================
   INDICADORES
========================================================= */

function actualizarIndicadores() {

    const indicadores =
        BAT_DIAG_STATE
            .calculations
            .indicadores;


    if (
        !indicadores
    ) {

        return;

    }


    actualizarValor(
        [
            "voltage-drop",
            "caida-voltaje",
            "delta-voltage"
        ],
        indicadores.caidaVoltaje,
        "V"
    );


    actualizarValor(
        [
            "internal-resistance",
            "resistencia-interna"
        ],
        indicadores.resistenciaInterna,
        "mΩ"
    );


    /*
     * TIEMPO DE DESCARGA
     *
     * Usa exactamente la misma
     * duración real del CSV.
     */

    actualizarTiempoIndicador(
        [
            "discharge-time",
            "tiempo-descarga"
        ],
        BAT_DIAG_STATE.durationSeconds
    );


    actualizarValor(
        [
            "energy-delivered",
            "energia-entregada"
        ],
        indicadores.energiaWh,
        "Wh"
    );


    actualizarValor(
        [
            "thermal-increase",
            "incremento-termico"
        ],
        indicadores.incrementoTermico,
        "°C"
    );


    actualizarValor(
        [
            "heating-rate",
            "tasa-calentamiento"
        ],
        indicadores.tasaCalentamiento,
        "°C/min"
    );

}


/* =========================================================
   DURACIÓN EN INTERFAZ
========================================================= */

function actualizarDuracion() {

    const texto =
        formatearDuracion(
            BAT_DIAG_STATE.durationSeconds
        );


    document
        .querySelectorAll(
            "[data-duration-minutes]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    texto;

            }
        );

}


/* =========================================================
   DURACIÓN PARA INDICADORES
========================================================= */

function actualizarTiempoIndicador(
    ids,
    segundos
) {

    const texto =
        formatearDuracion(
            segundos
        );


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (
                elemento
            ) {

                elemento.textContent =
                    texto;

            }

        }
    );

}


/* =========================================================
   PUBLICAR DATOS PARA GRÁFICAS
========================================================= */

function publicarDatos() {

    window.BAT_DIAG_DATA = {

        measurements:
            BAT_DIAG_STATE.measurements,

        latest:
            BAT_DIAG_STATE.latest,

        fileName:
            BAT_DIAG_STATE.fileName,

        calculations:
            BAT_DIAG_STATE.calculations,

        storage:
            BAT_DIAG_STATE.storage

    };


    window.BAT_DIAG_CHART_DATA = {

        measurements:
            BAT_DIAG_STATE.measurements,

        latest:
            BAT_DIAG_STATE.latest,

        variable:
            obtenerVariableSeleccionada()

    };


    console.log(
        "BAT-DIAG_DATA publicado:",
        window.BAT_DIAG_DATA
    );

}


/* =========================================================
   AVISAR A graficas.js
========================================================= */

function notificarGrafica() {

    /*
     * Intento inmediato.
     */

    if (
        window.BAT_DIAG_GRAPH &&
        typeof
        window.BAT_DIAG_GRAPH.update ===
        "function"
    ) {

        console.log(
            "BAT-DIAG: actualizando gráfica..."
        );


        window.BAT_DIAG_GRAPH.update(
            BAT_DIAG_STATE.measurements
        );


        return;

    }


    /*
     * Esperar a que graficas.js
     * termine de cargar.
     */

    let intentos =
        0;


    const intervalo =
        setInterval(
            function () {

                intentos++;


                if (
                    window.BAT_DIAG_GRAPH &&
                    typeof
                    window.BAT_DIAG_GRAPH.update ===
                    "function"
                ) {

                    clearInterval(
                        intervalo
                    );


                    console.log(
                        "BAT-DIAG: gráfica encontrada."
                    );


                    window.BAT_DIAG_GRAPH.update(
                        BAT_DIAG_STATE.measurements
                    );

                }


                if (
                    intentos >= 20
                ) {

                    clearInterval(
                        intervalo
                    );


                    console.warn(
                        "BAT-DIAG: graficas.js no expuso BAT_DIAG_GRAPH.update()."
                    );

                }

            },
            250
        );

}


/* =========================================================
   VARIABLE DE GRÁFICA
========================================================= */

function obtenerVariableSeleccionada() {

    const selector =
        document.getElementById(
            "chart-variable"
        );


    if (
        !selector
    ) {

        return "voltaje";

    }


    return (
        selector.value ||
        "voltaje"
    );

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function obtenerEstadisticas() {

    return {

        voltaje:
            BAT_DIAG_STATE
                .calculations
                .voltaje,

        corriente:
            BAT_DIAG_STATE
                .calculations
                .corriente,

        tempBateria:
            BAT_DIAG_STATE
                .calculations
                .tempBateria,

        tempAmbiente:
            BAT_DIAG_STATE
                .calculations
                .tempAmbiente,

        humedad:
            BAT_DIAG_STATE
                .calculations
                .humedad

    };

}


/* =========================================================
   SIN DATOS
========================================================= */

function mostrarEstadoSinDatos() {

    document
        .querySelectorAll(
            "[data-system-status]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "Esperando datos de prueba";

            }
        );


    document
        .querySelectorAll(
            "[data-current-file]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-elapsed-time]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-name]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-percent]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-used]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-capacity]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-free]"
        )
        .forEach(
            elemento => {

                elemento.textContent =
                    "--";

            }
        );


    document
        .querySelectorAll(
            "[data-storage-ring]"
        )
        .forEach(
            elemento => {

                const radio =
                    Number(
                        elemento.getAttribute(
                            "r"
                        )
                    ) ||
                    48;


                const circunferencia =
                    2 *
                    Math.PI *
                    radio;


                elemento.style.strokeDasharray =
                    `${circunferencia}`;


                elemento.style.strokeDashoffset =
                    circunferencia;

            }
        );

}


/* =========================================================
   API PÚBLICA
========================================================= */

window.BAT_DIAG = {

    /*
     * Obtener mediciones.
     */

    getMeasurements:
        function () {

            return BAT_DIAG_STATE.measurements;

        },


    /*
     * Obtener última medición.
     */

    getLatest:
        function () {

            return BAT_DIAG_STATE.latest;

        },


    /*
     * Obtener cálculos.
     */

    getCalculations:
        function () {

            return BAT_DIAG_STATE.calculations;

        },


    /*
     * Obtener almacenamiento.
     */

    getStorage:
        function () {

            return BAT_DIAG_STATE.storage;

        },


    /*
     * Obtener duración.

     */

    getDuration:
        function () {

            return BAT_DIAG_STATE.durationSeconds;

        },


    /*
     * Obtener estadísticas.

     */

    getStatistics:
        function () {

            return obtenerEstadisticas();

        },


    /*
     * Obtener estado completo.

     */

    getState:
        function () {

            return BAT_DIAG_STATE;

        },


    /*
     * Actualizar manualmente.

     */

    refresh:
        function () {

            cargarDatosPersistidos();

            procesarDatos();

            actualizarInterfaz();

            publicarDatos();

            notificarGrafica();

        }

};


/* =========================================================
   EVENTO DE NUEVOS DATOS
========================================================= */

window.addEventListener(
    "batdiag:data-loaded",
    function () {

        console.log(
            "BAT-DIAG: evento de nuevos datos."
        );


        cargarDatosPersistidos();


        procesarDatos();


        actualizarInterfaz();


        publicarDatos();


        notificarGrafica();

    }
);


/* =========================================================
   CAMBIOS EN STORAGE
========================================================= */

window.addEventListener(
    "storage",
    function () {

        cargarDatosPersistidos();


        procesarDatos();


        actualizarInterfaz();


        publicarDatos();


        notificarGrafica();

    }
);


/* =========================================================
   EXPONER ESTADO
========================================================= */

window.BAT_DIAG_STATE =
    BAT_DIAG_STATE;


/* =========================================================
   FIN DE script.js
========================================================= */