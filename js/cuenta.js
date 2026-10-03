/* =========================================================
   BAT-DIAG
   CUENTA.JS
   Funciones de usuario, preferencias y sesión
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURACIÓN
       ===================================================== */

    const STORAGE_USER = "BAT_DIAG_USER";
    const STORAGE_SESSION = "BAT_DIAG_SESSION";
    const STORAGE_PREFERENCES = "BAT_DIAG_ACCOUNT_PREFERENCES";


    /* =====================================================
       DATOS DEL USUARIO
       ===================================================== */

    const usuarioPredeterminado = {
        nombre: "Usuario BAT-DIAG",
        username: "operador",
        rol: "Operador",
        estado: "Activo"
    };


    /* =====================================================
       UTILIDADES
       ===================================================== */

    function obtenerUsuario() {

        try {

            const guardado =
                localStorage.getItem(STORAGE_USER);

            if (guardado) {

                return {
                    ...usuarioPredeterminado,
                    ...JSON.parse(guardado)
                };
            }

        } catch (error) {

            console.error(
                "Error leyendo usuario:",
                error
            );
        }

        return {
            ...usuarioPredeterminado
        };
    }


    function guardarUsuario(usuario) {

        localStorage.setItem(
            STORAGE_USER,
            JSON.stringify(usuario)
        );
    }


    function mostrarMensaje(texto, tipo = "ok") {

        let mensaje =
            document.getElementById(
                "batdiag-account-message"
            );


        if (!mensaje) {

            mensaje =
                document.createElement("div");

            mensaje.id =
                "batdiag-account-message";

            mensaje.style.position =
                "fixed";

            mensaje.style.right =
                "25px";

            mensaje.style.bottom =
                "25px";

            mensaje.style.zIndex =
                "99999";

            mensaje.style.padding =
                "13px 18px";

            mensaje.style.borderRadius =
                "7px";

            mensaje.style.color =
                "#ffffff";

            mensaje.style.fontSize =
                "12px";

            mensaje.style.fontWeight =
                "600";

            mensaje.style.boxShadow =
                "0 5px 20px rgba(0,0,0,.18)";

            mensaje.style.transition =
                "opacity .25s ease";

            document.body.appendChild(
                mensaje
            );
        }


        if (tipo === "error") {

            mensaje.style.background =
                "#d62f3a";

        } else if (tipo === "warning") {

            mensaje.style.background =
                "#e98b17";

        } else {

            mensaje.style.background =
                "#13a65a";
        }


        mensaje.textContent =
            texto;

        mensaje.style.opacity =
            "1";


        clearTimeout(
            mensaje._timer
        );


        mensaje._timer =
            setTimeout(() => {

                mensaje.style.opacity =
                    "0";

            }, 3000);
    }


    /* =====================================================
       SESIÓN
       ===================================================== */

    function obtenerSesion() {

        try {

            const guardada =
                localStorage.getItem(
                    STORAGE_SESSION
                );

            if (guardada) {

                return JSON.parse(
                    guardada
                );
            }

        } catch (error) {

            console.error(
                "Error leyendo sesión:",
                error
            );
        }

        return null;
    }


    function crearSesion() {

        const sesion = {

            activa: true,

            inicio:
                new Date().toISOString(),

            usuario:
                obtenerUsuario().username,

            aplicacion:
                "BAT-DIAG v1.0"
        };


        localStorage.setItem(
            STORAGE_SESSION,
            JSON.stringify(sesion)
        );


        return sesion;
    }


    /* =====================================================
       ACTUALIZAR DATOS DE LA CUENTA
       ===================================================== */

    function actualizarDatosUsuario() {

        const usuario =
            obtenerUsuario();


        /* Avatar */

        const avatar =
            document.querySelector(
                ".avatar"
            );


        if (avatar) {

            const nombre =
                usuario.nombre || "Usuario";


            const partes =
                nombre
                    .trim()
                    .split(/\s+/);


            let iniciales = "";


            if (partes.length >= 2) {

                iniciales =
                    partes[0][0] +
                    partes[1][0];

            } else {

                iniciales =
                    partes[0][0] +
                    (partes[0][1] || "");
            }


            avatar.textContent =
                iniciales.toUpperCase();
        }


        /* Nombre principal */

        const nombrePrincipal =
            document.querySelector(
                ".profile-info h3"
            );


        if (nombrePrincipal) {

            nombrePrincipal.textContent =
                usuario.nombre;
        }


        /* Username */

        const username =
            document.querySelector(
                ".profile-info .username"
            );


        if (username) {

            username.textContent =
                "@" + usuario.username;
        }


        /* Rol */

        const role =
            document.querySelector(
                ".role-badge"
            );


        if (role) {

            role.textContent =
                usuario.rol;
        }


        /* Detalles */

        const detalles =
            document.querySelectorAll(
                ".profile-details .detail strong"
            );


        if (detalles.length >= 4) {

            detalles[0].textContent =
                usuario.nombre;

            detalles[1].textContent =
                usuario.username;

            detalles[2].textContent =
                usuario.rol;

            detalles[3].textContent =
                usuario.estado;
        }
    }


    /* =====================================================
       INFORMACIÓN DE SESIÓN
       ===================================================== */

    function actualizarInformacionSesion() {

        const sesion =
            obtenerSesion();


        const datos =
            document.querySelectorAll(
                ".session-data div"
            );


        if (!datos.length) {
            return;
        }


        /* Estado */

        if (datos[0]) {

            const valor =
                datos[0].querySelector(
                    "strong"
                );


            if (valor) {

                if (
                    sesion &&
                    sesion.activa
                ) {

                    valor.textContent =
                        "Sesión activa";

                    valor.classList.add(
                        "green-text"
                    );

                } else {

                    valor.textContent =
                        "Sesión no activa";

                    valor.classList.remove(
                        "green-text"
                    );
                }
            }
        }


        /* Inicio */

        if (
            datos[1] &&
            sesion &&
            sesion.inicio
        ) {

            const valor =
                datos[1].querySelector(
                    "strong"
                );


            if (valor) {

                const fecha =
                    new Date(
                        sesion.inicio
                    );


                valor.textContent =
                    fecha.toLocaleString(
                        "es-CO",
                        {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );
            }
        }


        /* Aplicación */

        if (datos[2]) {

            const valor =
                datos[2].querySelector(
                    "strong"
                );


            if (valor) {

                valor.textContent =
                    "BAT-DIAG v1.0";
            }
        }
    }


    /* =====================================================
       CERRAR SESIÓN
       ===================================================== */

    function cerrarSesion() {

        const confirmar =
            confirm(
                "¿Está seguro de que desea cerrar la sesión?"
            );


        if (!confirmar) {

            return;
        }


        /* Obtener usuario antes de cerrar */

        const usuario =
            obtenerUsuario();


        /* Registrar la hora de cierre */

        const registroSesion = {

            usuario:
                usuario.username,

            cierre:
                new Date().toISOString(),

            activa: false
        };


        localStorage.setItem(
            "BAT_DIAG_LAST_LOGOUT",
            JSON.stringify(
                registroSesion
            )
        );


        /*
         * IMPORTANTE:
         *
         * No eliminamos la configuración de BAT-DIAG.
         *
         * Tampoco eliminamos los registros.
         *
         * Solamente eliminamos la sesión activa.
         */

        localStorage.removeItem(
            STORAGE_SESSION
        );


        /*
         * Marcamos explícitamente
         * que ya no existe una sesión.
         */

        sessionStorage.clear();


        /*
         * Redirigir al LOGIN.
         *
         * cuenta.html está dentro de /pages/
         * y login.html está en la raíz.
         */

        window.location.href =
            "../login.html";
    }


    /* =====================================================
       EDITAR PERFIL
       ===================================================== */

    function editarPerfil() {

        const usuario =
            obtenerUsuario();


        const nuevoNombre =
            prompt(
                "Nombre del usuario:",
                usuario.nombre
            );


        if (
            nuevoNombre === null
        ) {

            return;
        }


        if (
            nuevoNombre.trim() === ""
        ) {

            mostrarMensaje(
                "El nombre no puede estar vacío.",
                "error"
            );

            return;
        }


        const nuevoUsername =
            prompt(
                "Nombre de usuario:",
                usuario.username
            );


        if (
            nuevoUsername === null
        ) {

            return;
        }


        if (
            nuevoUsername.trim() === ""
        ) {

            mostrarMensaje(
                "El usuario no puede estar vacío.",
                "error"
            );

            return;
        }


        usuario.nombre =
            nuevoNombre.trim();


        usuario.username =
            nuevoUsername
                .trim()
                .toLowerCase();


        guardarUsuario(
            usuario
        );


        actualizarDatosUsuario();


        mostrarMensaje(
            "Perfil actualizado correctamente."
        );
    }


    /* =====================================================
       PREFERENCIAS
       ===================================================== */

    function cargarPreferencias() {

        let preferencias = {

            idioma: "Español",

            fecha: "DD/MM/AAAA",

            notificaciones: true,

            confirmaciones: true
        };


        try {

            const guardadas =
                localStorage.getItem(
                    STORAGE_PREFERENCES
                );


            if (guardadas) {

                preferencias = {

                    ...preferencias,

                    ...JSON.parse(
                        guardadas
                    )
                };
            }

        } catch (error) {

            console.error(
                "Error cargando preferencias:",
                error
            );
        }


        const selects =
            document.querySelectorAll(
                ".preferences-list select"
            );


        if (selects[0]) {

            selects[0].value =
                preferencias.idioma;
        }


        if (selects[1]) {

            selects[1].value =
                preferencias.fecha;
        }


        const switches =
            document.querySelectorAll(
                ".preferences-list .switch input"
            );


        if (switches[0]) {

            switches[0].checked =
                preferencias.notificaciones;
        }


        if (switches[1]) {

            switches[1].checked =
                preferencias.confirmaciones;
        }
    }


    function guardarPreferencias() {

        const selects =
            document.querySelectorAll(
                ".preferences-list select"
            );


        const switches =
            document.querySelectorAll(
                ".preferences-list .switch input"
            );


        const preferencias = {

            idioma:
                selects[0]
                    ? selects[0].value
                    : "Español",

            fecha:
                selects[1]
                    ? selects[1].value
                    : "DD/MM/AAAA",

            notificaciones:
                switches[0]
                    ? switches[0].checked
                    : true,

            confirmaciones:
                switches[1]
                    ? switches[1].checked
                    : true
        };


        localStorage.setItem(
            STORAGE_PREFERENCES,
            JSON.stringify(
                preferencias
            )
        );


        mostrarMensaje(
            "Preferencias guardadas."
        );
    }


    /* =====================================================
       CAMBIAR CONTRASEÑA
       ===================================================== */

    function cambiarPassword() {

        const actual =
            localStorage.getItem(
                "BAT_DIAG_PASSWORD"
            );


        const contraseñaActual =
            prompt(
                "Ingrese su contraseña actual:"
            );


        if (
            contraseñaActual === null
        ) {

            return;
        }


        /*
         * Si todavía no existe contraseña,
         * se permite crear una.
         */

        if (
            actual &&
            contraseñaActual !== actual
        ) {

            mostrarMensaje(
                "La contraseña actual no es correcta.",
                "error"
            );

            return;
        }


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

            mostrarMensaje(
                "La contraseña debe tener al menos 4 caracteres.",
                "error"
            );

            return;
        }


        const confirmacion =
            prompt(
                "Confirme la nueva contraseña:"
            );


        if (
            confirmacion !== nueva
        ) {

            mostrarMensaje(
                "Las contraseñas no coinciden.",
                "error"
            );

            return;
        }


        localStorage.setItem(
            "BAT_DIAG_PASSWORD",
            nueva
        );


        mostrarMensaje(
            "Contraseña actualizada correctamente."
        );


        actualizarEstadoPassword();
    }


    /* =====================================================
       ESTADO DE CONTRASEÑA
       ===================================================== */

    function actualizarEstadoPassword() {

        const elemento =
            document.querySelector(
                ".security-item:first-child span"
            );


        if (!elemento) {
            return;
        }


        const password =
            localStorage.getItem(
                "BAT_DIAG_PASSWORD"
            );


        if (password) {

            elemento.textContent =
                "Contraseña configurada";

        } else {

            elemento.textContent =
                "Última actualización: Nunca";
        }
    }


    /* =====================================================
       BOTONES
       ===================================================== */

    /* Editar perfil */

    const botonEditar =
        document.querySelector(
            ".profile-card .secondary-button"
        );


    if (botonEditar) {

        botonEditar.addEventListener(
            "click",
            editarPerfil
        );
    }


    /* Cerrar sesión */

    const botonCerrarSesion =
        document.querySelector(
            ".logout-button"
        );


    if (botonCerrarSesion) {

        botonCerrarSesion.addEventListener(
            "click",
            cerrarSesion
        );
    }


    /* Cambiar contraseña */

    const botonCambiarPassword =
        document.querySelector(
            ".security-card .outline-button"
        );


    if (botonCambiarPassword) {

        botonCambiarPassword.addEventListener(
            "click",
            cambiarPassword
        );
    }


    /* =====================================================
       CAMBIOS DE PREFERENCIAS
       ===================================================== */

    document.querySelectorAll(
        ".preferences-list select, " +
        ".preferences-list .switch input"
    ).forEach(elemento => {

        elemento.addEventListener(
            "change",
            guardarPreferencias
        );
    });


    /* =====================================================
       INICIALIZACIÓN
       ===================================================== */

    /*
     * Si no existe una sesión, creamos una
     * para esta versión de desarrollo.
     */

    if (!obtenerSesion()) {

        crearSesion();
    }


    cargarPreferencias();

    actualizarDatosUsuario();

    actualizarInformacionSesion();

    actualizarEstadoPassword();


    console.log(
        "BAT-DIAG: cuenta.js cargado correctamente."
    );

});