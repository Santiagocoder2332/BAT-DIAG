/* ============================================================
   BAT-DIAG
   CONFIGURACION.JS
   ============================================================ */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       CONFIGURACIÓN GENERAL
       ======================================================== */

    const STORAGE_KEY = "BAT_DIAG_CONFIG";

    const categorias = [
        "bateria",
        "pruebas",
        "sensores",
        "comunicacion",
        "almacenamiento",
        "monitoreo",
        "alarmas",
        "reportes",
        "software",
        "operador",
        "seguridad",
        "mantenimiento"
    ];

    const valoresIniciales = {
        bateria: {
            id: "BAT_02",
            serial: "",
            fabricante: "",
            modelo: "",
            tipo: "VRLA",
            voltajeNominal: "12 V",
            capacidadNominal: "12",
            capacidadDiseno: "12",
            observaciones: ""
        },

        pruebas: {
            tipo: "Descarga controlada",
            corrienteObjetivo: "3.5",
            voltajeCorte: "10.5",
            duracionMaxima: "180",
            temperaturaMaxima: "45"
        },

        sensores: {
            voltaje: "696.0",
            corriente: "1.000",
            temperatura: "0.00",
            ambiente: "0.00"
        },

        comunicacion: {
            puerto: "COM3",
            baudrate: "115200",
            protocolo: "Serial",
            dispositivo: "ESP32 BAT-DIAG"
        },

        almacenamiento: {
            formato: "CSV",
            nombreAutomatico: "prueba_FECHA_HORA"
        },

        monitoreo: {
            frecuencia: "1 segundo",
            ventana: "60 segundos"
        },

        alarmas: {
            voltajeMinimo: "10.5",
            voltajeMaximo: "15.0",
            corrienteMaxima: "10.0",
            temperaturaMaxima: "45"
        },

        reportes: {
            formato: "PDF",
            nombre: "BAT_02_FECHA_HORA"
        },

        software: {
            tema: "Claro",
            interfaz: "Normal",
            color: "Azul BAT-DIAG",
            idioma: "Español",
            fecha: "DD/MM/YYYY",
            hora: "24 horas",
            zona: "UTC-05:00 · Bogotá"
        },

        operador: {
            nombre: "",
            codigo: ""
        },

        seguridad: {},

        mantenimiento: {}
    };


    /* ========================================================
       FUNCIONES GENERALES
       ======================================================== */

    function clonar(obj) {
        return JSON.parse(JSON.stringify(obj));
    }


    function cargarConfiguracion() {

        try {

            const guardada = localStorage.getItem(STORAGE_KEY);

            if (!guardada) {
                return clonar(valoresIniciales);
            }

            const datos = JSON.parse(guardada);

            return combinar(
                clonar(valoresIniciales),
                datos
            );

        } catch (error) {

            console.error(
                "Error cargando configuración:",
                error
            );

            return clonar(valoresIniciales);
        }
    }


    function combinar(base, datos) {

        Object.keys(datos || {}).forEach(categoria => {

            if (
                typeof datos[categoria] === "object" &&
                datos[categoria] !== null
            ) {

                base[categoria] = {
                    ...base[categoria],
                    ...datos[categoria]
                };

            } else {

                base[categoria] = datos[categoria];
            }
        });

        return base;
    }


    let configuracion = cargarConfiguracion();


    /* ========================================================
       CATEGORÍAS
       ======================================================== */

    const itemsCategorias = document.querySelectorAll(
        ".configuration-index .index-item"
    );

    const paneles = document.querySelectorAll(
        ".configuration-panels .config-panel"
    );


    function inicializarCategorias() {

        itemsCategorias.forEach((item, index) => {

            item.dataset.categoria =
                categorias[index] || `categoria-${index}`;

            item.addEventListener("click", () => {

                activarCategoria(index);

            });

            item.addEventListener("keydown", event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    activarCategoria(index);
                }
            });

            item.setAttribute("tabindex", "0");
        });


        paneles.forEach((panel, index) => {

            panel.dataset.categoria =
                categorias[index] || `categoria-${index}`;

        });


        let categoriaGuardada =
            localStorage.getItem(
                "BAT_DIAG_CATEGORIA"
            );

        let indice = categorias.indexOf(
            categoriaGuardada
        );


        if (indice < 0) {

            indice = 0;
        }


        activarCategoria(indice, false);
    }


    function activarCategoria(indice, desplazarse = true) {

        if (!itemsCategorias[indice]) {
            return;
        }


        itemsCategorias.forEach(item => {

            item.classList.remove("active");

        });


        itemsCategorias[indice].classList.add("active");


        const categoria =
            categorias[indice];


        localStorage.setItem(
            "BAT_DIAG_CATEGORIA",
            categoria
        );


        if (paneles[indice]) {

            paneles[indice].open = true;


            if (desplazarse) {

                setTimeout(() => {

                    paneles[indice].scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }, 100);
            }
        }
    }


    /* ========================================================
       IDENTIFICAR ELEMENTOS
       ======================================================== */

    function obtenerTexto(elemento) {

        return elemento
            .textContent
            .replace(/\s+/g, " ")
            .trim();
    }


    function obtenerCampoPorEtiqueta(panel, texto) {

        const grupos =
            panel.querySelectorAll(".form-group");


        for (const grupo of grupos) {

            const label =
                grupo.querySelector("label");


            if (!label) {
                continue;
            }


            if (
                obtenerTexto(label)
                    .toLowerCase()
                    .includes(texto.toLowerCase())
            ) {

                return grupo.querySelector(
                    "input, select, textarea"
                );
            }
        }


        return null;
    }


    function obtenerSwitch(panel, texto) {

        const switches =
            panel.querySelectorAll(".switch-row");


        for (const fila of switches) {

            const contenido =
                obtenerTexto(fila);


            if (
                contenido
                    .toLowerCase()
                    .includes(texto.toLowerCase())
            ) {

                return fila.querySelector(
                    "input[type='checkbox']"
                );
            }
        }


        return null;
    }


    function obtenerCheck(panel, texto) {

        const checks =
            panel.querySelectorAll(".check-option");


        for (const check of checks) {

            const contenido =
                obtenerTexto(check);


            if (
                contenido
                    .toLowerCase()
                    .includes(texto.toLowerCase())
            ) {

                return check.querySelector(
                    "input[type='checkbox']"
                );
            }
        }


        return null;
    }


    /* ========================================================
       LEER CAMPOS
       ======================================================== */

    function leerCampo(panel, etiqueta) {

        const campo =
            obtenerCampoPorEtiqueta(
                panel,
                etiqueta
            );


        if (!campo) {
            return "";
        }


        if (campo.type === "checkbox") {
            return campo.checked;
        }


        return campo.value;
    }


    function leerSwitch(panel, texto) {

        const campo =
            obtenerSwitch(
                panel,
                texto
            );


        return campo
            ? campo.checked
            : false;
    }


    function leerCheck(panel, texto) {

        const campo =
            obtenerCheck(
                panel,
                texto
            );


        return campo
            ? campo.checked
            : false;
    }


    /* ========================================================
       ESCRIBIR CAMPOS
       ======================================================== */

    function escribirCampo(
        panel,
        etiqueta,
        valor
    ) {

        const campo =
            obtenerCampoPorEtiqueta(
                panel,
                etiqueta
            );


        if (!campo) {
            return;
        }


        if (campo.type === "checkbox") {

            campo.checked =
                Boolean(valor);

        } else if (
            valor !== undefined &&
            valor !== null
        ) {

            campo.value = valor;
        }
    }


    function escribirSwitch(
        panel,
        texto,
        valor
    ) {

        const campo =
            obtenerSwitch(
                panel,
                texto
            );


        if (campo) {

            campo.checked =
                Boolean(valor);
        }
    }


    function escribirCheck(
        panel,
        texto,
        valor
    ) {

        const campo =
            obtenerCheck(
                panel,
                texto
            );


        if (campo) {

            campo.checked =
                Boolean(valor);
        }
    }


    /* ========================================================
       BATERÍA
       ======================================================== */

    function cargarBateria(panel) {

        if (!panel) return;

        const datos =
            configuracion.bateria;


        escribirCampo(
            panel,
            "ID de batería",
            datos.id
        );


        escribirCampo(
            panel,
            "Número de serie",
            datos.serial
        );


        escribirCampo(
            panel,
            "Fabricante",
            datos.fabricante
        );


        escribirCampo(
            panel,
            "Modelo",
            datos.modelo
        );


        escribirCampo(
            panel,
            "Tipo de batería",
            datos.tipo
        );


        escribirCampo(
            panel,
            "Voltaje nominal",
            datos.voltajeNominal
        );


        escribirCampo(
            panel,
            "Capacidad nominal",
            datos.capacidadNominal
        );


        escribirCampo(
            panel,
            "Capacidad de diseño",
            datos.capacidadDiseno
        );


        escribirCampo(
            panel,
            "Observaciones",
            datos.observaciones
        );
    }


    function guardarBateria(panel) {

        if (!panel) return;

        configuracion.bateria = {

            id: leerCampo(
                panel,
                "ID de batería"
            ),

            serial: leerCampo(
                panel,
                "Número de serie"
            ),

            fabricante: leerCampo(
                panel,
                "Fabricante"
            ),

            modelo: leerCampo(
                panel,
                "Modelo"
            ),

            tipo: leerCampo(
                panel,
                "Tipo de batería"
            ),

            voltajeNominal: leerCampo(
                panel,
                "Voltaje nominal"
            ),

            capacidadNominal: leerCampo(
                panel,
                "Capacidad nominal"
            ),

            capacidadDiseno: leerCampo(
                panel,
                "Capacidad de diseño"
            ),

            observaciones: leerCampo(
                panel,
                "Observaciones"
            )
        };
    }


    /* ========================================================
       PRUEBAS
       ======================================================== */

    function cargarPruebas(panel) {

        if (!panel) return;

        const datos =
            configuracion.pruebas;


        escribirCampo(
            panel,
            "Corriente objetivo",
            datos.corrienteObjetivo
        );


        escribirCampo(
            panel,
            "Voltaje de corte",
            datos.voltajeCorte
        );


        escribirCampo(
            panel,
            "Duración máxima",
            datos.duracionMaxima
        );


        escribirCampo(
            panel,
            "Temperatura máxima",
            datos.temperaturaMaxima
        );


        escribirSwitch(
            panel,
            "Detener",
            true
        );
    }


    function guardarPruebas(panel) {

        if (!panel) return;


        const radio =
            panel.querySelector(
                "input[type='radio']:checked"
            );


        let tipo = "";


        if (radio) {

            const label =
                radio.closest("label");


            if (label) {

                tipo =
                    obtenerTexto(label);
            }
        }


        configuracion.pruebas = {

            tipo,

            corrienteObjetivo:
                leerCampo(
                    panel,
                    "Corriente objetivo"
                ),

            voltajeCorte:
                leerCampo(
                    panel,
                    "Voltaje de corte"
                ),

            duracionMaxima:
                leerCampo(
                    panel,
                    "Duración máxima"
                ),

            temperaturaMaxima:
                leerCampo(
                    panel,
                    "Temperatura máxima"
                )
        };
    }


    /* ========================================================
       SENSORES
       ======================================================== */

    function cargarSensores(panel) {

        if (!panel) return;

        const datos =
            configuracion.sensores;


        const tarjetas =
            panel.querySelectorAll(
                ".sensor-card"
            );


        tarjetas.forEach(tarjeta => {

            const titulo =
                tarjeta.querySelector(
                    ".sensor-card-header strong"
                );


            const input =
                tarjeta.querySelector(
                    ".sensor-row input"
                );


            if (!titulo || !input) {
                return;
            }


            const nombre =
                obtenerTexto(titulo)
                    .toLowerCase();


            if (
                nombre.includes("voltaje")
            ) {

                input.value =
                    datos.voltaje;

            } else if (
                nombre.includes("corriente")
            ) {

                input.value =
                    datos.corriente;

            } else if (
                nombre.includes("temperatura")
            ) {

                input.value =
                    datos.temperatura;

            } else if (
                nombre.includes("ambiente")
            ) {

                input.value =
                    datos.ambiente;
            }
        });
    }


    function guardarSensores(panel) {

        if (!panel) return;


        const datos = {
            voltaje: "",
            corriente: "",
            temperatura: "",
            ambiente: ""
        };


        const tarjetas =
            panel.querySelectorAll(
                ".sensor-card"
            );


        tarjetas.forEach(tarjeta => {

            const titulo =
                tarjeta.querySelector(
                    ".sensor-card-header strong"
                );


            const input =
                tarjeta.querySelector(
                    ".sensor-row input"
                );


            if (!titulo || !input) {
                return;
            }


            const nombre =
                obtenerTexto(titulo)
                    .toLowerCase();


            if (
                nombre.includes("voltaje")
            ) {

                datos.voltaje =
                    input.value;

            } else if (
                nombre.includes("corriente")
            ) {

                datos.corriente =
                    input.value;

            } else if (
                nombre.includes("temperatura")
            ) {

                datos.temperatura =
                    input.value;

            } else if (
                nombre.includes("ambiente")
            ) {

                datos.ambiente =
                    input.value;
            }
        });


        configuracion.sensores =
            datos;
    }


    /* ========================================================
       COMUNICACIÓN
       ======================================================== */

    function cargarComunicacion(panel) {

        if (!panel) return;

        const datos =
            configuracion.comunicacion;


        escribirCampo(
            panel,
            "Puerto",
            datos.puerto
        );


        escribirCampo(
            panel,
            "Baudrate",
            datos.baudrate
        );


        escribirCampo(
            panel,
            "Protocolo",
            datos.protocolo
        );


        escribirCampo(
            panel,
            "Dispositivo",
            datos.dispositivo
        );
    }


    function guardarComunicacion(panel) {

        if (!panel) return;


        configuracion.comunicacion = {

            puerto:
                leerCampo(
                    panel,
                    "Puerto"
                ),

            baudrate:
                leerCampo(
                    panel,
                    "Baudrate"
                ),

            protocolo:
                leerCampo(
                    panel,
                    "Protocolo"
                ),

            dispositivo:
                leerCampo(
                    panel,
                    "Dispositivo"
                )
        };
    }


    /* ========================================================
       ALMACENAMIENTO
       ======================================================== */

    function cargarAlmacenamiento(panel) {

        if (!panel) return;

        const datos =
            configuracion.almacenamiento;


        escribirCampo(
            panel,
            "Formato",
            datos.formato
        );


        escribirCampo(
            panel,
            "Nombre automático",
            datos.nombreAutomatico
        );


        escribirSwitch(
            panel,
            "Guardar datos automáticamente",
            datos.guardarAutomaticamente ?? true
        );


        escribirSwitch(
            panel,
            "Crear archivo por cada prueba",
            datos.archivoPorPrueba ?? true
        );


        escribirSwitch(
            panel,
            "Crear respaldo automático",
            datos.respaldoAutomatico ?? false
        );
    }


    function guardarAlmacenamiento(panel) {

        if (!panel) return;


        configuracion.almacenamiento = {

            formato:
                leerCampo(
                    panel,
                    "Formato"
                ),

            nombreAutomatico:
                leerCampo(
                    panel,
                    "Nombre automático"
                ),

            guardarAutomaticamente:
                leerSwitch(
                    panel,
                    "Guardar datos automáticamente"
                ),

            archivoPorPrueba:
                leerSwitch(
                    panel,
                    "Crear archivo por cada prueba"
                ),

            respaldoAutomatico:
                leerSwitch(
                    panel,
                    "Crear respaldo automático"
                )
        };
    }


    /* ========================================================
       MONITOREO
       ======================================================== */

    function cargarMonitoreo(panel) {

        if (!panel) return;

        const datos =
            configuracion.monitoreo;


        escribirCampo(
            panel,
            "Frecuencia",
            datos.frecuencia
        );


        escribirCampo(
            panel,
            "Ventana",
            datos.ventana
        );
    }


    function guardarMonitoreo(panel) {

        if (!panel) return;


        configuracion.monitoreo = {

            frecuencia:
                leerCampo(
                    panel,
                    "Frecuencia"
                ),

            ventana:
                leerCampo(
                    panel,
                    "Ventana"
                ),

            voltaje:
                leerCheck(
                    panel,
                    "Voltaje"
                ),

            corriente:
                leerCheck(
                    panel,
                    "Corriente"
                ),

            potencia:
                leerCheck(
                    panel,
                    "Potencia"
                ),

            temperaturaBateria:
                leerCheck(
                    panel,
                    "Temperatura batería"
                ),

            temperaturaAmbiente:
                leerCheck(
                    panel,
                    "Temperatura ambiente"
                ),

            humedad:
                leerCheck(
                    panel,
                    "Humedad"
                )
        };
    }


    /* ========================================================
       ALARMAS
       ======================================================== */

    function cargarAlarmas(panel) {

        if (!panel) return;

        const datos =
            configuracion.alarmas;


        escribirCampo(
            panel,
            "Voltaje mínimo",
            datos.voltajeMinimo
        );


        escribirCampo(
            panel,
            "Voltaje máximo",
            datos.voltajeMaximo
        );


        escribirCampo(
            panel,
            "Corriente máxima",
            datos.corrienteMaxima
        );


        escribirCampo(
            panel,
            "Temperatura máxima",
            datos.temperaturaMaxima
        );


        escribirCheck(
            panel,
            "Mostrar alerta",
            datos.mostrarAlerta ?? true
        );


        escribirCheck(
            panel,
            "Emitir sonido",
            datos.emitirSonido ?? true
        );


        escribirCheck(
            panel,
            "Detener prueba",
            datos.detenerPrueba ?? true
        );


        escribirCheck(
            panel,
            "Registrar evento",
            datos.registrarEvento ?? true
        );
    }


    function guardarAlarmas(panel) {

        if (!panel) return;


        configuracion.alarmas = {

            voltajeMinimo:
                leerCampo(
                    panel,
                    "Voltaje mínimo"
                ),

            voltajeMaximo:
                leerCampo(
                    panel,
                    "Voltaje máximo"
                ),

            corrienteMaxima:
                leerCampo(
                    panel,
                    "Corriente máxima"
                ),

            temperaturaMaxima:
                leerCampo(
                    panel,
                    "Temperatura máxima"
                ),

            mostrarAlerta:
                leerCheck(
                    panel,
                    "Mostrar alerta"
                ),

            emitirSonido:
                leerCheck(
                    panel,
                    "Emitir sonido"
                ),

            detenerPrueba:
                leerCheck(
                    panel,
                    "Detener prueba"
                ),

            registrarEvento:
                leerCheck(
                    panel,
                    "Registrar evento"
                )
        };
    }


    /* ========================================================
       REPORTES
       ======================================================== */

    function cargarReportes(panel) {

        if (!panel) return;

        const datos =
            configuracion.reportes;


        escribirCampo(
            panel,
            "Formato",
            datos.formato
        );


        escribirCampo(
            panel,
            "Nombre del reporte",
            datos.nombre
        );
    }


    function guardarReportes(panel) {

        if (!panel) return;


        configuracion.reportes = {

            formato:
                leerCampo(
                    panel,
                    "Formato"
                ),

            nombre:
                leerCampo(
                    panel,
                    "Nombre del reporte"
                ),

            bateria:
                leerCheck(
                    panel,
                    "Información de batería"
                ),

            parametros:
                leerCheck(
                    panel,
                    "Parámetros de prueba"
                ),

            graficas:
                leerCheck(
                    panel,
                    "Gráficas"
                ),

            estadisticas:
                leerCheck(
                    panel,
                    "Estadísticas"
                ),

            diagnostico:
                leerCheck(
                    panel,
                    "Diagnóstico"
                ),

            recomendaciones:
                leerCheck(
                    panel,
                    "Recomendaciones"
                ),

            fechaHora:
                leerCheck(
                    panel,
                    "Fecha y hora"
                ),

            operador:
                leerCheck(
                    panel,
                    "Identificación del operador"
                )
        };
    }


    /* ========================================================
       SOFTWARE
       ======================================================== */

    function cargarSoftware(panel) {

        if (!panel) return;

        const datos =
            configuracion.software;


        escribirCampo(
            panel,
            "Tema",
            datos.tema
        );


        escribirCampo(
            panel,
            "Tamaño de interfaz",
            datos.interfaz
        );


        escribirCampo(
            panel,
            "Color de interfaz",
            datos.color
        );


        escribirCampo(
            panel,
            "Idioma",
            datos.idioma
        );


        escribirCampo(
            panel,
            "Formato de fecha",
            datos.fecha
        );


        escribirCampo(
            panel,
            "Formato de hora",
            datos.hora
        );


        escribirCampo(
            panel,
            "Zona horaria",
            datos.zona
        );
    }


    function guardarSoftware(panel) {

        if (!panel) return;


        configuracion.software = {

            tema:
                leerCampo(
                    panel,
                    "Tema"
                ),

            interfaz:
                leerCampo(
                    panel,
                    "Tamaño de interfaz"
                ),

            color:
                leerCampo(
                    panel,
                    "Color de interfaz"
                ),

            idioma:
                leerCampo(
                    panel,
                    "Idioma"
                ),

            fecha:
                leerCampo(
                    panel,
                    "Formato de fecha"
                ),

            hora:
                leerCampo(
                    panel,
                    "Formato de hora"
                ),

            zona:
                leerCampo(
                    panel,
                    "Zona horaria"
                ),

            notificaciones:
                leerSwitch(
                    panel,
                    "Notificaciones del sistema"
                ),

            alertasPrueba:
                leerSwitch(
                    panel,
                    "Alertas de prueba"
                ),

            avisosConexion:
                leerSwitch(
                    panel,
                    "Avisos de conexión"
                ),

            avisosAlmacenamiento:
                leerSwitch(
                    panel,
                    "Avisos de almacenamiento"
                ),

            sonido:
                leerSwitch(
                    panel,
                    "Sonido de alerta"
                )
        };
    }


    /* ========================================================
       OPERADOR
       ======================================================== */

    function cargarOperador(panel) {

        if (!panel) return;

        const datos =
            configuracion.operador;


        escribirCampo(
            panel,
            "Nombre del operador",
            datos.nombre
        );


        escribirCampo(
            panel,
            "Código de operador",
            datos.codigo
        );


        escribirSwitch(
            panel,
            "Registrar operador en las pruebas",
            datos.registrarPruebas ?? true
        );


        escribirSwitch(
            panel,
            "Registrar operador en reportes",
            datos.registrarReportes ?? true
        );
    }


    function guardarOperador(panel) {

        if (!panel) return;


        configuracion.operador = {

            nombre:
                leerCampo(
                    panel,
                    "Nombre del operador"
                ),

            codigo:
                leerCampo(
                    panel,
                    "Código de operador"
                ),

            registrarPruebas:
                leerSwitch(
                    panel,
                    "Registrar operador en las pruebas"
                ),

            registrarReportes:
                leerSwitch(
                    panel,
                    "Registrar operador en reportes"
                )
        };
    }


    /* ========================================================
       SEGURIDAD
       ======================================================== */

    function cargarSeguridad(panel) {

        if (!panel) return;

        const datos =
            configuracion.seguridad;


        escribirSwitch(
            panel,
            "Solicitar contraseña al iniciar",
            datos.solicitarPassword ?? false
        );


        escribirSwitch(
            panel,
            "Bloquear configuración durante una prueba",
            datos.bloquearConfiguracion ?? true
        );


        escribirSwitch(
            panel,
            "Confirmar acciones críticas",
            datos.confirmarAcciones ?? true
        );


        escribirSwitch(
            panel,
            "Registrar cambios de configuración",
            datos.registrarCambios ?? true
        );
    }


    function guardarSeguridad(panel) {

        if (!panel) return;


        configuracion.seguridad = {

            solicitarPassword:
                leerSwitch(
                    panel,
                    "Solicitar contraseña al iniciar"
                ),

            bloquearConfiguracion:
                leerSwitch(
                    panel,
                    "Bloquear configuración durante una prueba"
                ),

            confirmarAcciones:
                leerSwitch(
                    panel,
                    "Confirmar acciones críticas"
                ),

            registrarCambios:
                leerSwitch(
                    panel,
                    "Registrar cambios de configuración"
                )
        };
    }


    /* ========================================================
       CARGAR TODA LA CONFIGURACIÓN
       ======================================================== */

    function cargarFormulario() {

        cargarBateria(paneles[0]);
        cargarPruebas(paneles[1]);
        cargarSensores(paneles[2]);
        cargarComunicacion(paneles[3]);
        cargarAlmacenamiento(paneles[4]);
        cargarMonitoreo(paneles[5]);
        cargarAlarmas(paneles[6]);
        cargarReportes(paneles[7]);
        cargarSoftware(paneles[8]);
        cargarOperador(paneles[9]);
        cargarSeguridad(paneles[10]);
    }


    /* ========================================================
       LEER TODA LA CONFIGURACIÓN
       ======================================================== */

    function leerFormulario() {

        guardarBateria(paneles[0]);
        guardarPruebas(paneles[1]);
        guardarSensores(paneles[2]);
        guardarComunicacion(paneles[3]);
        guardarAlmacenamiento(paneles[4]);
        guardarMonitoreo(paneles[5]);
        guardarAlarmas(paneles[6]);
        guardarReportes(paneles[7]);
        guardarSoftware(paneles[8]);
        guardarOperador(paneles[9]);
        guardarSeguridad(paneles[10]);
    }


    /* ========================================================
       VALIDACIÓN
       ======================================================== */

    function validar() {

        const errores = [];


        if (
            !configuracion.bateria.id ||
            configuracion.bateria.id.trim() === ""
        ) {

            errores.push(
                "Debe ingresar el ID de batería."
            );
        }


        if (
            Number(
                configuracion.bateria.capacidadNominal
            ) <= 0
        ) {

            errores.push(
                "La capacidad nominal debe ser mayor que 0."
            );
        }


        if (
            Number(
                configuracion.bateria.capacidadDiseno
            ) <= 0
        ) {

            errores.push(
                "La capacidad de diseño debe ser mayor que 0."
            );
        }


        if (
            Number(
                configuracion.alarmas.voltajeMinimo
            ) >= Number(
                configuracion.alarmas.voltajeMaximo
            )
        ) {

            errores.push(
                "El voltaje mínimo debe ser menor que el máximo."
            );
        }


        if (
            Number(
                configuracion.alarmas.corrienteMaxima
            ) <= 0
        ) {

            errores.push(
                "La corriente máxima debe ser mayor que 0."
            );
        }


        if (
            Number(
                configuracion.alarmas.temperaturaMaxima
            ) <= 0
        ) {

            errores.push(
                "La temperatura máxima debe ser mayor que 0."
            );
        }


        return errores;
    }


    /* ========================================================
       ESTADO DE CONFIGURACIÓN
       ======================================================== */

    function actualizarEstado() {

        const estado =
            document.querySelector(
                ".configuration-valid"
            );


        if (!estado) {
            return;
        }


        const titulo =
            estado.querySelector("strong");


        const descripcion =
            estado.querySelector("small");


        const punto =
            estado.querySelector(":scope > span");


        const errores =
            validar();


        if (errores.length === 0) {

            if (titulo) {

                titulo.textContent =
                    "Configuración válida";
            }


            if (descripcion) {

                descripcion.textContent =
                    "Todos los parámetros requeridos están configurados correctamente";
            }


            if (punto) {

                punto.style.background =
                    "#18ad4c";
            }

        } else {

            if (titulo) {

                titulo.textContent =
                    "Revisar configuración";
            }


            if (descripcion) {

                descripcion.textContent =
                    errores.length +
                    " parámetro(s) requieren atención";
            }


            if (punto) {

                punto.style.background =
                    "#ef9708";
            }
        }
    }


    /* ========================================================
       MENSAJES
       ======================================================== */

    function mensaje(texto, tipo = "ok") {

        let caja =
            document.getElementById(
                "batdiag-mensaje"
            );


        if (!caja) {

            caja =
                document.createElement("div");


            caja.id =
                "batdiag-mensaje";


            caja.style.position =
                "fixed";


            caja.style.right =
                "25px";


            caja.style.bottom =
                "25px";


            caja.style.zIndex =
                "99999";


            caja.style.padding =
                "14px 20px";


            caja.style.borderRadius =
                "8px";


            caja.style.color =
                "#fff";


            caja.style.fontSize =
                "13px";


            caja.style.fontWeight =
                "600";


            caja.style.boxShadow =
                "0 5px 20px rgba(0,0,0,.2)";


            document.body.appendChild(
                caja
            );
        }


        caja.style.background =
            tipo === "error"
                ? "#dc3545"
                : tipo === "warning"
                    ? "#ef9708"
                    : "#18ad4c";


        caja.textContent =
            texto;


        caja.style.opacity =
            "1";


        clearTimeout(
            caja._timer
        );


        caja._timer =
            setTimeout(() => {

                caja.style.opacity =
                    "0";

            }, 3000);
    }


    /* ========================================================
       GUARDAR
       ======================================================== */

    function guardarConfiguracion() {

        leerFormulario();


        const errores =
            validar();


        if (errores.length > 0) {

            actualizarEstado();


            mensaje(
                errores[0],
                "error"
            );


            return false;
        }


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                configuracion
            )
        );


        // Evento para que otras páginas
        // sepan que cambió la configuración.
        window.dispatchEvent(
            new CustomEvent(
                "BAT-DIAG-CONFIG-UPDATED",
                {
                    detail:
                        clonar(configuracion)
                }
            )
        );


        actualizarEstado();


        mensaje(
            "Configuración guardada correctamente.",
            "ok"
        );


        return true;
    }


    /* ========================================================
       RESTAURAR
       ======================================================== */

    function restaurarConfiguracion() {

        const confirmar =
            confirm(
                "¿Desea restaurar todos los valores de configuración?"
            );


        if (!confirmar) {
            return;
        }


        configuracion =
            clonar(valoresIniciales);


        localStorage.removeItem(
            STORAGE_KEY
        );


        cargarFormulario();


        actualizarEstado();


        mensaje(
            "Se restauraron los valores predeterminados.",
            "ok"
        );
    }


    /* ========================================================
       BOTONES INFERIORES
       ======================================================== */

    const botonGuardar =
        document.querySelector(
            ".save-btn"
        );


    const botonRestaurar =
        document.querySelector(
            ".reset-btn"
        );


    if (botonGuardar) {

        botonGuardar.addEventListener(
            "click",
            guardarConfiguracion
        );
    }


    if (botonRestaurar) {

        botonRestaurar.addEventListener(
            "click",
            restaurarConfiguracion
        );
    }


    /* ========================================================
       EXPORTAR CONFIGURACIÓN
       ======================================================== */

    function exportarConfiguracion() {

        leerFormulario();


        const archivo = {

            sistema: "BAT-DIAG",

            version: "1.0.0",

            fechaExportacion:
                new Date().toISOString(),

            configuracion:
                configuracion
        };


        const blob =
            new Blob(
                [
                    JSON.stringify(
                        archivo,
                        null,
                        4
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const enlace =
            document.createElement("a");


        enlace.href =
            url;


        enlace.download =
            "BAT-DIAG-configuracion.json";


        document.body.appendChild(
            enlace
        );


        enlace.click();


        enlace.remove();


        URL.revokeObjectURL(
            url
        );


        mensaje(
            "Configuración exportada correctamente.",
            "ok"
        );
    }


    /* ========================================================
       IMPORTAR CONFIGURACIÓN
       ======================================================== */

    function importarConfiguracion() {

        const input =
            document.createElement("input");


        input.type =
            "file";


        input.accept =
            ".json,application/json";


        input.addEventListener(
            "change",
            () => {

                const archivo =
                    input.files[0];


                if (!archivo) {
                    return;
                }


                const lector =
                    new FileReader();


                lector.onload =
                    event => {

                        try {

                            const datos =
                                JSON.parse(
                                    event.target.result
                                );


                            configuracion =
                                combinar(
                                    clonar(
                                        valoresIniciales
                                    ),
                                    datos.configuracion ||
                                    datos
                                );


                            localStorage.setItem(
                                STORAGE_KEY,
                                JSON.stringify(
                                    configuracion
                                )
                            );


                            cargarFormulario();


                            actualizarEstado();


                            mensaje(
                                "Configuración importada correctamente.",
                                "ok"
                            );


                        } catch (error) {

                            console.error(error);


                            mensaje(
                                "El archivo no contiene una configuración válida.",
                                "error"
                            );
                        }
                    };


                lector.readAsText(
                    archivo
                );
            }
        );


        input.click();
    }


    /* ========================================================
       BOTONES DE MANTENIMIENTO
       ======================================================== */

    if (paneles[11]) {

        const botones =
            paneles[11].querySelectorAll(
                ".secondary-action"
            );


        botones.forEach(boton => {

            const texto =
                obtenerTexto(
                    boton
                ).toLowerCase();


            /* COMPROBAR ACTUALIZACIONES */

            if (
                texto.includes(
                    "comprobar actualizaciones"
                )
            ) {

                boton.addEventListener(
                    "click",
                    () => {

                        mensaje(
                            "BAT-DIAG está actualizado.",
                            "ok"
                        );
                    }
                );
            }


            /* EXPORTAR */

            if (
                texto.includes(
                    "exportar configuración"
                )
            ) {

                boton.addEventListener(
                    "click",
                    exportarConfiguracion
                );
            }


            /* IMPORTAR */

            if (
                texto.includes(
                    "importar configuración"
                )
            ) {

                boton.addEventListener(
                    "click",
                    importarConfiguracion
                );
            }
        });
    }


    /* ========================================================
       CAMBIAR CONTRASEÑA
       ======================================================== */

    document.querySelectorAll(
        ".secondary-action"
    ).forEach(boton => {

        const texto =
            obtenerTexto(
                boton
            ).toLowerCase();


        if (
            texto.includes(
                "cambiar contraseña"
            )
        ) {

            boton.addEventListener(
                "click",
                () => {

                    const nueva =
                        prompt(
                            "Ingrese la nueva contraseña:"
                        );


                    if (
                        nueva === null
                    ) {
                        return;
                    }


                    if (
                        nueva.length < 4
                    ) {

                        mensaje(
                            "La contraseña debe tener mínimo 4 caracteres.",
                            "error"
                        );

                        return;
                    }


                    localStorage.setItem(
                        "BAT_DIAG_PASSWORD",
                        nueva
                    );


                    mensaje(
                        "Contraseña actualizada correctamente.",
                        "ok"
                    );
                }
            );
        }
    });


    /* ========================================================
       API PARA LAS OTRAS PÁGINAS
       ======================================================== */

    window.BATDIAG = window.BATDIAG || {};


    window.BATDIAG.getConfig =
        function() {

            return clonar(
                configuracion
            );
        };


    window.BATDIAG.saveConfig =
        function() {

            return guardarConfiguracion();
        };


    window.BATDIAG.getBatteryConfig =
        function() {

            return clonar(
                configuracion.bateria
            );
        };


    window.BATDIAG.getTestConfig =
        function() {

            return clonar(
                configuracion.pruebas
            );
        };


    window.BATDIAG.getSensorConfig =
        function() {

            return clonar(
                configuracion.sensores
            );
        };


    window.BATDIAG.getAlarmConfig =
        function() {

            return clonar(
                configuracion.alarmas
            );
        };


    window.BATDIAG.getReportConfig =
        function() {

            return clonar(
                configuracion.reportes
            );
        };


    /* ========================================================
       SINCRONIZACIÓN ENTRE PÁGINAS
       ======================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key !== STORAGE_KEY ||
                !event.newValue
            ) {

                return;
            }


            try {

                configuracion =
                    combinar(
                        clonar(
                            valoresIniciales
                        ),
                        JSON.parse(
                            event.newValue
                        )
                    );


                cargarFormulario();


                actualizarEstado();


            } catch (error) {

                console.error(
                    "Error sincronizando configuración:",
                    error
                );
            }
        }
    );


    /* ========================================================
       VALIDACIÓN EN TIEMPO REAL
       ======================================================== */

    document.querySelectorAll(
        ".configuration-panels input, " +
        ".configuration-panels select, " +
        ".configuration-panels textarea"
    ).forEach(campo => {

        campo.addEventListener(
            "input",
            actualizarEstado
        );


        campo.addEventListener(
            "change",
            actualizarEstado
        );
    });


    /* ========================================================
       INICIALIZACIÓN
       ======================================================== */

    inicializarCategorias();

    cargarFormulario();

    actualizarEstado();


    /* ========================================================
       DISPONIBILIDAD GLOBAL
       ======================================================== */

    window.BAT_DIAG_CONFIG =
        configuracion;


    console.log(
        "BAT-DIAG: configuración cargada correctamente."
    );

});