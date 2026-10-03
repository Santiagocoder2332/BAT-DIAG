/* =========================================================
   BAT-DIAG
   REGISTROS.JS
   Historial local de pruebas CSV
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const RECORDS_STORAGE_KEY = "batDiagRecords";
const CURRENT_RECORD_KEY = "batDiagCurrentRecord";

const RECORDS_PER_PAGE = 5;


/* =========================================================
   ESTADO
   ========================================================= */

let allRecords = [];

let filteredRecords = [];

let selectedRecord = null;

let currentPage = 1;


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeRecordsPage();

    }
);


function initializeRecordsPage() {

    /*
     * Primero recuperamos la prueba actual de sessionStorage.
     * Esto permite que la primera prueba cargada también pase
     * automáticamente al historial permanente.
     */
    importCurrentSession();

    loadRecords();

    /*
     * Marcar Registros como la página activa
     * en la barra lateral común.
     */
    setActiveSidebarItem();

    createDynamicElements();

    setupFilters();

    setupExportButtons();

    renderPage();

}

/* =========================================================
   ACTIVAR REGISTROS EN LA BARRA LATERAL
   ========================================================= */

function setActiveSidebarItem() {

    /*
     * Buscar todos los elementos del menú común.
     */
    const menuItems =
        document.querySelectorAll(
            ".common-menu-item"
        );


    if (!menuItems.length) {

        return;

    }


    /*
     * Primero quitar cualquier estado activo
     * que pudiera venir desde el HTML.
     */
    menuItems.forEach(
        function (item) {

            item.classList.remove(
                "active"
            );

        }
    );


    /*
     * Buscar específicamente el enlace
     * que apunta a registros.html.
     */
    let registrosItem =
        document.querySelector(
            '.common-menu-item[href="registros.html"]'
        );


    /*
     * Si no lo encuentra por la ruta anterior,
     * buscar por el texto "Registros".
     */
    if (!registrosItem) {

        menuItems.forEach(
            function (item) {

                const text =
                    item.textContent
                        .trim()
                        .toLowerCase();


                if (
                    text === "registros"
                ) {

                    registrosItem =
                        item;

                }

            }
        );

    }


    /*
     * Activar la opción.
     */
    if (registrosItem) {

        registrosItem.classList.add(
            "active"
        );

    }

}

/* =========================================================
   CARGAR REGISTROS
   ========================================================= */

function loadRecords() {

    try {

        const saved =
            localStorage.getItem(
                RECORDS_STORAGE_KEY
            );


        if (!saved) {

            allRecords = [];

            return;

        }


        const parsed =
            JSON.parse(
                saved
            );


        allRecords =
            Array.isArray(parsed)
                ? parsed
                : [];


    } catch (error) {

        console.error(
            "No se pudo cargar el historial:",
            error
        );


        allRecords = [];

    }

}


/* =========================================================
   GUARDAR REGISTROS
   ========================================================= */

function saveRecords() {

    try {

        localStorage.setItem(
            RECORDS_STORAGE_KEY,
            JSON.stringify(
                allRecords
            )
        );


        return true;


    } catch (error) {

        console.error(
            "No se pudo guardar el historial:",
            error
        );


        alert(
            "No se pudo guardar la prueba. " +
            "El almacenamiento del navegador puede estar lleno."
        );


        return false;

    }

}


/* =========================================================
   IMPORTAR SESIÓN ACTUAL
   ========================================================= */

function importCurrentSession() {

    const csvLoaded =
        sessionStorage.getItem(
            "csvLoaded"
        );


    const rowsText =
        sessionStorage.getItem(
            "csvRows"
        );


    const headersText =
        sessionStorage.getItem(
            "csvHeaders"
        );


    const fileName =
        sessionStorage.getItem(
            "csvFileName"
        );


    /*
     * Si no existe una prueba cargada,
     * no hacemos nada.
     */
    if (
        csvLoaded !== "true" ||
        !rowsText ||
        !fileName
    ) {

        return;

    }


    let rows = [];

    let headers = [];


    /*
     * Recuperar filas.
     */
    try {

        rows =
            JSON.parse(
                rowsText
            );

    } catch (error) {

        console.error(
            "No se pudieron recuperar las filas:",
            error
        );


        return;

    }


    /*
     * Recuperar encabezados.
     */
    if (headersText) {

        try {

            headers =
                JSON.parse(
                    headersText
                );

        } catch (error) {

            headers = [];

        }

    }


    if (
        !Array.isArray(rows) ||
        rows.length === 0
    ) {

        return;

    }


    /*
     * Crear ID único.
     */
    const recordId =
        createRecordId(
            fileName,
            rows
        );


    /*
     * Leer información de sesión.
     */
    const session =
        readSessionData();


    /*
     * Crear registro.
     */
    const record = {

        id:
            recordId,

        fileName:
            fileName,

        storageUnit:
            session.storageUnit ||
            "E: — BAT-DIAG",

        storageTotalGB:
            session.storageTotalGB ||
            64,

        storageUsedGB:
            session.storageUsedGB ||
            28,

        storageFreeGB:
            session.storageFreeGB ||
            36,

        storageUsedPercent:
            session.storageUsedPercent ||
            "43.75",

        headers:
            headers.length
                ? headers
                : [
                    "Fecha",
                    "Hora",
                    "Temperatura ambiente",
                    "Temperatura batería",
                    "Humedad",
                    "Voltaje",
                    "Corriente"
                ],

        rows:
            rows,

        rowCount:
            Number(
                session.records
            ) ||
            rows.length,

        columnCount:
            Number(
                session.columns
            ) ||
            7,

        startDate:
            session.startDate ||
            getFormattedDateFromRow(
                rows[0]
            ),

        endDate:
            session.endDate ||
            getFormattedDateFromRow(
                rows[
                    rows.length - 1
                ]
            ),

        correctedRows:
            Number(
                session.correctedRows
            ) ||
            0,

        battery:
            detectBatteryFromFileName(
                fileName
            ),

        testType:
            "Descarga controlada",

        status:
            "Pendiente",

        createdAt:
            new Date().toISOString()

    };


    /*
     * Buscar si ya existe.
     */
    const existingIndex =
        allRecords.findIndex(
            function (item) {

                return (
                    item.id ===
                    recordId
                );

            }
        );


    /*
     * Evitar duplicados.
     */
    if (
        existingIndex >= 0
    ) {

        /*
         * Conservar datos importantes
         * que puedan haber sido calculados
         * posteriormente.
         */
        const oldRecord =
            allRecords[
                existingIndex
            ];


        record.status =
            oldRecord.status ||
            record.status;


        record.createdAt =
            oldRecord.createdAt ||
            record.createdAt;


        record.testType =
            oldRecord.testType ||
            record.testType;


        allRecords[
            existingIndex
        ] = record;


    } else {

        /*
         * Nueva prueba al principio.
         */
        allRecords.unshift(
            record
        );

    }


    /*
     * Guardar prueba seleccionada.
     */
    try {

        localStorage.setItem(
            CURRENT_RECORD_KEY,
            recordId
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar la selección:",
            error
        );

    }


    /*
     * Guardar historial.
     */
    saveRecords();

}


/* =========================================================
   LEER SESIÓN
   ========================================================= */

function readSessionData() {

    const sessionText =
        sessionStorage.getItem(
            "batDiagSession"
        );


    if (sessionText) {

        try {

            return JSON.parse(
                sessionText
            );

        } catch (error) {

            console.warn(
                "Sesión BAT-DIAG inválida.",
                error
            );

        }

    }


    return {

        storageUnit:
            sessionStorage.getItem(
                "storageUnit"
            ),

        storageTotalGB:
            Number(
                sessionStorage.getItem(
                    "storageTotalGB"
                )
            ),

        storageUsedGB:
            Number(
                sessionStorage.getItem(
                    "storageUsedGB"
                )
            ),

        storageFreeGB:
            Number(
                sessionStorage.getItem(
                    "storageFreeGB"
                )
            ),

        storageUsedPercent:
            sessionStorage.getItem(
                "storageUsedPercent"
            ),

        records:
            sessionStorage.getItem(
                "csvRecords"
            ),

        columns:
            sessionStorage.getItem(
                "csvColumns"
            ),

        startDate:
            sessionStorage.getItem(
                "csvStartDate"
            ),

        endDate:
            sessionStorage.getItem(
                "csvEndDate"
            ),

        correctedRows:
            sessionStorage.getItem(
                "csvCorrectedRows"
            )

    };

}


/* =========================================================
   CREAR ID
   ========================================================= */

function createRecordId(
    fileName,
    rows
) {

    const first =
        rows[0]
            ? rows[0].join("|")
            : "";


    const last =
        rows[
            rows.length - 1
        ]
            ? rows[
                rows.length - 1
            ].join("|")
            : "";


    const raw =
        fileName +
        "|" +
        rows.length +
        "|" +
        first +
        "|" +
        last;


    let hash = 0;


    for (
        let i = 0;
        i < raw.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                ) -
                hash +
                raw.charCodeAt(i)
            ) |
            0;

    }


    return (
        "record_" +
        Math.abs(
            hash
        )
    );

}


/* =========================================================
   DETECTAR BATERÍA
   ========================================================= */

function detectBatteryFromFileName(
    fileName
) {

    const match =
        String(
            fileName
        )
            .match(
                /BAT[_\-\s]?(\d+)/i
            );


    if (match) {

        return (
            "BAT_" +
            String(
                match[1]
            ).padStart(
                2,
                "0"
            )
        );

    }


    return "—";

}


/* =========================================================
   FECHA
   ========================================================= */

function getFormattedDateFromRow(
    row
) {

    if (
        !Array.isArray(row) ||
        !row.length
    ) {

        return "No detectada";

    }


    return String(
        row[0] ||
        "No detectada"
    );

}


/* =========================================================
   PREPARAR ELEMENTOS DEL HTML
   ========================================================= */

function createDynamicElements() {

    /*
     * TABLA
     */
    const table =
        document.querySelector(
            ".record-table"
        );


    if (table) {

        const tbody =
            table.querySelector(
                "tbody"
            );


        if (tbody) {

            tbody.id =
                "recordsTableBody";


            tbody.innerHTML = "";

        }

    }


    /*
     * FILTROS
     */
    const filters =
        document.querySelectorAll(
            ".filter-control select"
        );


    if (filters[0]) {

        filters[0].id =
            "batteryFilter";

    }


    if (filters[1]) {

        filters[1].id =
            "typeFilter";

    }


    if (filters[2]) {

        filters[2].id =
            "statusFilter";

    }


    /*
     * BUSCADOR
     */
    const search =
        document.querySelector(
            ".search-box input"
        );


    if (search) {

        search.id =
            "fileSearch";

    }


    /*
     * CONTADOR
     */
    const headingSpan =
        document.querySelector(
            ".table-heading > div:first-child span"
        );


    if (headingSpan) {

        headingSpan.id =
            "recordsFoundText";

    }


    /*
     * PAGINACIÓN
     */
    const paginationText =
        document.querySelector(
            ".table-footer > span"
        );


    if (paginationText) {

        paginationText.id =
            "paginationText";

    }


    /*
     * RESUMEN SUPERIOR
     */
    const summary =
        document.querySelectorAll(
            ".record-summary-card strong"
        );


    if (summary[0]) {

        summary[0].id =
            "summaryTotal";

    }


    if (summary[1]) {

        summary[1].id =
            "summaryCompleted";

    }


    if (summary[2]) {

        summary[2].id =
            "summaryAlerts";

    }


    if (summary[3]) {

        summary[3].id =
            "summaryLast";

    }


    /*
     * PRUEBA SELECCIONADA
     */
    const selected =
        document.querySelector(
            ".selected-record"
        );


    if (selected) {

        selected.id =
            "selectedRecord";

    }

}


/* =========================================================
   FILTROS
   ========================================================= */

function setupFilters() {

    const battery =
        document.getElementById(
            "batteryFilter"
        );


    const type =
        document.getElementById(
            "typeFilter"
        );


    const status =
        document.getElementById(
            "statusFilter"
        );


    const search =
        document.getElementById(
            "fileSearch"
        );


    if (battery) {

        battery.addEventListener(
            "change",
            function () {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    if (type) {

        type.addEventListener(
            "change",
            function () {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    if (status) {

        status.addEventListener(
            "change",
            function () {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    if (search) {

        search.addEventListener(
            "input",
            function () {

                currentPage = 1;

                applyFilters();

            }
        );

    }


    /*
     * Botón FILTRAR
     */
    const filterButton =
        document.querySelector(
            ".filter-btn"
        );


    if (filterButton) {

        filterButton.addEventListener(
            "click",
            function () {

                currentPage = 1;

                applyFilters();

            }
        );

    }

}


/* =========================================================
   APLICAR FILTROS
   ========================================================= */

function applyFilters() {

    const battery =
        getFilterValue(
            "batteryFilter",
            "Todas las baterías"
        );


    const type =
        getFilterValue(
            "typeFilter",
            "Todas las pruebas"
        );


    const status =
        getFilterValue(
            "statusFilter",
            "Todos"
        );


    const searchElement =
        document.getElementById(
            "fileSearch"
        );


    const search =
        searchElement
            ? searchElement.value
                .trim()
                .toLowerCase()
            : "";


    filteredRecords =
        allRecords.filter(
            function (record) {

                const batteryMatch =
                    battery ===
                        "Todas las baterías" ||
                    record.battery ===
                        battery;


                const typeMatch =
                    type ===
                        "Todas las pruebas" ||
                    record.testType ===
                        type;


                const statusMatch =
                    status ===
                        "Todos" ||
                    record.status ===
                        status;


                const searchMatch =
                    !search ||
                    String(
                        record.fileName
                    )
                        .toLowerCase()
                        .includes(
                            search
                        );


                return (
                    batteryMatch &&
                    typeMatch &&
                    statusMatch &&
                    searchMatch
                );

            }
        );


    renderPage();

}


function getFilterValue(
    id,
    fallback
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value
        : fallback;

}


/* =========================================================
   RENDERIZAR PÁGINA
   ========================================================= */

function renderPage() {

    updateSummary();

    updateFilterOptions();


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredRecords.length /
                RECORDS_PER_PAGE
            )
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    const start =
        (
            currentPage - 1
        ) *
        RECORDS_PER_PAGE;


    const end =
        start +
        RECORDS_PER_PAGE;


    const records =
        filteredRecords.slice(
            start,
            end
        );


    renderTable(
        records
    );


    renderPagination(
        totalPages
    );


    updateSelectedRecord();

}


/* =========================================================
   RESUMEN
   ========================================================= */

function updateSummary() {

    const total =
        allRecords.length;


    const completed =
        allRecords.filter(
            function (record) {

                return (
                    record.status ===
                        "Bueno" ||
                    record.status ===
                        "Moderado"
                );

            }
        ).length;


    const alerts =
        allRecords.filter(
            function (record) {

                return (
                    record.status ===
                    "Alerta"
                );

            }
        ).length;


    setText(
        "summaryTotal",
        total
    );


    setText(
        "summaryCompleted",
        completed
    );


    setText(
        "summaryAlerts",
        alerts
    );


    if (allRecords.length) {

        setText(
            "summaryLast",
            formatLastTest(
                allRecords[0]
            )
        );

    } else {

        setText(
            "summaryLast",
            "Sin pruebas"
        );

    }

}


function formatLastTest(
    record
) {

    if (
        !record.createdAt
    ) {

        return (
            record.endDate ||
            "Sin fecha"
        );

    }


    const date =
        new Date(
            record.createdAt
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return (
            record.endDate ||
            "Sin fecha"
        );

    }


    return (
        "Hoy · " +
        date.toLocaleTimeString(
            "es-CO",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )
    );

}


/* =========================================================
   OPCIONES DE FILTROS
   ========================================================= */

function updateFilterOptions() {

    updateSelectOptions(
        "batteryFilter",
        uniqueValues(
            allRecords.map(
                function (record) {

                    return record.battery;

                }
            )
        ),
        "Todas las baterías"
    );


    updateSelectOptions(
        "typeFilter",
        uniqueValues(
            allRecords.map(
                function (record) {

                    return record.testType;

                }
            )
        ),
        "Todas las pruebas"
    );


    updateSelectOptions(
        "statusFilter",
        uniqueValues(
            allRecords.map(
                function (record) {

                    return record.status;

                }
            )
        ),
        "Todos"
    );

}


function updateSelectOptions(
    id,
    values,
    defaultLabel
) {

    const select =
        document.getElementById(
            id
        );


    if (!select) {

        return;

    }


    const previous =
        select.value;


    select.innerHTML = "";


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value =
        defaultLabel;


    defaultOption.textContent =
        defaultLabel;


    select.appendChild(
        defaultOption
    );


    values.forEach(
        function (value) {

            if (
                !value ||
                value === "—"
            ) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;


            option.textContent =
                value;


            select.appendChild(
                option
            );

        }
    );


    const validPrevious =
        Array.from(
            select.options
        ).some(
            function (option) {

                return (
                    option.value ===
                    previous
                );

            }
        );


    select.value =
        validPrevious
            ? previous
            : defaultLabel;

}


function uniqueValues(
    values
) {

    return Array.from(
        new Set(
            values
        )
    );

}


/* =========================================================
   TABLA
   ========================================================= */

function renderTable(
    records
) {

    const tbody =
        document.getElementById(
            "recordsTableBody"
        );


    if (!tbody) {

        return;

    }


    tbody.innerHTML = "";


    if (!records.length) {

        const row =
            document.createElement(
                "tr"
            );


        const cell =
            document.createElement(
                "td"
            );


        cell.colSpan = 8;


        cell.textContent =
            "No hay pruebas registradas.";


        cell.style.textAlign =
            "center";


        cell.style.padding =
            "35px";


        row.appendChild(
            cell
        );


        tbody.appendChild(
            row
        );


        updateFoundText(
            0
        );


        return;

    }


    records.forEach(
        function (record) {

            const tr =
                document.createElement(
                    "tr"
                );


            if (
                selectedRecord &&
                selectedRecord.id ===
                    record.id
            ) {

                tr.classList.add(
                    "selected-row"
                );

            }


            tr.appendChild(
                createDateCell(
                    record
                )
            );


            tr.appendChild(
                createFileCell(
                    record
                )
            );


            tr.appendChild(
                createBatteryCell(
                    record
                )
            );


            tr.appendChild(
                createTextCell(
                    record.testType
                )
            );


            tr.appendChild(
                createTextCell(
                    calculateDuration(
                        record
                    )
                )
            );


            tr.appendChild(
                createTextCell(
                    calculateEnergy(
                        record
                    )
                )
            );


            tr.appendChild(
                createStatusCell(
                    record
                )
            );


            tr.appendChild(
                createActionCell(
                    record
                )
            );


            tbody.appendChild(
                tr
            );

        }
    );


    updateFoundText(
        filteredRecords.length
    );

}


/* =========================================================
   CELDAS
   ========================================================= */

function createDateCell(
    record
) {

    const td =
        document.createElement(
            "td"
        );


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        record.endDate ||
        "—";


    const small =
        document.createElement(
            "small"
        );


    small.textContent =
        getTimeFromRecord(
            record
        );


    td.append(
        strong,
        small
    );


    return td;

}


function createFileCell(
    record
) {

    const td =
        document.createElement(
            "td"
        );


    const span =
        document.createElement(
            "span"
        );


    span.className =
        "file-name";


    span.title =
        record.fileName;


    span.textContent =
        record.fileName;


    td.appendChild(
        span
    );


    return td;

}


function createBatteryCell(
    record
) {

    const td =
        document.createElement(
            "td"
        );


    const span =
        document.createElement(
            "span"
        );


    span.className =
        "battery-tag";


    span.textContent =
        record.battery ||
        "—";


    td.appendChild(
        span
    );


    return td;

}


function createTextCell(
    value
) {

    const td =
        document.createElement(
            "td"
        );


    td.textContent =
        value ||
        "—";


    return td;

}


function createStatusCell(
    record
) {

    const td =
        document.createElement(
            "td"
        );


    const span =
        document.createElement(
            "span"
        );


    span.className =
        "status " +
        getStatusClass(
            record.status
        );


    span.textContent =
        "● " +
        (
            record.status ||
            "Pendiente"
        );


    td.appendChild(
        span
    );


    return td;

}


function getStatusClass(
    status
) {

    switch (
        String(
            status
        ).toLowerCase()
    ) {

        case "bueno":
            return "good";


        case "moderado":
            return "moderate";


        case "alerta":
            return "alert";


        default:
            return "moderate";

    }

}


/* =========================================================
   BOTONES DE ACCIÓN
   ========================================================= */

function createActionCell(
    record
) {

    const td =
        document.createElement(
            "td"
        );


    const container =
        document.createElement(
            "div"
        );


    container.className =
        "action-buttons";


    /*
     * VER
     */
    const viewButton =
        createActionButton(
            "view",
            "👁",
            "Ver prueba"
        );


    viewButton.addEventListener(
        "click",
        function () {

            selectRecord(
                record
            );


            showRecordViewer(
                record
            );

        }
    );


    /*
     * DIAGNÓSTICO
     */
    const diagnosisButton =
        createActionButton(
            "analyze",
            "◈",
            "Abrir diagnóstico"
        );


    diagnosisButton.addEventListener(
        "click",
        function () {

            selectRecord(
                record
            );


            sendToDiagnosis(
                record
            );

        }
    );


    /*
     * EXPORTAR
     */
    const exportButton =
        createActionButton(
            "export",
            "⇩",
            "Exportar CSV"
        );


    exportButton.addEventListener(
        "click",
        function () {

            exportRecordCSV(
                record
            );

        }
    );


    container.append(
        viewButton,
        diagnosisButton,
        exportButton
    );


    td.appendChild(
        container
    );


    return td;

}


function createActionButton(
    className,
    text,
    title
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "action-btn " +
        className;


    button.title =
        title;


    button.textContent =
        text;


    return button;

}


/* =========================================================
   PAGINACIÓN
   ========================================================= */

function renderPagination(
    totalPages
) {

    const pagination =
        document.querySelector(
            ".pagination"
        );


    if (!pagination) {

        return;

    }


    pagination.innerHTML = "";


    const previous =
        createPageButton(
            "‹",
            currentPage > 1
        );


    previous.addEventListener(
        "click",
        function () {

            if (
                currentPage > 1
            ) {

                currentPage--;

                renderPage();

            }

        }
    );


    pagination.appendChild(
        previous
    );


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            createPageButton(
                String(page),
                true
            );


        if (
            page ===
            currentPage
        ) {

            button.classList.add(
                "page-active"
            );

        }


        button.addEventListener(
            "click",
            function () {

                currentPage =
                    page;


                renderPage();

            }
        );


        pagination.appendChild(
            button
        );

    }


    const next =
        createPageButton(
            "›",
            currentPage <
                totalPages
        );


    next.addEventListener(
        "click",
        function () {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                renderPage();

            }

        }
    );


    pagination.appendChild(
        next
    );

}


function createPageButton(
    text,
    enabled
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        text;


    button.disabled =
        !enabled;


    return button;

}


/* =========================================================
   INFORMACIÓN DE PAGINACIÓN
   ========================================================= */

function updateFoundText(
    count
) {

    setText(
        "recordsFoundText",
        count +
        (
            count === 1
                ? " registro encontrado"
                : " registros encontrados"
        )
    );


    if (!filteredRecords.length) {

        setText(
            "paginationText",
            "Sin registros"
        );


        return;

    }


    const start =
        (
            currentPage - 1
        ) *
        RECORDS_PER_PAGE +
        1;


    const end =
        Math.min(
            currentPage *
            RECORDS_PER_PAGE,
            filteredRecords.length
        );


    setText(
        "paginationText",
        `Mostrando ${start}–${end} de ${filteredRecords.length} registros`
    );

}


/* =========================================================
   SELECCIONAR REGISTRO
   ========================================================= */

function selectRecord(
    record
) {

    selectedRecord =
        record;


    try {

        localStorage.setItem(
            CURRENT_RECORD_KEY,
            record.id
        );

    } catch (error) {

        console.warn(
            "No se pudo guardar la selección:",
            error
        );

    }


    renderPage();

}


/* =========================================================
   RESTAURAR SELECCIÓN
   ========================================================= */

function restoreSelectedRecord() {

    if (
        selectedRecord
    ) {

        return;

    }


    const id =
        localStorage.getItem(
            CURRENT_RECORD_KEY
        );


    if (id) {

        selectedRecord =
            allRecords.find(
                function (record) {

                    return (
                        record.id ===
                        id
                    );

                }
            ) ||
            null;

    }


    if (
        !selectedRecord &&
        allRecords.length
    ) {

        selectedRecord =
            allRecords[0];

    }

}


/* =========================================================
   PANEL DE PRUEBA SELECCIONADA
   ========================================================= */

function updateSelectedRecord() {

    restoreSelectedRecord();


    const section =
        document.getElementById(
            "selectedRecord"
        );


    if (
        !section ||
        !selectedRecord
    ) {

        return;

    }


    const record =
        selectedRecord;


    const title =
        section.querySelector(
            ".selected-record-info h3"
        );


    const description =
        section.querySelector(
            ".selected-record-info p"
        );


    const metrics =
        section.querySelectorAll(
            ".selected-metrics strong"
        );


    if (title) {

        title.textContent =
            record.fileName;

    }


    if (description) {

        description.textContent =
            `${record.battery || "Batería no identificada"} · ` +
            `${record.testType} · ` +
            `${record.endDate || "Sin fecha"}`;

    }


    if (metrics[0]) {

        metrics[0].textContent =
            calculateFinalVoltage(
                record
            );

    }


    if (metrics[1]) {

        metrics[1].textContent =
            calculateFinalCurrent(
                record
            );

    }


    if (metrics[2]) {

        metrics[2].textContent =
            calculateEnergy(
                record
            );

    }


    if (metrics[3]) {

        metrics[3].textContent =
            record.status ||
            "Pendiente";

    }


    const buttons =
        section.querySelectorAll(
            ".selected-actions button"
        );


    if (buttons[0]) {

        buttons[0].onclick =
            function () {

                showRecordViewer(
                    record
                );

            };

    }


    if (buttons[1]) {

        buttons[1].onclick =
            function () {

                sendToDiagnosis(
                    record
                );

            };

    }


    if (buttons[2]) {

        buttons[2].onclick =
            function () {

                exportRecordCSV(
                    record
                );

            };

    }

}


/* =========================================================
   FECHA DE UNA FILA
   ========================================================= */

function getRowDate(
    row
) {

    if (
        !Array.isArray(row)
    ) {

        return null;

    }


    const dateText =
        row[0];


    const timeText =
        row[1] ||
        "00:00:00";


    if (!dateText) {

        return null;

    }


    /*
     * DD/MM/YYYY
     */
    const match =
        String(
            dateText
        )
            .match(
                /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
            );


    if (match) {

        const date =
            new Date(
                Number(
                    match[3]
                ),
                Number(
                    match[2]
                ) - 1,
                Number(
                    match[1]
                )
            );


        const time =
            String(
                timeText
            )
                .match(
                    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i
                );


        if (time) {

            let hour =
                Number(
                    time[1]
                );


            if (
                time[4]
            ) {

                const meridiem =
                    time[4]
                        .toUpperCase();


                if (
                    meridiem ===
                    "PM" &&
                    hour < 12
                ) {

                    hour += 12;

                }


                if (
                    meridiem ===
                    "AM" &&
                    hour === 12
                ) {

                    hour = 0;

                }

            }


            date.setHours(
                hour,
                Number(
                    time[2]
                ),
                Number(
                    time[3]
                ) || 0,
                0
            );

        }


        return date;

    }


    /*
     * Intento adicional.
     */
    const native =
        new Date(
            `${dateText} ${timeText}`
        );


    return Number.isNaN(
        native.getTime()
    )
        ? null
        : native;

}


/* =========================================================
   CONVERTIR VALOR A NÚMERO
   ========================================================= */

function numericValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    let text =
        String(
            value
        )
            .trim()
            .replace(
                ",",
                "."
            );


    /*
     * Dejar solamente números,
     * signo y punto decimal.
     */
    text =
        text.replace(
            /[^\d.+-]/g,
            ""
        );


    const number =
        Number(
            text
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* =========================================================
   VOLTAJE FINAL
   ========================================================= */

function calculateFinalVoltage(
    record
) {

    if (
        !record.rows ||
        !record.rows.length
    ) {

        return "—";

    }


    const last =
        record.rows[
            record.rows.length - 1
        ];


    const voltage =
        numericValue(
            last[5]
        );


    return voltage === null
        ? "—"
        : voltage.toFixed(2) +
            " V";

}


/* =========================================================
   CORRIENTE FINAL
   ========================================================= */

function calculateFinalCurrent(
    record
) {

    if (
        !record.rows ||
        !record.rows.length
    ) {

        return "—";

    }


    const last =
        record.rows[
            record.rows.length - 1
        ];


    const current =
        numericValue(
            last[6]
        );


    return current === null
        ? "—"
        : current.toFixed(2) +
            " A";

}


/* =========================================================
   DURACIÓN
   ========================================================= */

function calculateDuration(
    record
) {

    if (
        !record.rows ||
        record.rows.length < 2
    ) {

        return "—";

    }


    const first =
        getRowDate(
            record.rows[0]
        );


    const last =
        getRowDate(
            record.rows[
                record.rows.length - 1
            ]
        );


    if (
        !first ||
        !last
    ) {

        return "—";

    }


    const minutes =
        Math.round(
            (
                last.getTime() -
                first.getTime()
            ) /
            60000
        );


    if (
        minutes < 0
    ) {

        return "—";

    }


    if (
        minutes < 60
    ) {

        return (
            minutes +
            " min"
        );

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    const remaining =
        minutes %
        60;


    return (
        hours +
        " h " +
        remaining +
        " min"
    );

}


/* =========================================================
   ENERGÍA
   ========================================================= */

function calculateEnergy(
    record
) {

    if (
        !record.rows ||
        record.rows.length < 2
    ) {

        return "—";

    }


    let energyWh = 0;


    for (
        let i = 1;
        i < record.rows.length;
        i++
    ) {

        const previous =
            record.rows[
                i - 1
            ];


        const current =
            record.rows[
                i
            ];


        const voltage1 =
            numericValue(
                previous[5]
            );


        const current1 =
            numericValue(
                previous[6]
            );


        const voltage2 =
            numericValue(
                current[5]
            );


        const current2 =
            numericValue(
                current[6]
            );


        if (
            voltage1 === null ||
            current1 === null ||
            voltage2 === null ||
            current2 === null
        ) {

            continue;

        }


        const date1 =
            getRowDate(
                previous
            );


        const date2 =
            getRowDate(
                current
            );


        if (
            !date1 ||
            !date2
        ) {

            continue;

        }


        const seconds =
            (
                date2.getTime() -
                date1.getTime()
            ) /
            1000;


        /*
         * Evitar saltos de tiempo extraños.
         */
        if (
            seconds <= 0 ||
            seconds > 3600
        ) {

            continue;

        }


        const power1 =
            Math.abs(
                voltage1 *
                current1
            );


        const power2 =
            Math.abs(
                voltage2 *
                current2
            );


        const averagePower =
            (
                power1 +
                power2
            ) /
            2;


        energyWh +=
            averagePower *
            (
                seconds /
                3600
            );

    }


    return (
        energyWh.toFixed(1) +
        " Wh"
    );

}


/* =========================================================
   HORA
   ========================================================= */

function getTimeFromRecord(
    record
) {

    if (
        record.rows &&
        record.rows.length
    ) {

        const last =
            record.rows[
                record.rows.length - 1
            ];


        if (
            last[1]
        ) {

            return String(
                last[1]
            );

        }

    }


    return "—";

}


/* =========================================================
   VISUALIZAR PRUEBA
   ========================================================= */

function showRecordViewer(
    record
) {

    removeExistingViewer();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "batDiagRecordViewer";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;
        background:rgba(5,22,48,.62);
        backdrop-filter:blur(3px);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
    `;


    const modal =
        document.createElement(
            "div"
        );


    modal.style.cssText = `
        width:min(1100px,96vw);
        max-height:90vh;
        display:flex;
        flex-direction:column;
        overflow:hidden;
        background:#ffffff;
        border-radius:14px;
        box-shadow:0 25px 70px rgba(0,20,50,.30);
    `;


    /*
     * HEADER
     */
    const header =
        document.createElement(
            "div"
        );


    header.style.cssText = `
        padding:18px 22px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:20px;
        border-bottom:1px solid #e3e9f0;
    `;


    const title =
        document.createElement(
            "div"
        );


    title.innerHTML = `

        <div style="
            color:#159da9;
            font-size:10px;
            font-weight:800;
            letter-spacing:1px;
            margin-bottom:5px;
        ">
            PRUEBA GUARDADA
        </div>

        <strong style="
            color:#172f58;
            font-size:17px;
        ">
            ${escapeHTML(record.fileName)}
        </strong>

        <div style="
            margin-top:4px;
            color:#718096;
            font-size:10px;
        ">
            ${escapeHTML(record.battery || "Batería no identificada")}
            ·
            ${escapeHTML(record.testType)}
            ·
            ${record.rowCount} registros
        </div>

    `;


    const close =
        document.createElement(
            "button"
        );


    close.type =
        "button";


    close.textContent =
        "×";


    close.style.cssText = `
        width:34px;
        height:34px;
        border:none;
        border-radius:7px;
        background:#f1f5f9;
        color:#5f7087;
        font-size:22px;
        cursor:pointer;
    `;


    close.addEventListener(
        "click",
        removeExistingViewer
    );


    header.append(
        title,
        close
    );


    /*
     * INFORMACIÓN
     */
    const info =
        document.createElement(
            "div"
        );


    info.style.cssText = `
        padding:14px 22px;
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:9px;
        border-bottom:1px solid #e3e9f0;
    `;


    const items = [

        [
            "Fecha inicial",
            record.startDate || "—"
        ],

        [
            "Fecha final",
            record.endDate || "—"
        ],

        [
            "Duración",
            calculateDuration(record)
        ],

        [
            "Energía",
            calculateEnergy(record)
        ]

    ];


    items.forEach(
        function (item) {

            const box =
                document.createElement(
                    "div"
                );


            box.style.cssText = `
                padding:10px;
                border-radius:8px;
                background:#f1f5f9;
            `;


            box.innerHTML = `

                <span style="
                    display:block;
                    color:#718096;
                    font-size:9px;
                    margin-bottom:4px;
                ">
                    ${escapeHTML(item[0])}
                </span>

                <strong style="
                    color:#142c50;
                    font-size:13px;
                ">
                    ${escapeHTML(item[1])}
                </strong>

            `;


            info.appendChild(
                box
            );

        }
    );


    /*
     * TABLA
     */
    const tableWrapper =
        document.createElement(
            "div"
        );


    tableWrapper.style.cssText = `
        flex:1;
        min-height:0;
        overflow:auto;
        padding:0 22px 18px;
    `;


    const table =
        document.createElement(
            "table"
        );


    table.style.cssText = `
        width:100%;
        border-collapse:collapse;
        margin-top:14px;
        font-size:10px;
    `;


    const thead =
        document.createElement(
            "thead"
        );


    const headRow =
        document.createElement(
            "tr"
        );


    const headers =
        record.headers ||
        [
            "Fecha",
            "Hora",
            "Temperatura ambiente",
            "Temperatura batería",
            "Humedad",
            "Voltaje",
            "Corriente"
        ];


    headers.forEach(
        function (headerText) {

            const th =
                document.createElement(
                    "th"
                );


            th.textContent =
                headerText;


            th.style.cssText = `
                position:sticky;
                top:0;
                padding:9px 8px;
                text-align:left;
                background:#f3f6f9;
                border-bottom:1px solid #d8e1e9;
                color:#536174;
                font-size:9px;
                white-space:nowrap;
            `;


            headRow.appendChild(
                th
            );

        }
    );


    thead.appendChild(
        headRow
    );


    const tbody =
        document.createElement(
            "tbody"
        );


    /*
     * Para no generar un modal gigantesco,
     * mostramos las últimas 200 filas.
     */
    const rows =
        record.rows.slice(
            Math.max(
                0,
                record.rows.length -
                200
            )
        );


    rows.forEach(
        function (row) {

            const tr =
                document.createElement(
                    "tr"
                );


            row.forEach(
                function (value) {

                    const td =
                        document.createElement(
                            "td"
                        );


                    td.textContent =
                        value ?? "";


                    td.style.cssText = `
                        padding:7px 8px;
                        border-bottom:1px solid #edf0f3;
                        color:#344154;
                        white-space:nowrap;
                    `;


                    tr.appendChild(
                        td
                    );

                }
            );


            tbody.appendChild(
                tr
            );

        }
    );


    table.append(
        thead,
        tbody
    );


    tableWrapper.appendChild(
        table
    );


    /*
     * FOOTER
     */
    const footer =
        document.createElement(
            "div"
        );


    footer.style.cssText = `
        padding:12px 22px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        border-top:1px solid #e3e9f0;
        background:#f8fafc;
        color:#718096;
        font-size:9px;
    `;


    const footerText =
        document.createElement(
            "span"
        );


    footerText.textContent =
        `Mostrando ${rows.length} de ${record.rows.length} registros.`;


    const exportButton =
        document.createElement(
            "button"
        );


    exportButton.type =
        "button";


    exportButton.textContent =
        "⇩ Exportar CSV";


    exportButton.style.cssText = `
        height:34px;
        padding:0 14px;
        border:none;
        border-radius:7px;
        background:#159d42;
        color:#ffffff;
        font-family:inherit;
        font-size:10px;
        font-weight:700;
        cursor:pointer;
    `;


    exportButton.addEventListener(
        "click",
        function () {

            exportRecordCSV(
                record
            );

        }
    );


    footer.append(
        footerText,
        exportButton
    );


    modal.append(
        header,
        info,
        tableWrapper,
        footer
    );


    overlay.appendChild(
        modal
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                overlay
            ) {

                removeExistingViewer();

            }

        }
    );


    document.body.appendChild(
        overlay
    );

}


/* =========================================================
   CERRAR VISUALIZADOR
   ========================================================= */

function removeExistingViewer() {

    const viewer =
        document.getElementById(
            "batDiagRecordViewer"
        );


    if (viewer) {

        viewer.remove();

    }

}


/* =========================================================
   ENVIAR A DIAGNÓSTICO
   ========================================================= */

function sendToDiagnosis(
    record
) {

    if (!record) {

        return;

    }


    try {

        /*
         * Volvemos a colocar la prueba en
         * sessionStorage con el mismo formato
         * que utiliza diagnóstico.
         */
        sessionStorage.setItem(
            "csvLoaded",
            "true"
        );


        sessionStorage.setItem(
            "csvFileName",
            record.fileName
        );


        sessionStorage.setItem(
            "csvRecords",
            String(
                record.rowCount
            )
        );


        sessionStorage.setItem(
            "csvColumns",
            String(
                record.columnCount
            )
        );


        sessionStorage.setItem(
            "csvStartDate",
            record.startDate ||
            "No detectada"
        );


        sessionStorage.setItem(
            "csvEndDate",
            record.endDate ||
            "No detectada"
        );


        sessionStorage.setItem(
            "csvCorrectedRows",
            String(
                record.correctedRows ||
                0
            )
        );


        sessionStorage.setItem(
            "csvHeaders",
            JSON.stringify(
                record.headers ||
                []
            )
        );


        sessionStorage.setItem(
            "csvRows",
            JSON.stringify(
                record.rows
            )
        );


        sessionStorage.setItem(
            "batDiagSelectedRecordId",
            record.id
        );


        /*
         * Como registros.html está dentro de
         * pages/, diagnóstico también está
         * dentro de pages/.
         */
        window.location.href =
            "diagnostico.html";


    } catch (error) {

        console.error(
            "No se pudo preparar la prueba:",
            error
        );


        alert(
            "No fue posible abrir esta prueba en Diagnóstico."
        );

    }

}


/* =========================================================
   EXPORTAR CSV
   ========================================================= */

function exportRecordCSV(
    record
) {

    if (
        !record ||
        !record.rows ||
        !record.rows.length
    ) {

        alert(
            "La prueba no contiene datos."
        );


        return;

    }


    const headers =
        record.headers ||
        [
            "Fecha",
            "Hora",
            "Temperatura ambiente",
            "Temperatura batería",
            "Humedad",
            "Voltaje",
            "Corriente"
        ];


    const lines = [];


    /*
     * Encabezado.
     */
    lines.push(
        headers
            .map(
                csvEscape
            )
            .join(",")
    );


    /*
     * Registros.
     */
    record.rows.forEach(
        function (row) {

            lines.push(
                row
                    .map(
                        csvEscape
                    )
                    .join(",")
            );

        }
    );


    const blob =
        new Blob(
            [
                "\uFEFF" +
                lines.join(
                    "\r\n"
                )
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        createExportName(
            record.fileName
        );


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   ESCAPAR CSV
   ========================================================= */

function csvEscape(
    value
) {

    const text =
        value === null ||
        value === undefined
            ? ""
            : String(
                value
            );


    if (
        /[",\r\n]/.test(
            text
        )
    ) {

        return (
            '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"'
        );

    }


    return text;

}


/* =========================================================
   NOMBRE DE EXPORTACIÓN
   ========================================================= */

function createExportName(
    fileName
) {

    const base =
        String(
            fileName ||
            "prueba.csv"
        )
            .replace(
                /\.csv$/i,
                ""
            );


    return (
        base +
        "_BAT-DIAG.csv"
    );

}


/* =========================================================
   EXPORTAR REPORTE GENERAL
   ========================================================= */

function exportAllRecords() {

    if (
        !allRecords.length
    ) {

        alert(
            "No hay registros para exportar."
        );


        return;

    }


    const report = {

        generatedAt:
            new Date()
                .toISOString(),

        totalTests:
            allRecords.length,

        tests:
            allRecords.map(
                function (record) {

                    return {

                        id:
                            record.id,

                        fileName:
                            record.fileName,

                        battery:
                            record.battery,

                        testType:
                            record.testType,

                        status:
                            record.status,

                        rowCount:
                            record.rowCount,

                        startDate:
                            record.startDate,

                        endDate:
                            record.endDate,

                        duration:
                            calculateDuration(
                                record
                            ),

                        energy:
                            calculateEnergy(
                                record
                            ),

                        finalVoltage:
                            calculateFinalVoltage(
                                record
                            ),

                        finalCurrent:
                            calculateFinalCurrent(
                                record
                            )

                    };

                }
            )

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    report,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "BAT-DIAG_reporte_registros.json";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   CONFIGURAR BOTONES DE EXPORTACIÓN
   ========================================================= */

function setupExportButtons() {

    /*
     * Si existe un botón .export-all-btn
     */
    const exportAllButton =
        document.querySelector(
            ".export-all-btn"
        );


    if (exportAllButton) {

        exportAllButton.addEventListener(
            "click",
            function () {

                exportAllRecords();

            }
        );

    }


    /*
     * Botón principal de exportación.
     */
    const primaryButton =
        document.querySelector(
            ".primary-export-btn"
        );


    if (
        primaryButton &&
        !primaryButton.dataset.bound
    ) {

        primaryButton.dataset.bound =
            "true";


        primaryButton.addEventListener(
            "click",
            function () {

                if (
                    selectedRecord
                ) {

                    exportRecordCSV(
                        selectedRecord
                    );

                } else if (
                    allRecords.length
                ) {

                    exportRecordCSV(
                        allRecords[0]
                    );

                }

            }
        );

    }

}


/* =========================================================
   UTILIDADES
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
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
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   API PARA OTRAS PÁGINAS
   ========================================================= */

window.BATDiagRecords = {

    /*
     * Obtener todos los registros.
     */
    getAll:
        function () {

            return loadRecordsForExternalUse();

        },


    /*
     * Obtener uno por ID.
     */
    getById:
        function (id) {

            loadRecordsForExternalUse();


            return (
                allRecords.find(
                    function (record) {

                        return (
                            record.id ===
                            id
                        );

                    }
                ) ||
                null
            );

        },


    /*
     * Obtener registro seleccionado.
     */
    getSelected:
        function () {

            loadRecordsForExternalUse();


            const id =
                localStorage.getItem(
                    CURRENT_RECORD_KEY
                );


            return (
                allRecords.find(
                    function (record) {

                        return (
                            record.id ===
                            id
                        );

                    }
                ) ||
                null
            );

        }

};


/* =========================================================
   CARGAR PARA API EXTERNA
   ========================================================= */

function loadRecordsForExternalUse() {

    try {

        const saved =
            localStorage.getItem(
                RECORDS_STORAGE_KEY
            );


        allRecords =
            saved
                ? JSON.parse(
                    saved
                )
                : [];


        if (
            !Array.isArray(
                allRecords
            )
        ) {

            allRecords = [];

        }

    } catch (error) {

        allRecords = [];

    }


    return allRecords;

}