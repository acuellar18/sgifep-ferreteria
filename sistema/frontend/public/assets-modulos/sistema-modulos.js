/* ============================================================
   SGIFEP · Lógica compartida de los módulos del sistema
   (Compras, Inventario, Facturación, Despacho, Reportes)

   Qué hace este archivo:
     1. Dibuja el encabezado superior y el menú lateral unificado
        (Módulos Principales + los 6 módulos con su acordeón) usando las
        MISMAS clases y medidas que el módulo de Usuarios.
     2. Detecta el módulo y la página activa para expandir y resaltar
        en naranja solo ese módulo.
     3. Dibuja el contenido de cada página (hoy vacío: "Módulo en
        construcción"); es el punto donde luego se enchufa el backend.
     4. Se carga solo desde las páginas de los módulos nuevos (las que
        llevan <body data-modulo="...">). modulos.html no lo usa: ahí el
        menú lateral es HTML fijo, para que se vea siempre.

   No modifica el módulo de Usuarios: sus páginas siguen siendo las
   de React, simplemente se les agregaron enlaces a estos módulos.

   Autor de la línea gráfica: sistema/frontend/src/styles.css
   ============================================================ */

(function () {
  'use strict';

  // Ruta de este mismo archivo: define la raíz desde la que se sirven estas
  // páginas (ver detectarRaiz más abajo).
  var RUTA_SCRIPT = document.currentScript ? document.currentScript.src : '';

  var CLAVE_SESION = 'session';
  // El módulo de Usuarios es una aplicación React y siempre vive en /usuarios/
  // tanto en desarrollo (Vite, base '/usuarios/') como en producción.
  var RAIZ_USUARIOS = '/usuarios/';

  /* ------------------------------------------------------------
     1. Catálogo de módulos y submódulos
        archivo: .html dentro de la carpeta del módulo
                (vacío = index.html)
        url:    ruta absoluta; solo el módulo Usuarios la usa
                (React, fuera de estas carpetas estáticas)
     ------------------------------------------------------------ */
  var MODULOS = [
    {
      id: 'usuarios',
      icono: '👥',
      titulo: 'Usuarios',
      subpaginas: [
        { id: 'listado', etiqueta: 'Listado de Usuarios', url: RAIZ_USUARIOS },
        { id: 'reporte', etiqueta: 'Reporte de Usuarios', url: RAIZ_USUARIOS + 'reporte' },
        { id: 'roles', etiqueta: 'Gestión de Roles', url: RAIZ_USUARIOS + 'roles' },
        { id: 'departamentos', etiqueta: 'Gestión de Departamentos', url: RAIZ_USUARIOS + 'departamentos' }
      ]
    },
    {
      id: 'compras',
      icono: '🛒',
      titulo: 'Compras',
      subpaginas: [
        {
          id: 'listado',
          etiqueta: 'Listado de Compras',
          titulo: 'Listado de Compras',
          descripcion: 'Compras realizadas a los proveedores de la ferretería.',
          columnas: ['Código', 'Proveedor', 'Fecha', 'Total', 'Estado']
        },
        {
          id: 'proveedores',
          archivo: 'proveedores.html',
          etiqueta: 'Proveedores',
          titulo: 'Proveedores',
          descripcion: 'Catálogo de proveedores de la ferretería.',
          columnas: ['Código', 'Razón social', 'Contacto', 'Teléfono', 'Estado']
        },
        {
          id: 'ordenes-compra',
          archivo: 'ordenes-compra.html',
          etiqueta: 'Órdenes de Compra',
          titulo: 'Órdenes de Compra',
          descripcion: 'Órdenes de compra emitidas a los proveedores.',
          columnas: ['Código', 'Proveedor', 'Fecha de emisión', 'Fecha de entrega', 'Estado']
        },
        {
          id: 'reporte',
          archivo: 'reporte.html',
          etiqueta: 'Reporte de Compras',
          titulo: 'Reporte de Compras',
          descripcion: 'Resumen de compras por período y proveedor.',
          vista: 'reporte',
          columnas: ['Proveedor', 'N.º de compras', 'Total', 'Última compra']
        }
      ]
    },
    {
      id: 'inventario',
      icono: '📦',
      titulo: 'Inventario',
      subpaginas: [
        {
          id: 'listado',
          etiqueta: 'Listado de Productos',
          titulo: 'Listado de Productos',
          descripcion: 'Productos existentes y su saldo en bodega.',
          columnas: ['Código', 'Producto', 'Categoría', 'Existencia', 'Estado']
        },
        {
          id: 'categorias',
          archivo: 'categorias.html',
          etiqueta: 'Categorías',
          titulo: 'Categorías',
          descripcion: 'Categorías con las que se agrupan los productos.',
          columnas: ['Código', 'Categoría', 'Productos', 'Estado']
        },
        {
          id: 'movimientos',
          archivo: 'movimientos.html',
          etiqueta: 'Movimientos de Inventario',
          titulo: 'Movimientos de Inventario',
          descripcion: 'Entradas y salidas de productos del inventario.',
          columnas: ['Fecha', 'Producto', 'Tipo de movimiento', 'Cantidad', 'Referencia']
        },
        {
          id: 'reporte',
          archivo: 'reporte.html',
          etiqueta: 'Reporte de Inventario',
          titulo: 'Reporte de Inventario',
          descripcion: 'Resumen del inventario valorizado y rotación.',
          vista: 'reporte',
          columnas: ['Categoría', 'Productos', 'Unidades', 'Valor']
        }
      ]
    },
    {
      id: 'facturacion',
      icono: '🧾',
      titulo: 'Facturación',
      subpaginas: [
        {
          id: 'listado',
          etiqueta: 'Listado de Facturas',
          titulo: 'Listado de Facturas',
          descripcion: 'Facturas emitidas a los clientes de la ferretería.',
          columnas: ['Número', 'Cliente', 'Fecha de emisión', 'Vence', 'Estado']
        },
        {
          id: 'clientes',
          archivo: 'clientes.html',
          etiqueta: 'Clientes',
          titulo: 'Clientes',
          descripcion: 'Catálogo de clientes a los que se factura.',
          columnas: ['Código', 'Razón social', 'Contacto', 'Teléfono', 'Estado']
        },
        {
          id: 'cobros',
          archivo: 'cobros.html',
          etiqueta: 'Cobros',
          titulo: 'Cobros',
          descripcion: 'Registro de cobros aplicados a las facturas.',
          columnas: ['Recibo', 'Factura', 'Cliente', 'Fecha', 'Monto']
        },
        {
          id: 'reporte',
          archivo: 'reporte.html',
          etiqueta: 'Reporte de Facturación',
          titulo: 'Reporte de Facturación',
          descripcion: 'Resumen de facturación y cobranza por período.',
          vista: 'reporte',
          columnas: ['Cliente', 'Facturado', 'Cobrado', 'Saldo']
        }
      ]
    },
    {
      id: 'despacho',
      icono: '📤',
      titulo: 'Despacho',
      subpaginas: [
        {
          id: 'listado',
          etiqueta: 'Listado de Despachos',
          titulo: 'Listado de Despachos',
          descripcion: 'Despachos de productos entregados a los clientes.',
          columnas: ['Código', 'Cliente', 'Fecha', 'Vendedor', 'Estado']
        },
        {
          id: 'rutas-entregas',
          archivo: 'rutas-entregas.html',
          etiqueta: 'Rutas y Entregas',
          titulo: 'Rutas y Entregas',
          descripcion: 'Rutas de reparto y control de entregas programadas.',
          columnas: ['Ruta', 'Responsable', 'Entregas', 'Fecha', 'Estado']
        },
        {
          id: 'reporte',
          archivo: 'reporte.html',
          etiqueta: 'Reporte de Despachos',
          titulo: 'Reporte de Despachos',
          descripcion: 'Resumen de despachos por vendedor y por día.',
          vista: 'reporte',
          columnas: ['Vendedor', 'Despachos', 'Entregas', 'Devoluciones']
        }
      ]
    },
    {
      id: 'reportes',
      icono: '📊',
      titulo: 'Reportes',
      subpaginas: [
        {
          id: 'general',
          etiqueta: 'Reporte General',
          titulo: 'Reporte General',
          descripcion: 'Resumen general de la operación de la ferretería.',
          vista: 'reporte',
          columnas: ['Indicador', 'Valor', 'Variación']
        },
        {
          id: 'ventas',
          archivo: 'ventas.html',
          etiqueta: 'Reporte de Ventas',
          titulo: 'Reporte de Ventas',
          descripcion: 'Ventas por período, vendedor y línea de productos.',
          vista: 'reporte',
          columnas: ['Vendedor', 'Ventas', 'Unidades', 'Total']
        },
        {
          id: 'compras',
          archivo: 'compras.html',
          etiqueta: 'Reporte de Compras',
          titulo: 'Reporte de Compras',
          descripcion: 'Compras por período, proveedor y línea de productos.',
          vista: 'reporte',
          columnas: ['Proveedor', 'Compras', 'Unidades', 'Total']
        },
        {
          id: 'inventario',
          archivo: 'inventario.html',
          etiqueta: 'Reporte de Inventario',
          titulo: 'Reporte de Inventario',
          descripcion: 'Inventario valorizado y productos de baja rotación.',
          vista: 'reporte',
          columnas: ['Categoría', 'Productos', 'Unidades', 'Valor']
        }
      ]
    }
  ];

  /* ------------------------------------------------------------
     2. Raíz de despliegue
        En desarrollo estas carpetas se sirven bajo /usuarios/
        (base de Vite, puerto 5174) y en producción bajo la raíz de
        Express (puerto 3000). Se deduce de la ubicación de este
        mismo archivo, que siempre es <raíz>/assets-modulos/, así que
        no hay nada que cambiar al cambiar de entorno.
     ------------------------------------------------------------ */
  function detectarRaiz() {
    if (RUTA_SCRIPT) {
      try {
        return new URL('../', RUTA_SCRIPT).href;
      } catch (error) {
        // Si el navegador no resuelve la URL, se usa la ruta de la página.
      }
    }
    var coincidencia = location.pathname.match(
      /\/(compras|inventario|facturacion|despacho|reportes)(?:\/|$)/
    );
    if (!coincidencia) return location.pathname.replace(/[^/]*$/, '');
    return location.pathname.slice(0, location.pathname.indexOf('/' + coincidencia[1])) + '/';
  }

  var RAIZ = detectarRaiz();

  function urlModulo(idModulo, subpagina) {
    if (subpagina.url) return subpagina.url;
    return RAIZ + idModulo + '/' + (subpagina.archivo || 'index.html');
  }

  function urlPaginaModulos() {
    return RAIZ + 'modulos.html';
  }

  function urlLogin() {
    return RAIZ + 'login.html';
  }

  /* ------------------------------------------------------------
     3. Utilidades
     ------------------------------------------------------------ */
  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function leerSesion() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_SESION));
    } catch (error) {
      return null;
    }
  }

  function buscarModulo(id) {
    for (var i = 0; i < MODULOS.length; i++) {
      if (MODULOS[i].id === id) return MODULOS[i];
    }
    return null;
  }

  function buscarSubpagina(modulo, id) {
    for (var i = 0; i < modulo.subpaginas.length; i++) {
      if (modulo.subpaginas[i].id === id) return modulo.subpaginas[i];
    }
    return modulo.subpaginas[0];
  }

  function textoRol(sesion) {
    if (sesion.roles && sesion.roles.length) return sesion.roles.join(', ');
    return sesion.rol || 'usuario';
  }

  /* ------------------------------------------------------------
     4. Menú lateral unificado (acordeón)
       Un solo módulo abierto a la vez: el de la página actual.
     ------------------------------------------------------------ */
  function construirMenu(opciones) {
    var activo = opciones.moduloActivo;
    var paginaActiva = opciones.paginaActiva;
    var abierto = opciones.moduloAbierto;
    var html = '';

    html +=
      '<a class="nav-item nav-principales' + (activo === 'modulos' ? ' nav-activo modulo-activo' : '') +
      '" href="' + urlPaginaModulos() + '"><span>🏠 Módulos Principales</span></a>';

    MODULOS.forEach(function (modulo) {
      var esActivo = modulo.id === activo;
      var estaAbierto = esActivo || modulo.id === abierto;
      html +=
        '<button type="button" class="nav-item' + (esActivo ? ' modulo-activo' : '') + '"' +
        ' data-modulo-menu="' + modulo.id + '" aria-expanded="' + (estaAbierto ? 'true' : 'false') + '">' +
        '<span>' + modulo.icono + ' ' + escapar(modulo.titulo) + '</span>' +
        '<span class="nav-flecha' + (estaAbierto ? ' abierto' : '') + '">▾</span>' +
        '</button>';

      if (!estaAbierto) return;

      html += '<div class="nav-subitems" data-subitems="' + modulo.id + '">';
      modulo.subpaginas.forEach(function (sub) {
        var activoSub = esActivo && sub.id === paginaActiva;
        html +=
          '<a class="nav-subitem' + (activoSub ? ' activo' : '') + '" href="' + urlModulo(modulo.id, sub) + '">' +
          escapar(sub.etiqueta) +
          '</a>';
      });
      html += '</div>';
    });

    return html;
  }

  function activarAcordeon(nav, opciones) {
    var abierto = opciones.moduloAbierto;
    var modulos = nav.querySelectorAll('[data-modulo-menu]');

    Array.prototype.forEach.call(modulos, function (boton) {
      boton.addEventListener('click', function () {
        var id = boton.getAttribute('data-modulo-menu');
        var bloque = nav.querySelector('[data-subitems="' + id + '"]');

        // Si ya estaba abierto, se cierra; si no, se abre y se cierra el otro.
        if (bloque) {
          abierto = null;
        } else {
          abierto = id;
        }
        nav.innerHTML = construirMenu({
          moduloActivo: opciones.moduloActivo,
          paginaActiva: opciones.paginaActiva,
          moduloAbierto: abierto
        });
        activarAcordeon(nav, {
          moduloActivo: opciones.moduloActivo,
          paginaActiva: opciones.paginaActiva,
          moduloAbierto: abierto
        });
      });
    });
  }

  function montarMenu(nav, opciones) {
    if (!nav) return;
    nav.innerHTML = construirMenu(opciones);
    activarAcordeon(nav, opciones);
  }

  /* ------------------------------------------------------------
     5. Encabezado (idéntico al de modulos.html y al del módulo React)
     ------------------------------------------------------------ */
  function montarEncabezado(contenedor, sesion) {
    var nombre = sesion.nombre || sesion.username || 'Usuario';
    contenedor.innerHTML =
      '<header class="app-header">' +
        '<div class="header-logo-box">' +
          '<img src="../img/logo.png" alt="Ferretería El Puente" class="header-logo">' +
        '</div>' +
        '<button type="button" class="menu-toggle" id="btnMenuToggle" aria-label="Alternar menú">☰</button>' +
        '<div class="header-titulos">' +
          '<span class="header-titulo-naranja">MÓDULOS</span>' +
          '<span class="header-subtitulo-blanco">PANEL DE ACCESO</span>' +
        '</div>' +
        '<div class="header-usuario">' +
          '<span class="avatar">👤</span>' +
          '<div class="header-usuario-info">' +
            '<span class="header-nombre">' + escapar(nombre) + '</span>' +
            '<span class="rol-badge">' + escapar(textoRol(sesion)) + '</span>' +
          '</div>' +
          '<button type="button" class="logout-link" id="btnLogout">Cerrar sesión</button>' +
        '</div>' +
      '</header>';
  }

  /* ------------------------------------------------------------
     6. Contenido de la página
        Hoy es solo estructura visual; el backend se enchufa aquí.
     ------------------------------------------------------------ */
  function montarContenido(contenedor, subpagina) {
    var columnas = subpagina.columnas || [];
    var encabezadoTabla = columnas
      .map(function (columna) { return '<th>' + escapar(columna) + '</th>'; })
      .join('');

    var estadoVacio =
      '<div class="en-construccion">' +
        '<div class="en-construccion-icono">🚧</div>' +
        '<h3>Módulo en construcción</h3>' +
        '<p>Esta sección ya está habilitada en el menú, pero su información ' +
        'estará disponible próximamente.</p>' +
        '<span class="chip chip-proximo">Próximamente</span>' +
      '</div>';

    var tarjetas = '';
    if (subpagina.vista === 'reporte') {
      tarjetas =
        '<div class="tarjetas">' +
          '<div class="tarjeta"><span class="tarjeta-valor">—</span><span class="tarjeta-etiqueta">Total del período</span></div>' +
          '<div class="tarjeta"><span class="tarjeta-valor">—</span><span class="tarjeta-etiqueta">Cantidad de registros</span></div>' +
          '<div class="tarjeta"><span class="tarjeta-valor">—</span><span class="tarjeta-etiqueta">Pendientes</span></div>' +
        '</div>';
    }

    contenedor.innerHTML =
      '<div class="encabezado-pagina">' +
        '<div>' +
          '<h2>' + escapar(subpagina.titulo || subpagina.etiqueta) + '</h2>' +
          '<p>' + escapar(subpagina.descripcion || '') + '</p>' +
        '</div>' +
        '<div class="acciones-encabezado">' +
          '<span class="chip chip-proximo">Módulo en construcción</span>' +
        '</div>' +
      '</div>' +
      tarjetas +
      '<div class="tabla-wrapper">' +
        '<table class="tabla">' +
          '<thead><tr>' + encabezadoTabla + '</tr></thead>' +
          '<tbody>' +
            '<tr class="fila-vacia">' +
              '<td colspan="' + Math.max(columnas.length, 1) + '">' + estadoVacio + '</td>' +
            '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  /* ------------------------------------------------------------
     7. Arranque
        Solo se ejecuta en las páginas de los módulos nuevos, que se
        identifican con <body data-modulo="...">. modulos.html ya no
        lo carga: su menú lateral es HTML fijo.
     ------------------------------------------------------------ */

  var moduloActivo = document.body.getAttribute('data-modulo');
  if (!moduloActivo) return;

  var sesion = leerSesion();
  if (!sesion || !sesion.token) {
    window.location.href = urlLogin();
    return;
  }

  var modulo = buscarModulo(moduloActivo);
  if (!modulo) return;

  var subpagina = buscarSubpagina(modulo, document.body.getAttribute('data-pagina'));
  document.title = 'SGIFEP - ' + modulo.titulo + ' | ' + (subpagina.titulo || subpagina.etiqueta);

  var app = document.getElementById('app');
  if (!app) return;

  app.className = 'layout';
  montarEncabezado(app, sesion);

  var cuerpo = document.createElement('div');
  cuerpo.className = 'app-body';
  cuerpo.innerHTML =
    '<aside class="drawer" id="drawer">' +
      '<div class="drawer-cabecera"><span class="drawer-logo">SGIFEP</span></div>' +
      '<nav class="drawer-nav" id="navModulos"></nav>' +
      '<div class="drawer-footer"><a class="drawer-volver" href="' + RAIZ + 'index.html">← Volver al sitio</a></div>' +
    '</aside>' +
    '<div class="contenido"><main class="main" id="contenidoPrincipal"></main></div>';
  app.appendChild(cuerpo);

  montarMenu(document.getElementById('navModulos'), {
    moduloActivo: modulo.id,
    paginaActiva: subpagina.id,
    moduloAbierto: modulo.id
  });
  montarContenido(document.getElementById('contenidoPrincipal'), subpagina);

  // Botón ☰: el drawer empuja el contenido (mismo comportamiento del módulo React).
  var drawer = document.getElementById('drawer');
  document.getElementById('btnMenuToggle').addEventListener('click', function () {
    drawer.classList.toggle('drawer-abierto');
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') drawer.classList.remove('drawer-abierto');
  });

  document.getElementById('btnLogout').addEventListener('click', function () {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = urlLogin();
  });
})();
