/* =========================================================
   BAT-DIAG
   CARGA, NORMALIZACIÓN Y VALIDACIÓN DE CSV
========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN DEL FORMATO BAT-DIAG
========================================================= */

const EXPECTED_COLUMNS = 7;

const CSV_HEADERS = [
    "Fecha",
    "Hora",
    "Temperatura ambiente",
    "Temperatura batería",
    "Humedad",
    "Voltaje",
    "Corriente"
];


/*
    Estructura esperada:

    0 = Fecha
    1 = Hora
    2 = Temperatura ambiente
    3 = Temperatura batería
    4 = Humedad
    5 = Voltaje
    6 = Corriente
*/


/* =========================================================
   ESTADO
========================================================= */

let selectedFile = null;

let selectedStorage = null;

let csvData = null;

let csvIsValid = false;

let detectedDelimiter = ",";


/* =========================================================
   UNIDAD FICTICIA
========================================================= */

const FAKE_STORAGE = {

    id: "E",

    name: "E: — BAT-DIAG",

    description:
        "Unidad externa de almacenamiento",

    totalGB: 64,

    usedGB: 28,

    freeGB: 36

};


/* =========================================================
   REFERENCIAS DOM
========================================================= */

let csvFileInput;

let fileNameElement;

let fileStatusElement;

let analysisStatusElement;

let rowCountElement;

let columnCountElement;

let startDateElement;

let endDateElement;

let structureStatusElement;

let structureIconElement;

let structureTitleElement;

let structureMessageElement;

let validationElement;

let validationTextElement;

let continueButtonElement;

let storageSelectorElement;

let selectedStorageNameElement;

let selectedStorageDescriptionElement;

let storageModalElement;

let closeStorageModalElement;

let cancelStorageElement;

let refreshStorageElement;

let storageListElement;

let storageDetectionStatusElement;

let storageDetectionTextElement;


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);


function initializePage() {

    cacheDOM();

    resetAnalysis();

    restoreStorageIfPossible();

    setupStorageEvents();

    setupCSVEvents();

    setupDragAndDrop();

}


/* =========================================================
   REFERENCIAS DOM
========================================================= */

function cacheDOM() {

    csvFileInput =
        document.getElementById("csvFile");


    fileNameElement =
        document.getElementById("fileName");


    fileStatusElement =
        document.getElementById("fileStatus");


    analysisStatusElement =
        document.getElementById("analysisStatus");


    rowCountElement =
        document.getElementById("rowCount");


    columnCountElement =
        document.getElementById("columnCount");


    startDateElement =
        document.getElementById("startDate");


    endDateElement =
        document.getElementById("endDate");


    structureStatusElement =
        document.getElementById("structureStatus");


    structureIconElement =
        document.getElementById("structureIcon");


    structureTitleElement =
        document.getElementById("structureTitle");


    structureMessageElement =
        document.getElementById("structureMessage");


    validationElement =
        document.getElementById("validation");


    validationTextElement =
        document.getElementById("validationText");


    continueButtonElement =
        document.getElementById("continueButton");


    storageSelectorElement =
        document.getElementById("storageSelector");


    selectedStorageNameElement =
        document.getElementById("selectedStorageName");


    selectedStorageDescriptionElement =
        document.getElementById(
            "selectedStorageDescription"
        );


    storageModalElement =
        document.getElementById("storageModal");


    closeStorageModalElement =
        document.getElementById(
            "closeStorageModal"
        );


    cancelStorageElement =
        document.getElementById("cancelStorage");


    refreshStorageElement =
        document.getElementById(
            "refreshStorage"
        );


    storageListElement =
        document.getElementById("storageList");


    storageDetectionStatusElement =
        document.getElementById(
            "storageDetectionStatus"
        );


    storageDetectionTextElement =
        document.getElementById(
            "storageDetectionText"
        );

}


/* =========================================================
   RESTAURAR UNIDAD
========================================================= */

function restoreStorageIfPossible() {

    const storedStorage =
        sessionStorage.getItem(
            "storageUnit"
        );


    if (storedStorage) {

        selectedStorage = {

            id: "E",

            name: storedStorage,

            description:
                "Unidad externa de almacenamiento",

            totalGB:
                Number(
                    sessionStorage.getItem(
                        "storageTotalGB"
                    )
                ) || 64,

            usedGB:
                Number(
                    sessionStorage.getItem(
                        "storageUsedGB"
                    )
                ) || 28,

            freeGB:
                Number(
                    sessionStorage.getItem(
                        "storageFreeGB"
                    )
                ) || 36

        };


        updateStorageUI();

        enableCSVSelection();

    } else {

        disableCSVSelection();

    }

}


/* =========================================================
   EVENTOS DE ALMACENAMIENTO
========================================================= */

function setupStorageEvents() {

    if (storageSelectorElement) {

        storageSelectorElement.addEventListener(
            "click",
            openStorageModal
        );

    }


    if (closeStorageModalElement) {

        closeStorageModalElement.addEventListener(
            "click",
            closeStorageModal
        );

    }


    if (cancelStorageElement) {

        cancelStorageElement.addEventListener(
            "click",
            closeStorageModal
        );

    }


    if (refreshStorageElement) {

        refreshStorageElement.addEventListener(
            "click",
            detectStorageUnits
        );

    }


    if (storageModalElement) {

        storageModalElement.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    storageModalElement
                ) {

                    closeStorageModal();

                }

            }
        );

    }

}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openStorageModal() {

    if (!storageModalElement) {

        return;

    }


    storageModalElement.classList.add(
        "active"
    );


    detectStorageUnits();

}


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeStorageModal() {

    if (storageModalElement) {

        storageModalElement.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   DETECTAR UNIDADES
========================================================= */

function detectStorageUnits() {

    if (storageListElement) {

        storageListElement.innerHTML = "";

    }


    if (storageDetectionTextElement) {

        storageDetectionTextElement.textContent =
            "Buscando unidades conectadas...";

    }


    setTimeout(
        function () {

            renderStorageUnits();

        },
        350
    );

}


/* =========================================================
   MOSTRAR UNIDADES
========================================================= */

function renderStorageUnits() {

    if (!storageListElement) {

        return;

    }


    storageListElement.innerHTML = "";


    const usedPercentage =
        (
            FAKE_STORAGE.usedGB /
            FAKE_STORAGE.totalGB
        ) * 100;


    const button =
        document.createElement("button");


    button.type = "button";

    button.className =
        "storage-drive";


    button.innerHTML = `

        <div class="drive-icon">
            💾
        </div>

        <div class="drive-info">

            <strong class="drive-name">
                ${FAKE_STORAGE.name}
            </strong>

            <span class="drive-description">
                ${FAKE_STORAGE.description}
            </span>

            <span class="drive-capacity">
                ${FAKE_STORAGE.usedGB} GB ocupados
                · ${FAKE_STORAGE.freeGB} GB disponibles
                · ${FAKE_STORAGE.totalGB} GB totales
                · ${usedPercentage.toFixed(1)} %
            </span>

        </div>

        <div class="drive-check">
            ✓
        </div>

    `;


    button.addEventListener(
        "click",
        function () {

            selectStorage(
                FAKE_STORAGE,
                button
            );

        }
    );


    storageListElement.appendChild(
        button
    );


    if (storageDetectionTextElement) {

        storageDetectionTextElement.textContent =
            "1 unidad disponible";

    }


    if (storageDetectionStatusElement) {

        storageDetectionStatusElement.classList.add(
            "ready"
        );

    }

}


/* =========================================================
   SELECCIONAR UNIDAD
========================================================= */

function selectStorage(
    storage,
    button
) {

    selectedStorage =
        storage;


    document
        .querySelectorAll(
            ".storage-drive"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "selected"
                );

            }
        );


    if (button) {

        button.classList.add(
            "selected"
        );

    }


    saveStorageData();

    updateStorageUI();

    enableCSVSelection();

    closeStorageModal();

}


/* =========================================================
   GUARDAR DATOS DE ALMACENAMIENTO
========================================================= */

function saveStorageData() {

    if (!selectedStorage) {

        return;

    }


    const percentage =
        (
            selectedStorage.usedGB /
            selectedStorage.totalGB
        ) * 100;


    sessionStorage.setItem(
        "storageUnit",
        selectedStorage.name
    );


    sessionStorage.setItem(
        "storageTotalGB",
        selectedStorage.totalGB
    );


    sessionStorage.setItem(
        "storageUsedGB",
        selectedStorage.usedGB
    );


    sessionStorage.setItem(
        "storageFreeGB",
        selectedStorage.freeGB
    );


    sessionStorage.setItem(
        "storageUsedPercent",
        percentage.toFixed(2)
    );

}


/* =========================================================
   ACTUALIZAR INTERFAZ DE ALMACENAMIENTO
========================================================= */

function updateStorageUI() {

    if (!selectedStorage) {

        return;

    }


    if (selectedStorageNameElement) {

        selectedStorageNameElement.textContent =
            selectedStorage.name;

    }


    if (selectedStorageDescriptionElement) {

        selectedStorageDescriptionElement.textContent =
            `${selectedStorage.usedGB} GB ocupados · ` +
            `${selectedStorage.freeGB} GB disponibles · ` +
            `${selectedStorage.totalGB} GB totales`;

    }


    const storageInfo =
        document.querySelector(
            ".storage-info"
        );


    if (storageInfo) {

        storageInfo.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   HABILITAR SELECCIÓN CSV
========================================================= */

function enableCSVSelection() {

    if (csvFileInput) {

        csvFileInput.disabled = false;

    }


    const dropZone =
        document.querySelector(
            ".drop-zone"
        );


    if (dropZone) {

        dropZone.classList.remove(
            "disabled"
        );

        dropZone.style.pointerEvents =
            "auto";

        dropZone.style.opacity =
            "1";

    }

}


/* =========================================================
   DESHABILITAR SELECCIÓN CSV
========================================================= */

function disableCSVSelection() {

    if (csvFileInput) {

        csvFileInput.disabled = true;

    }


    const dropZone =
        document.querySelector(
            ".drop-zone"
        );


    if (dropZone) {

        dropZone.classList.add(
            "disabled"
        );

        dropZone.style.pointerEvents =
            "none";

        dropZone.style.opacity =
            "0.55";

    }

}


/* =========================================================
   EVENTOS CSV
========================================================= */

function setupCSVEvents() {

    if (csvFileInput) {

        csvFileInput.addEventListener(
            "change",
            function (event) {

                const file =
                    event.target.files[0];


                if (file) {

                    processCSVFile(
                        file
                    );

                }

            }
        );

    }


    if (continueButtonElement) {

        continueButtonElement.addEventListener(
            "click",
            continueToApplication
        );

    }

}


/* =========================================================
   PROCESAR CSV
========================================================= */

async function processCSVFile(file) {

    if (!selectedStorage) {

        alert(
            "Primero debes seleccionar una unidad de almacenamiento."
        );


        if (csvFileInput) {

            csvFileInput.value = "";

        }


        return;

    }


    resetAnalysis();


    selectedFile =
        file;


    const extension =
        getFileExtension(
            file.name
        );


    if (extension !== "csv") {

        showInvalid(
            "Archivo no compatible",
            "El archivo seleccionado debe tener extensión .csv."
        );

        return;

    }


    setAnalyzingState();


    try {

        const text =
            await readTextFile(
                file
            );


        const result =
            analyzeCSV(
                text
            );


        csvData =
            result;


        displayAnalysis(
            result
        );


        if (result.valid) {

            showValid(
                result
            );

        } else {

            showInvalid(
                result.errorTitle,
                result.errorMessage
            );

        }

    } catch (error) {

        console.error(
            "Error procesando CSV:",
            error
        );


        showInvalid(
            "No se pudo leer el archivo",
            "El archivo no pudo ser procesado."
        );

    }

}


/* =========================================================
   EXTENSIÓN
========================================================= */

function getFileExtension(filename) {

    const parts =
        String(filename)
            .split(".");


    return parts
        .pop()
        .toLowerCase();

}


/* =========================================================
   LEER ARCHIVO
========================================================= */

function readTextFile(file) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    resolve(
                        event.target.result
                    );

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Error leyendo archivo"
                        )
                    );

                };


            reader.readAsText(
                file,
                "UTF-8"
            );

        }
    );

}


/* =========================================================
   ESTADO ANALIZANDO
========================================================= */

function setAnalyzingState() {

    if (fileNameElement) {

        fileNameElement.textContent =
            selectedFile.name;

    }


    if (fileStatusElement) {

        fileStatusElement.textContent =
            "Analizando archivo...";

    }


    if (analysisStatusElement) {

        analysisStatusElement.textContent =
            "Analizando...";

    }


    if (structureStatusElement) {

        structureStatusElement.className =
            "structure-status analyzing";

    }


    if (structureIconElement) {

        structureIconElement.textContent =
            "↻";

    }


    if (structureTitleElement) {

        structureTitleElement.textContent =
            "Analizando archivo";

    }


    if (structureMessageElement) {

        structureMessageElement.textContent =
            "Comprobando registros y estructura del CSV...";

    }

}


/* =========================================================
   LIMPIAR CELDA
========================================================= */

function limpiarCeldaCSV(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /^\uFEFF/,
            ""
        )

        .trim()

        /*
         * IMPORTANTE:
         *
         * El CSV que estás usando tiene
         * basura al final de algunas filas:
         *
         * ;;;;;;
         *
         * Esto no forma parte de los datos.
         */

        .replace(
            /;+$/g,
            ""
        )

        .trim();

}


/* =========================================================
   ANALIZAR CSV
========================================================= */

function analyzeCSV(text) {

    text =
        String(text)
            .replace(
                /^\uFEFF/,
                ""
            );


    if (!text.trim()) {

        return invalidResult(
            "Archivo vacío",
            "El CSV no contiene registros."
        );

    }


    /*
     * Detectar el separador real.
     */

    detectedDelimiter =
        detectDelimiter(
            text
        );


    /*
     * Convertir CSV en filas.
     */

    const rawRows =
        parseCSV(
            text,
            detectedDelimiter
        );


    if (!rawRows.length) {

        return invalidResult(
            "Archivo vacío",
            "No se encontraron registros."
        );

    }


    const normalizedRows = [];

    let correctedRows = 0;

    const invalidRows = [];


    rawRows.forEach(
        function (
            row,
            index
        ) {

            /*
             * Ignorar filas vacías.
             */

            if (
                isEmptyRow(row)
            ) {

                return;

            }


            /*
             * Detectar encabezado.
             */

            if (
                index === 0 &&
                looksLikeHeader(row)
            ) {

                return;

            }


            const result =
                normalizeRow(row);


            if (result.valid) {

                normalizedRows.push(
                    result.row
                );


                if (
                    result.corrected
                ) {

                    correctedRows++;

                }

            } else {

                invalidRows.push({

                    number:
                        index + 1,

                    reason:
                        result.reason,

                    original:
                        row

                });

            }

        }
    );


    /*
     * Si no encontramos ninguna fila,
     * el archivo realmente no es compatible.
     */

    if (
        normalizedRows.length === 0
    ) {

        return invalidResult(
            "Estructura no válida",
            "No se encontraron registros compatibles con el formato BAT-DIAG."
        );

    }


    /*
     * Intentar recuperar filas irregulares.
     */

    const recoveredRows = [];


    invalidRows.forEach(
        function (item) {

            const recovery =
                recoverIrregularRow(
                    item.original
                );


            if (recovery.valid) {

                normalizedRows.push(
                    recovery.row
                );


                correctedRows++;


                recoveredRows.push(
                    item.number
                );

            }

        }
    );


    /*
     * Filas que no pudieron recuperarse.
     */

    const unrecoveredRows =
        invalidRows.filter(
            function (item) {

                return !recoveredRows.includes(
                    item.number
                );

            }
        );


    /*
     * Obtener fechas.
     */

    const dates =
        normalizedRows

            .map(
                function (row) {

                    return parseDateTime(
                        row[0],
                        row[1]
                    );

                }
            )

            .filter(
                function (date) {

                    return date !== null;

                }
            );


    dates.sort(
        function (
            a,
            b
        ) {

            return (
                a.getTime() -
                b.getTime()
            );

        }
    );


    const firstDate =
        dates.length
            ? dates[0]
            : null;


    const lastDate =
        dates.length
            ? dates[dates.length - 1]
            : null;


    /*
     * El archivo se considera válido si
     * tenemos registros correctamente
     * normalizados.
     */

    return {

        valid: true,

        headers:
            CSV_HEADERS,

        rows:
            normalizedRows,

        rowCount:
            normalizedRows.length,

        columnCount:
            EXPECTED_COLUMNS,

        delimiter:
            detectedDelimiter,

        firstDate:
            firstDate,

        lastDate:
            lastDate,

        correctedRows:
            correctedRows,

        invalidRows:
            unrecoveredRows,

        hasWarnings:
            unrecoveredRows.length > 0

    };

}


/* =========================================================
   RESULTADO INVÁLIDO
========================================================= */

function invalidResult(
    title,
    message
) {

    return {

        valid: false,

        errorTitle:
            title,

        errorMessage:
            message,

        rowCount:
            0,

        columnCount:
            EXPECTED_COLUMNS,

        rows: [],

        correctedRows:
            0,

        invalidRows: []

    };

}


/* =========================================================
   NORMALIZAR FILA
========================================================= */

function normalizeRow(row) {

    /*
     * Limpiar todas las celdas.
     */

    const cleanRow =
        row.map(
            function (value) {

                return limpiarCeldaCSV(
                    value
                );

            }
        );


    /*
     * =====================================================
     * FORMATO CORRECTO
     *
     * Fecha
     * Hora
     * Temp ambiente
     * Temp batería
     * Humedad
     * Voltaje
     * Corriente
     * =====================================================
     */

    if (
        cleanRow.length === 7
    ) {

        if (
            isValidMeasurementRow(
                cleanRow
            )
        ) {

            return {

                valid: true,

                corrected: false,

                row:
                    cleanRow

            };

        }


        const repaired =
            repairSevenColumnRow(
                cleanRow
            );


        if (repaired) {

            return {

                valid: true,

                corrected: true,

                row:
                    repaired

            };

        }


        return {

            valid: false,

            reason:
                "los valores de medición no son válidos"

        };

    }


    /*
     * =====================================================
     * 6 COLUMNAS
     * =====================================================
     */

    if (
        cleanRow.length === 6
    ) {

        const repaired =
            repairSixColumnRow(
                cleanRow
            );


        if (repaired) {

            return {

                valid: true,

                corrected: true,

                row:
                    repaired

            };

        }

    }


    /*
     * =====================================================
     * MÁS DE 7 COLUMNAS
     * =====================================================
     */

    if (
        cleanRow.length > 7
    ) {

        const repaired =
            repairExtraColumns(
                cleanRow
            );


        if (repaired) {

            return {

                valid: true,

                corrected: true,

                row:
                    repaired

            };

        }

    }


    return {

        valid: false,

        reason:
            `contiene ${cleanRow.length} columnas en lugar de 7`

    };

}


/* =========================================================
   REPARAR 7 COLUMNAS
========================================================= */

function repairSevenColumnRow(row) {

    const repaired =
        row.map(
            function (value) {

                return normalizeNumber(
                    value
                );

            }
        );


    if (
        !isValidDateString(
            repaired[0]
        )
    ) {

        return null;

    }


    if (
        !isValidTimeString(
            repaired[1]
        )
    ) {

        return null;

    }


    for (
        let i = 2;
        i < 7;
        i++
    ) {

        if (
            !isNumeric(
                repaired[i]
            )
        ) {

            return null;

        }

    }


    return repaired;

}


/* =========================================================
   REPARAR 6 COLUMNAS
========================================================= */

function repairSixColumnRow(row) {

    if (
        !isValidDateString(
            row[0]
        )
    ) {

        return null;

    }


    if (
        !isValidTimeString(
            row[1]
        )
    ) {

        return null;

    }


    for (
        let i = 2;
        i <= 4;
        i++
    ) {

        if (
            !isNumeric(
                row[i]
            )
        ) {

            return null;

        }

    }


    const combined =
        row[5];


    const candidates =
        generateNumericSplits(
            combined
        );


    for (
        const candidate of candidates
    ) {

        const voltage =
            candidate.voltage;


        const current =
            candidate.current;


        if (
            voltage < 0 ||
            voltage > 100
        ) {

            continue;

        }


        if (
            current < -1000 ||
            current > 1000
        ) {

            continue;

        }


        const result = [

            row[0],

            row[1],

            row[2],

            row[3],

            row[4],

            formatNumber(
                voltage
            ),

            formatNumber(
                current
            )

        ];


        if (
            isValidMeasurementRow(
                result
            )
        ) {

            return result;

        }

    }


    const alternate =
        splitBySeparators(
            combined
        );


    if (alternate) {

        const result = [

            row[0],

            row[1],

            row[2],

            row[3],

            row[4],

            alternate.voltage,

            alternate.current

        ];


        if (
            isValidMeasurementRow(
                result
            )
        ) {

            return result;

        }

    }


    return null;

}


/* =========================================================
   REPARAR COLUMNAS EXTRA
========================================================= */

function repairExtraColumns(row) {

    /*
     * Si tenemos más de 7 columnas,
     * intentamos limpiar las últimas.
     */

    const cleaned =
        row.map(
            function (value) {

                return limpiarCeldaCSV(
                    value
                );

            }
        );


    /*
     * Si después de limpiar obtenemos 7,
     * ya está solucionado.
     */

    if (
        cleaned.length === 7 &&
        isValidMeasurementRow(cleaned)
    ) {

        return cleaned;

    }


    /*
     * Intentar reconstruir tomando
     * las primeras 5 columnas como
     * información fija.
     */

    if (
        cleaned.length < 7
    ) {

        return null;

    }


    const firstFive =
        cleaned.slice(
            0,
            5
        );


    const remaining =
        cleaned.slice(
            5
        );


    const combined =
        remaining.join("");


    const split =
        splitVoltageCurrent(
            combined
        );


    if (split) {

        const result = [

            ...firstFive,

            split.voltage,

            split.current

        ];


        if (
            result.length === 7 &&
            isValidMeasurementRow(result)
        ) {

            return result;

        }

    }


    return null;

}


/* =========================================================
   RECUPERAR FILA IRREGULAR
========================================================= */

function recoverIrregularRow(row) {

    if (!Array.isArray(row)) {

        return {

            valid: false

        };

    }


    if (row.length === 6) {

        const repaired =
            repairSixColumnRow(
                row
            );


        if (repaired) {

            return {

                valid: true,

                row:
                    repaired

            };

        }

    }


    if (row.length > 7) {

        const repaired =
            repairExtraColumns(
                row
            );


        if (repaired) {

            return {

                valid: true,

                row:
                    repaired

            };

        }

    }


    return {

        valid: false

    };

}


/* =========================================================
   GENERAR POSIBLES DIVISIONES
========================================================= */

function generateNumericSplits(value) {

    const text =
        String(value)
            .trim()
            .replace(
                /,/g,
                "."
            );


    const candidates = [];


    /*
     * Caso:
     *
     * 9.30.5
     *
     * Puede representar:
     *
     * 9.3
     * 0.5
     */

    const special =
        text.match(
            /^(\d+)\.(\d+)\.(\d+)$/
        );


    if (special) {

        const a =
            special[1];

        const b =
            special[2];

        const c =
            special[3];


        addCandidate(
            candidates,
            `${a}.${b.charAt(0)}`,
            `${b.substring(1) || "0"}.${c}`
        );


        addCandidate(
            candidates,
            `${a}.${b}`,
            `0.${c}`
        );


        addCandidate(
            candidates,
            a,
            `${b}.${c}`
        );

    }


    /*
     * Buscar otros separadores.
     */

    const alternate =
        splitBySeparators(
            text
        );


    if (alternate) {

        addCandidate(
            candidates,
            alternate.voltage,
            alternate.current
        );

    }


    return uniqueCandidates(
        candidates
    );

}


/* =========================================================
   SPLIT POR SEPARADORES
========================================================= */

function splitBySeparators(value) {

    const text =
        String(value)
            .trim();


    const match =
        text.match(
            /^([-+]?\d+(?:[.,]\d+)?)[\/|;:\-_]([-+]?\d+(?:[.,]\d+)?)$/
        );


    if (!match) {

        return null;

    }


    return {

        voltage:
            normalizeNumber(
                match[1]
            ),

        current:
            normalizeNumber(
                match[2]
            )

    };

}


/* =========================================================
   SEPARAR VOLTAJE Y CORRIENTE
========================================================= */

function splitVoltageCurrent(value) {

    const candidates =
        generateNumericSplits(
            value
        );


    if (
        !candidates.length
    ) {

        return null;

    }


    const sorted =
        candidates.sort(
            function (
                a,
                b
            ) {

                return (
                    scoreCandidate(b) -
                    scoreCandidate(a)
                );

            }
        );


    return {

        voltage:
            formatNumber(
                sorted[0].voltage
            ),

        current:
            formatNumber(
                sorted[0].current
            )

    };

}


/* =========================================================
   PUNTUACIÓN
========================================================= */

function scoreCandidate(candidate) {

    let score = 0;


    if (
        candidate.voltage >= 5 &&
        candidate.voltage <= 20
    ) {

        score += 100;

    }


    if (
        Math.abs(
            candidate.current
        ) <= 20
    ) {

        score += 50;

    }


    if (
        Number.isFinite(
            candidate.voltage
        )
    ) {

        score += 5;

    }


    if (
        Number.isFinite(
            candidate.current
        )
    ) {

        score += 5;

    }


    return score;

}


/* =========================================================
   CONSTRUIR CANDIDATOS
========================================================= */

function addCandidate(
    array,
    voltage,
    current
) {

    if (
        !isNumeric(voltage) ||
        !isNumeric(current)
    ) {

        return;

    }


    array.push({

        voltage:
            Number(
                voltage
            ),

        current:
            Number(
                current
            )

    });

}


/* =========================================================
   CANDIDATOS ÚNICOS
========================================================= */

function uniqueCandidates(
    candidates
) {

    const map =
        new Map();


    candidates.forEach(
        function (candidate) {

            const key =
                `${candidate.voltage}|${candidate.current}`;


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    candidate
                );

            }

        }
    );


    return [
        ...map.values()
    ];

}


/* =========================================================
   NORMALIZAR NÚMERO
========================================================= */

function normalizeNumber(value) {

    return String(value)
        .trim()
        .replace(
            ",",
            "."
        );

}


/* =========================================================
   FORMATEAR NÚMERO
========================================================= */

function formatNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return String(value);

    }


    return number.toString();

}


/* =========================================================
   ES NUMÉRICO
========================================================= */

function isNumeric(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return false;

    }


    return Number.isFinite(
        Number(
            String(value)
                .replace(
                    ",",
                    "."
                )
        )
    );

}


/* =========================================================
   VALIDAR FILA
========================================================= */

function isValidMeasurementRow(row) {

    if (
        !Array.isArray(row)
    ) {

        return false;

    }


    if (
        row.length !== EXPECTED_COLUMNS
    ) {

        return false;

    }


    if (
        !isValidDateString(
            row[0]
        )
    ) {

        return false;

    }


    if (
        !isValidTimeString(
            row[1]
        )
    ) {

        return false;

    }


    for (
        let i = 2;
        i < EXPECTED_COLUMNS;
        i++
    ) {

        if (
            !isNumeric(
                row[i]
            )
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   VALIDAR FECHA
========================================================= */

function isValidDateString(value) {

    return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/
        .test(
            String(value).trim()
        );

}


/* =========================================================
   VALIDAR HORA
========================================================= */

function isValidTimeString(value) {

    return /^\d{1,2}:\d{2}:\d{2}$/
        .test(
            String(value).trim()
        );

}


/* =========================================================
   FECHA + HORA
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

            Number(dateMatch[1]),

            Number(dateMatch[2]) - 1,

            Number(dateMatch[3]),

            Number(timeMatch[1]),

            Number(timeMatch[2]),

            Number(timeMatch[3])

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
   FILA VACÍA
========================================================= */

function isEmptyRow(row) {

    return (
        !row ||
        row.length === 0 ||
        row.every(
            function (value) {

                return String(
                    value
                ).trim() === "";

            }
        )
    );

}


/* =========================================================
   DETECTAR ENCABEZADO
========================================================= */

function looksLikeHeader(row) {

    const text =
        row
            .join(" ")
            .toLowerCase();


    const keywords = [

        "fecha",
        "hora",
        "voltaje",
        "corriente",
        "temperatura",
        "temp_ambiente",
        "temp_bateria",
        "humedad"

    ];


    let matches = 0;


    keywords.forEach(
        function (keyword) {

            if (
                text.includes(keyword)
            ) {

                matches++;

            }

        }
    );


    return matches >= 2;

}


/* =========================================================
   DETECTAR DELIMITADOR
========================================================= */

function detectDelimiter(text) {

    const lines =
        text
            .split(/\r?\n/)
            .filter(
                function (line) {

                    return line.trim() !== "";

                }
            )
            .slice(0, 20);


    if (!lines.length) {

        return ",";

    }


    /*
     * =====================================================
     * PRIMERA PRIORIDAD:
     * ENCABEZADO BAT-DIAG
     * =====================================================
     */

    const firstLine =
        lines[0]
            .replace(
                /;+$/g,
                ""
            )
            .trim();


    const commaHeader =
        firstLine
            .split(",")
            .map(
                function (value) {

                    return limpiarCeldaCSV(
                        value
                    ).toLowerCase();

                }
            );


    const headerText =
        commaHeader.join(" ");


    const batDiagKeywords = [

        "hora",
        "temp_ambiente",
        "temp_bateria",
        "humedad",
        "voltaje",
        "corriente"

    ];


    let headerMatches = 0;


    batDiagKeywords.forEach(
        function (keyword) {

            if (
                headerText.includes(
                    keyword
                )
            ) {

                headerMatches++;

            }

        }
    );


    /*
     * Si encontramos suficientes campos,
     * la coma es el separador.
     */

    if (
        headerMatches >= 3
    ) {

        return ",";

    }


    /*
     * =====================================================
     * DETECCIÓN GENERAL
     * =====================================================
     */

    const delimiters = [

        ",",
        ";",
        "\t"

    ];


    let best = ",";

    let bestScore = -Infinity;


    delimiters.forEach(
        function (delimiter) {

            const counts =
                lines.map(
                    function (line) {

                        /*
                         * MUY IMPORTANTE:
                         *
                         * No contar los ;;;;;;
                         * finales.
                         */

                        const cleaned =
                            line.replace(
                                /;+$/g,
                                ""
                            );


                        return countDelimiter(
                            cleaned,
                            delimiter
                        );

                    }
                );


            if (!counts.length) {

                return;

            }


            const average =
                counts.reduce(
                    function (
                        a,
                        b
                    ) {

                        return a + b;

                    },
                    0
                ) /
                counts.length;


            /*
             * 6 separadores = 7 columnas.
             */

            const sevenColumnBonus =
                Math.abs(
                    average - 6
                ) < 0.5
                    ? 100
                    : 0;


            const consistency =
                calculateConsistency(
                    counts
                );


            const score =
                sevenColumnBonus +
                consistency +
                average;


            if (
                score > bestScore
            ) {

                bestScore =
                    score;

                best =
                    delimiter;

            }

        }
    );


    return best;

}


/* =========================================================
   CONTAR DELIMITADOR
========================================================= */

function countDelimiter(
    line,
    delimiter
) {

    let count = 0;

    let quoted = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (
            char === '"'
        ) {

            quoted =
                !quoted;

            continue;

        }


        if (
            char === delimiter &&
            !quoted
        ) {

            count++;

        }

    }


    return count;

}


/* =========================================================
   CONSISTENCIA
========================================================= */

function calculateConsistency(values) {

    if (
        values.length < 2
    ) {

        return 0;

    }


    const average =
        values.reduce(
            function (
                a,
                b
            ) {

                return a + b;

            },
            0
        ) /
        values.length;


    const deviation =
        values.reduce(
            function (
                total,
                value
            ) {

                return (
                    total +
                    Math.abs(
                        value -
                        average
                    )
                );

            },
            0
        );


    return Math.max(
        0,
        20 -
        deviation * 5
    );

}


/* =========================================================
   PARSER CSV
========================================================= */

function parseCSV(
    text,
    delimiter
) {

    const rows = [];

    let currentRow = [];

    let currentValue = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


        /*
         * COMILLAS
         */

        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                text[i + 1] === '"'
            ) {

                currentValue += '"';

                i++;

                continue;

            }


            insideQuotes =
                !insideQuotes;

            continue;

        }


        /*
         * SEPARADOR
         */

        if (
            char === delimiter &&
            !insideQuotes
        ) {

            currentRow.push(
                limpiarCeldaCSV(
                    currentValue
                )
            );

            currentValue = "";

            continue;

        }


        /*
         * SALTO DE LÍNEA
         */

        if (
            (
                char === "\n" ||
                char === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                text[i + 1] === "\n"
            ) {

                i++;

            }


            currentRow.push(
                limpiarCeldaCSV(
                    currentValue
                )
            );


            currentValue = "";


            if (
                !isEmptyRow(
                    currentRow
                )
            ) {

                rows.push(
                    currentRow
                );

            }


            currentRow = [];

            continue;

        }


        currentValue += char;

    }


    /*
     * ÚLTIMA FILA
     */

    if (
        currentValue !== "" ||
        currentRow.length > 0
    ) {

        currentRow.push(
            limpiarCeldaCSV(
                currentValue
            ));


        if (
            !isEmptyRow(
                currentRow
            )
        ) {

            rows.push(
                currentRow
            );

        }

    }


    return rows;

}


/* =========================================================
   MOSTRAR ANÁLISIS
========================================================= */

function displayAnalysis(result) {

    if (rowCountElement) {

        rowCountElement.textContent =
            result.rowCount;

    }


    if (columnCountElement) {

        columnCountElement.textContent =
            result.columnCount;

    }


    if (startDateElement) {

        startDateElement.textContent =
            formatDate(
                result.firstDate
            );

    }


    if (endDateElement) {

        endDateElement.textContent =
            formatDate(
                result.lastDate
            );

    }

}


/* =========================================================
   CSV VÁLIDO
========================================================= */

function showValid(result) {

    csvIsValid = true;


    if (analysisStatusElement) {

        analysisStatusElement.textContent =
            "✓ Compatible";

    }


    if (structureStatusElement) {

        structureStatusElement.className =
            "structure-status valid";

    }


    if (structureIconElement) {

        structureIconElement.textContent =
            "✓";

    }


    if (structureTitleElement) {

        structureTitleElement.textContent =
            "Estructura válida";

    }


    if (fileStatusElement) {

        fileStatusElement.textContent =
            "Archivo leído correctamente";

    }


    if (structureMessageElement) {

        if (
            result.correctedRows > 0
        ) {

            structureMessageElement.textContent =
                `Se encontraron ${result.rowCount} registros ` +
                `y ${result.columnCount} variables. ` +
                `Se corrigieron automáticamente ` +
                `${result.correctedRows} registros.`;

        } else {

            structureMessageElement.textContent =
                `Se encontraron ${result.rowCount} registros ` +
                `y ${result.columnCount} variables.`;

        }

    }


    if (validationElement) {

        validationElement.classList.remove(
            "invalid"
        );

        validationElement.classList.add(
            "valid"
        );

    }


    if (validationTextElement) {

        if (
            result.correctedRows > 0
        ) {

            validationTextElement.textContent =
                `CSV validado correctamente. ` +
                `Se normalizaron ${result.correctedRows} registros.`;

        } else {

            validationTextElement.textContent =
                "CSV validado correctamente. Puedes continuar.";

        }

    }


    updateContinueButton();

}


/* =========================================================
   CSV INVÁLIDO
========================================================= */

function showInvalid(
    title,
    message
) {

    csvIsValid = false;


    if (analysisStatusElement) {

        analysisStatusElement.textContent =
            "✕ No compatible";

    }


    if (structureStatusElement) {

        structureStatusElement.className =
            "structure-status invalid";

    }


    if (structureIconElement) {

        structureIconElement.textContent =
            "×";

    }


    if (structureTitleElement) {

        structureTitleElement.textContent =
            title;

    }


    if (structureMessageElement) {

        structureMessageElement.textContent =
            message;

    }


    if (fileStatusElement) {

        fileStatusElement.textContent =
            "El archivo no pudo validarse";

    }


    if (validationElement) {

        validationElement.classList.remove(
            "valid"
        );

        validationElement.classList.add(
            "invalid"
        );

    }


    if (validationTextElement) {

        validationTextElement.textContent =
            "No puedes continuar hasta corregir el archivo.";

    }


    if (continueButtonElement) {

        continueButtonElement.disabled =
            true;

    }

}


/* =========================================================
   REINICIAR ANÁLISIS
========================================================= */

function resetAnalysis() {

    csvIsValid = false;

    csvData = null;

    selectedFile = null;


    if (fileNameElement) {

        fileNameElement.textContent =
            "Ningún archivo seleccionado";

    }


    if (fileStatusElement) {

        fileStatusElement.textContent =
            "Esperando archivo...";

    }


    if (analysisStatusElement) {

        analysisStatusElement.textContent =
            "Esperando archivo";

    }


    if (rowCountElement) {

        rowCountElement.textContent =
            "—";

    }


    if (columnCountElement) {

        columnCountElement.textContent =
            "—";

    }


    if (startDateElement) {

        startDateElement.textContent =
            "—";

    }


    if (endDateElement) {

        endDateElement.textContent =
            "—";

    }


    if (structureStatusElement) {

        structureStatusElement.className =
            "structure-status";

    }


    if (structureIconElement) {

        structureIconElement.textContent =
            "!";

    }


    if (structureTitleElement) {

        structureTitleElement.textContent =
            "Esperando archivo";

    }


    if (structureMessageElement) {

        structureMessageElement.textContent =
            "Selecciona un CSV para analizar su estructura.";

    }


    if (validationElement) {

        validationElement.classList.remove(
            "valid",
            "invalid"
        );

    }


    if (validationTextElement) {

        validationTextElement.textContent =
            "Primero selecciona una unidad de almacenamiento y carga un archivo CSV.";

    }


    if (continueButtonElement) {

        continueButtonElement.disabled =
            true;

    }

}


/* =========================================================
   ACTUALIZAR BOTÓN
========================================================= */

function updateContinueButton() {

    if (!continueButtonElement) {

        return;

    }


    continueButtonElement.disabled =
        !(
            csvIsValid &&
            csvData &&
            selectedStorage
        );

}


/* =========================================================
   CONTINUAR A BAT-DIAG
========================================================= */

function continueToApplication() {

    if (
        !csvIsValid ||
        !csvData ||
        !selectedStorage
    ) {

        return;

    }


    /*
     * Información básica
     */

    sessionStorage.setItem(
        "csvLoaded",
        "true"
    );


    sessionStorage.setItem(
        "csvFileName",
        selectedFile.name
    );


    sessionStorage.setItem(
        "csvRecords",
        String(
            csvData.rowCount
        )
    );


    sessionStorage.setItem(
        "csvColumns",
        String(
            csvData.columnCount
        )
    );


    sessionStorage.setItem(
        "csvStartDate",
        formatDate(
            csvData.firstDate
        )
    );


    sessionStorage.setItem(
        "csvEndDate",
        formatDate(
            csvData.lastDate
        )
    );


    sessionStorage.setItem(
        "csvCorrectedRows",
        String(
            csvData.correctedRows
        )
    );


    sessionStorage.setItem(
        "csvHeaders",
        JSON.stringify(
            csvData.headers
        )
    );


    /*
     * Guardar los datos completos
     * para que script.js pueda utilizarlos.
     */

    try {

        sessionStorage.setItem(
            "csvRows",
            JSON.stringify(
                csvData.rows
            )
        );

    } catch (error) {

        console.error(
            "No se pudieron guardar los registros:",
            error
        );

    }


    /*
     * Guardar sesión completa.
     */

    const session = {

        fileName:
            selectedFile.name,

        storageUnit:
            selectedStorage.name,

        storageTotalGB:
            selectedStorage.totalGB,

        storageUsedGB:
            selectedStorage.usedGB,

        storageFreeGB:
            selectedStorage.freeGB,

        storageUsedPercent:
            (
                selectedStorage.usedGB /
                selectedStorage.totalGB *
                100
            ).toFixed(2),

        records:
            csvData.rowCount,

        columns:
            csvData.columnCount,

        startDate:
            formatDate(
                csvData.firstDate
            ),

        endDate:
            formatDate(
                csvData.lastDate
            ),

        correctedRows:
            csvData.correctedRows

    };


    sessionStorage.setItem(
        "batDiagSession",
        JSON.stringify(
            session
        )
    );


    /*
     * index.html está en la raíz.
     * carga-csv.html está dentro de pages/.
     */

    window.location.href =
        "../index.html";

}


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatDate(date) {

    if (!date) {

        return "No detectada";

    }


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;

}


/* =========================================================
   DRAG & DROP
========================================================= */

function setupDragAndDrop() {

    const dropZone =
        document.querySelector(
            ".drop-zone"
        );


    if (!dropZone) {

        return;

    }


    [
        "dragenter",
        "dragover",
        "dragleave",
        "drop"
    ].forEach(
        function (eventName) {

            dropZone.addEventListener(
                eventName,
                preventDefault,
                false
            );

        }
    );


    [
        "dragenter",
        "dragover"
    ].forEach(
        function (eventName) {

            dropZone.addEventListener(
                eventName,
                function () {

                    if (
                        !selectedStorage
                    ) {

                        return;

                    }


                    dropZone.classList.add(
                        "drag-over"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        function (eventName) {

            dropZone.addEventListener(
                eventName,
                function () {

                    dropZone.classList.remove(
                        "drag-over"
                    );

                }
            );

        }
    );


    /*
     * Click en la zona.
     */

    dropZone.addEventListener(
        "click",
        function (event) {

            if (
                !selectedStorage
            ) {

                event.preventDefault();

                openStorageModal();

            }

        }
    );


    /*
     * Archivo soltado.
     */

    dropZone.addEventListener(
        "drop",
        function (event) {

            if (
                !selectedStorage
            ) {

                alert(
                    "Primero selecciona una unidad de almacenamiento."
                );

                return;

            }


            const files =
                event.dataTransfer.files;


            if (
                files &&
                files.length > 0
            ) {

                processCSVFile(
                    files[0]
                );

            }

        }
    );

}


/* =========================================================
   PREVENIR DEFAULT
========================================================= */

function preventDefault(event) {

    event.preventDefault();

    event.stopPropagation();

}


/* =========================================================
   FIN BAT-DIAG
========================================================= */