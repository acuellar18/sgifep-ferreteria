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

  var TRAZOS = {
    caja:
      '<rect x="3" y="4" width="18" height="16" rx="2" />' +
      '<path d="M3 9h18" />' +
      '<path d="M7 14h4" />' +
      '<circle cx="17" cy="14" r="1" />',
    pos:
      '<rect x="3" y="8" width="18" height="12" rx="2" />' +
      '<path d="M7 8V4h10v4" />' +
      '<path d="M8 13h8" />' +
      '<path d="M8 17h4" />',
    perfil:
      '<circle cx="12" cy="8" r="4" />' +
      '<path d="M4 21a8 8 0 0 1 16 0" />',
    usuarios:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />' +
      '<circle cx="9" cy="7" r="4" />' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87" />' +
      '<path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    compras:
      '<circle cx="8" cy="21" r="1" />' +
      '<circle cx="19" cy="21" r="1" />' +
      '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />',
    inventario:
      '<path d="m7.5 4.27 9 5.15" />' +
      '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />' +
      '<path d="m3.3 7 8.7 5 8.7-5" />' +
      '<path d="M12 22V12" />',
    facturacion:
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />' +
      '<path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />' +
      '<path d="M12 17.5v-11" />',
    despacho:
      '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />' +
      '<path d="M15 18H9" />' +
      '<path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />' +
      '<circle cx="17" cy="18" r="2" />' +
      '<circle cx="7" cy="18" r="2" />',
    reportes:
      '<path d="M3 3v18h18" />' +
      '<path d="M18 17V9" />' +
      '<path d="M13 17V5" />' +
      '<path d="M8 17v-3" />',
    avatar:
      '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />' +
      '<circle cx="12" cy="7" r="4" />',
    construccion:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />'
  };

  function iconoSvg(id, clase, tamano) {
    return (
      '<svg class="' + clase + '" width="' + tamano + '" height="' + tamano + '"' +
      ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"' +
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (TRAZOS[id] || '') +
      '</svg>'
    );
  }

  // Mantener sincronizado con src/config/navegacionSistema.js y App.jsx.
  var MODULOS = [
    {
      id: 'caja',
      icono: 'caja',
      titulo: 'Caja',
      enlace: 'caja'
    },
    {
      id: 'pos',
      icono: 'pos',
      titulo: 'POS / Venta',
      enlace: 'pos'
    },
    {
      id: 'usuarios',
      icono: 'usuarios',
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
      icono: 'compras',
      titulo: 'Compras',
      subpaginas: [
        {
          id: 'proveedores',
          etiqueta: 'Proveedores',
          ruta: 'compras/proveedores',
          titulo: 'Proveedores',
          descripcion: 'Paso 1: catálogo de proveedores y saldos pendientes.',
          columnas: ['Nombre', 'Teléfono', 'NIT', 'Contacto', 'Saldo pendiente', 'Estado']
        },
        {
          id: 'nueva',
          etiqueta: 'Registrar compra',
          ruta: 'compras/facturas/nueva',
          titulo: 'Registrar compra',
          descripcion: 'Paso 2: productos, cantidades y costos de la compra.',
          columnas: ['Producto', 'Cantidad', 'Costo unitario', 'Subtotal']
        },
        {
          id: 'facturas',
          etiqueta: 'Facturas y pagos',
          ruta: 'compras/facturas',
          titulo: 'Facturas y pagos',
          descripcion: 'Paso 3: facturas registradas y saldos pendientes con proveedores.',
          columnas: ['N.° interno', 'Fecha', 'Proveedor', 'N.° factura', 'Balance', 'Estado']
        }
      ]
    },
    {
      id: 'inventario',
      icono: 'inventario',
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
          descripcion: 'Entradas, salidas y ajustes de productos del inventario.',
          columnas: ['Fecha', 'Producto', 'Tipo de movimiento', 'Cantidad', 'Usuario']
        }
      ]
    },
    {
      id: 'facturacion',
      icono: 'facturacion',
      titulo: 'Facturación',
      subpaginas: [
        {
            id: 'listado',
            etiqueta: 'Listado de Facturas',
            ruta: 'facturacion/facturas',
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
        }
      ]
    },
    {
      id: 'despacho',
      icono: 'despacho',
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
        }
      ]
    },
    {
      id: 'reportes',
      icono: 'reportes',
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
          id: 'auditoria',
          etiqueta: 'Auditoría',
          ruta: 'seguridad/auditoria',
          titulo: 'Auditoría',
          descripcion: 'Registro de acciones sensibles del sistema.',
          vista: 'reporte',
          columnas: ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción']
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
    },
    {
      id: 'perfil',
      icono: 'perfil',
      titulo: 'Mi perfil',
      enlace: 'perfil'
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
        '<span>Módulos Principales</span>' +
      '</a>';

    MODULOS.forEach(function (modulo) {
      var esActivo = modulo.id === activo;
      var estaAbierto = modulo.id === abierto;

      if (modulo.enlace) {
        html +=
          '<a class="drawer-item' + (esActivo ? ' modulo-activo' : '') + '" href="' +
          BASE_SISTEMA + modulo.enlace + '">' +
            '<span class="drawer-item-texto">' +
              iconoSvg(modulo.icono, 'drawer-item-icono', 18) +
              '<span>' + escapar(modulo.titulo) + '</span>' +
            '</span>' +
          '</a>';
        return;
      }

      html +=
        '<button type="button" class="drawer-item' + (esActivo ? ' modulo-activo' : '') + '"' +
        ' data-modulo-menu="' + modulo.id + '" aria-expanded="' + (estaAbierto ? 'true' : 'false') + '">' +
        '<span class="drawer-item-texto">' +
          iconoSvg(modulo.icono, 'drawer-item-icono', 18) +
          '<span>' + escapar(modulo.titulo) + '</span>' +
        '</span>' +
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
          '<span class="avatar">' + iconoSvg('avatar', 'avatar-icono', 20) + '</span>' +
          '<div class="header-usuario-info">' +
            '<span class="header-nombre">' + escapar(nombre) + '</span>' +
            '<span class="rol-badge">' + escapar(textoRol(sesion)) + '</span>' +
          '</div>' +
          '<button type="button" class="logout-link" id="btnLogout">Cerrar sesión</button>' +
        '</div>' +
      '</header>';
  }

  // Foto de perfil: el endpoint requiere JWT, así que se descarga por fetch
  // y se inyecta como blob dentro del avatar del encabezado.
  function cargarFotoPerfil(raiz, sesion) {
    var avatar = raiz ? raiz.querySelector('.header-usuario .avatar') : null;
    if (!avatar || !sesion || !sesion.token) return;
    fetch('/api/perfil/foto', { headers: { Authorization: 'Bearer ' + sesion.token } })
      .then(function (res) { return res.ok ? res.blob() : null; })
      .then(function (blob) {
        if (!blob) return;
        var img = document.createElement('img');
        img.alt = 'Foto de perfil';
        img.src = URL.createObjectURL(blob);
        avatar.innerHTML = '';
        avatar.appendChild(img);
      })
      .catch(function () {});
  }

  function montarContenido(contenedor, subpagina) {
    var columnas = subpagina.columnas || [];
    var encabezadoTabla = columnas
      .map(function (columna) { return '<th>' + escapar(columna) + '</th>'; })
      .join('');

    var estadoVacio =
      '<div class="en-construccion">' +
        '<div class="en-construccion-icono">' + iconoSvg('construccion', 'en-construccion-svg', 32) + '</div>' +
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
  cargarFotoPerfil(app, sesion);

  var cuerpo = document.createElement('div');
  cuerpo.className = 'app-body';
  cuerpo.innerHTML =
    '<aside class="drawer" id="drawer">' +
      '<div class="drawer-cabecera"><span class="drawer-logo">SGIFEP</span></div>' +
      '<nav class="drawer-nav" id="navModulos" aria-label="Menú de módulos"></nav>' +
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
