/* ============================================================
   SGIFEP - Lógica compartida de los módulos estáticos del sistema.
   Dibuja el encabezado, el drawer (mismas clases que React) y el
   contenido provisional de cada página. Todos los enlaces apuntan
   a rutas internas de React bajo /usuarios/ para no salir del layout.
   ============================================================ */

(function () {
  'use strict';

  var RUTA_SCRIPT = document.currentScript ? document.currentScript.src : '';
  var CLAVE_SESION = 'session';
  var BASE_SISTEMA = '/usuarios/';
  var RUTA_MODULOS = '/modulos.html';
  var RUTA_LOGIN = '/login.html';
  var IMAGEN_LOGO = RUTA_SCRIPT
    ? new URL('../img/logo.png', RUTA_SCRIPT).href
    : '../img/logo.png';

  // Mantener sincronizado con src/config/navegacionSistema.js y App.jsx.
  var MODULOS = [
    {
      id: 'usuarios',
      icono: '👥',
      titulo: 'Usuarios',
      subpaginas: [
        { id: 'listado', etiqueta: 'Listado de Usuarios', ruta: '' },
        { id: 'reporte', etiqueta: 'Reporte de Usuarios', ruta: 'reporte' },
        { id: 'roles', etiqueta: 'Gestión de Roles', ruta: 'roles' },
        { id: 'departamentos', etiqueta: 'Gestión de Departamentos', ruta: 'departamentos' }
      ]
    },
    {
      id: 'compras',
      icono: '🛒',
      titulo: 'Compras',
      subpaginas: [
        {
          id: 'facturas',
          etiqueta: 'Facturas de proveedor',
          ruta: 'compras/facturas',
          titulo: 'Facturas de proveedor',
          descripcion: 'Facturas registradas y saldos pendientes con proveedores.',
          columnas: ['N.° interno', 'Fecha', 'Proveedor', 'N.° factura', 'Balance', 'Estado']
        },
        {
          id: 'proveedores',
          etiqueta: 'Proveedores',
          ruta: 'compras/proveedores',
          titulo: 'Proveedores',
          descripcion: 'Catálogo de proveedores y saldos pendientes.',
          columnas: ['Nombre', 'Teléfono', 'NIT', 'Contacto', 'Saldo pendiente', 'Estado']
        }
      ]
    },
    {
      id: 'inventario',
      icono: '📦',
      titulo: 'Inventario',
      subpaginas: [
        {
          id: 'productos',
          etiqueta: 'Productos',
          ruta: 'inventario/productos',
          titulo: 'Productos',
          descripcion: 'Productos existentes y su saldo en bodega.',
          columnas: ['Código', 'Producto', 'Categoría', 'Existencia', 'Estado']
        },
        {
          id: 'categorias',
          etiqueta: 'Categorías',
          ruta: 'inventario/categorias',
          titulo: 'Categorías',
          descripcion: 'Categorías con las que se agrupan los productos.',
          columnas: ['Código', 'Categoría', 'Productos', 'Estado']
        },
        {
          id: 'movimientos',
          etiqueta: 'Movimientos de Inventario',
          ruta: 'inventario/movimientos',
          titulo: 'Movimientos de Inventario',
          descripcion: 'Entradas y salidas de productos del inventario.',
          columnas: ['Fecha', 'Producto', 'Tipo de movimiento', 'Cantidad', 'Referencia']
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
          ruta: 'facturacion',
          titulo: 'Listado de Facturas',
          descripcion: 'Facturas emitidas a los clientes de la ferretería.',
          columnas: ['Número', 'Cliente', 'Fecha de emisión', 'Vence', 'Estado']
        },
        {
          id: 'clientes',
          etiqueta: 'Clientes',
          ruta: 'facturacion/clientes',
          titulo: 'Clientes',
          descripcion: 'Catálogo de clientes a los que se factura.',
          columnas: ['Código', 'Razón social', 'Contacto', 'Teléfono', 'Estado']
        },
        {
          id: 'cobros',
          etiqueta: 'Cobros',
          ruta: 'facturacion/cobros',
          titulo: 'Cobros',
          descripcion: 'Registro de cobros aplicados a las facturas.',
          columnas: ['Recibo', 'Factura', 'Cliente', 'Fecha', 'Monto']
        },
        {
          id: 'reporte',
          etiqueta: 'Reporte de Facturación',
          ruta: 'facturacion/reporte',
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
          ruta: 'despacho',
          titulo: 'Listado de Despachos',
          descripcion: 'Despachos de productos entregados a los clientes.',
          columnas: ['Código', 'Cliente', 'Fecha', 'Vendedor', 'Estado']
        },
        {
          id: 'rutas-entregas',
          etiqueta: 'Rutas y Entregas',
          ruta: 'despacho/rutas-entregas',
          titulo: 'Rutas y Entregas',
          descripcion: 'Rutas de reparto y control de entregas programadas.',
          columnas: ['Ruta', 'Responsable', 'Entregas', 'Fecha', 'Estado']
        },
        {
          id: 'reporte',
          etiqueta: 'Reporte de Despachos',
          ruta: 'despacho/reporte',
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
          ruta: 'reportes',
          titulo: 'Reporte General',
          descripcion: 'Resumen general de la operación de la ferretería.',
          vista: 'reporte',
          columnas: ['Indicador', 'Valor', 'Variación']
        },
        {
          id: 'ventas',
          etiqueta: 'Reporte de Ventas',
          ruta: 'reportes/ventas',
          titulo: 'Reporte de Ventas',
          descripcion: 'Ventas por período, vendedor y línea de productos.',
          vista: 'reporte',
          columnas: ['Vendedor', 'Ventas', 'Unidades', 'Total']
        },
        {
          id: 'compras',
          etiqueta: 'Reporte de Compras',
          ruta: 'reportes/compras',
          titulo: 'Reporte de Compras',
          descripcion: 'Compras por período, proveedor y línea de productos.',
          vista: 'reporte',
          columnas: ['Proveedor', 'Compras', 'Unidades', 'Total']
        },
        {
          id: 'inventario',
          etiqueta: 'Reporte de Inventario',
          ruta: 'reportes/inventario',
          titulo: 'Reporte de Inventario',
          descripcion: 'Inventario valorizado y productos de baja rotación.',
          vista: 'reporte',
          columnas: ['Categoría', 'Productos', 'Unidades', 'Valor']
        }
      ]
    }
  ];

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

  function urlModulo(subpagina) {
    return BASE_SISTEMA + subpagina.ruta;
  }

  function construirMenu(opciones) {
    var activo = opciones.moduloActivo;
    var paginaActiva = opciones.paginaActiva;
    var abierto = opciones.moduloAbierto;
    var html = '';

    html +=
      '<a class="drawer-item" href="' + RUTA_MODULOS + '">' +
        '<span>← Módulos Principales</span>' +
      '</a>';

    MODULOS.forEach(function (modulo) {
      var esActivo = modulo.id === activo;
      var estaAbierto = esActivo || modulo.id === abierto;
      html +=
        '<button type="button" class="drawer-item' + (esActivo ? ' modulo-activo' : '') + '"' +
        ' data-modulo-menu="' + modulo.id + '" aria-expanded="' + (estaAbierto ? 'true' : 'false') + '">' +
        '<span>' + modulo.icono + ' ' + escapar(modulo.titulo) + '</span>' +
        '<span class="drawer-flecha' + (estaAbierto ? ' abierto' : '') + '">▸</span>' +
        '</button>';

      if (!estaAbierto) return;

      html += '<div class="drawer-subitems" data-subitems="' + modulo.id + '">';
      modulo.subpaginas.forEach(function (sub) {
        var activoSub = esActivo && sub.id === paginaActiva;
        html +=
          '<a class="drawer-subitem' + (activoSub ? ' subitem-activo' : '') + '" href="' +
          urlModulo(sub) + '">' + escapar(sub.etiqueta) + '</a>';
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
        abierto = bloque ? null : id;
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

  function montarEncabezado(contenedor, sesion) {
    var nombre = sesion.nombre || sesion.username || 'Usuario';
    contenedor.innerHTML =
      '<header class="app-header">' +
        '<div class="header-logo-box">' +
          '<img src="' + IMAGEN_LOGO + '" alt="Ferretería El Puente" class="header-logo">' +
        '</div>' +
        '<button type="button" class="menu-toggle" id="btnMenuToggle" aria-label="Alternar menú" aria-expanded="false">☰</button>' +
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

  var moduloActivo = document.body.getAttribute('data-modulo');
  if (!moduloActivo) return;

  var sesion = leerSesion();
  if (!sesion || !sesion.token) {
    window.location.href = RUTA_LOGIN;
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
      '<nav class="drawer-nav" id="navModulos" aria-label="Menú de módulos"></nav>' +
      '<div class="drawer-footer"><a class="drawer-volver" href="/index.html">← Volver al sitio</a></div>' +
    '</aside>' +
    '<div class="contenido"><main class="main" id="contenidoPrincipal"></main></div>';
  app.appendChild(cuerpo);

  montarMenu(document.getElementById('navModulos'), {
    moduloActivo: modulo.id,
    paginaActiva: subpagina.id,
    moduloAbierto: modulo.id
  });
  montarContenido(document.getElementById('contenidoPrincipal'), subpagina);

  var drawer = document.getElementById('drawer');
  var botonMenu = document.getElementById('btnMenuToggle');

  if (window.matchMedia('(min-width: 701px)').matches) {
    drawer.classList.add('drawer-abierto');
    botonMenu.setAttribute('aria-expanded', 'true');
  }

  botonMenu.addEventListener('click', function () {
    drawer.classList.toggle('drawer-abierto');
    botonMenu.setAttribute(
      'aria-expanded',
      drawer.classList.contains('drawer-abierto') ? 'true' : 'false'
    );
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && !window.matchMedia('(min-width: 701px)').matches) {
      drawer.classList.remove('drawer-abierto');
      botonMenu.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('btnLogout').addEventListener('click', function () {
    localStorage.removeItem(CLAVE_SESION);
    window.location.href = RUTA_LOGIN;
  });
})();
