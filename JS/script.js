const STORAGE_KEY = 'registroIngresoSalidaData';
const LEGACY_STORAGE_KEY = 'registroIngresoSalida';
const USERS_KEY = 'registroIngresoSalidaUsers';
const CURRENT_USER_KEY = 'registroIngresoSalidaCurrentUser';
const AUTH_DRAFTS_KEY = 'registroIngresoSalidaAuthDrafts';
const AUTH_VIEW_KEY = 'registroIngresoSalidaAuthView';

const LABELS_ROL = {
  dueno: 'Dueño',
  empleado: 'Empleado',
  cliente: 'Cliente',
  proveedor: 'Proveedor',
  otro: 'Otro'
};

const ROLES_GESTIONABLES = ['dueno', 'empleado', 'proveedor'];

const LABELS_TURNO = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  manana: 'Matutino',
  tarde: 'Vespertino',
  noche: 'Noche',
  visita: 'Visita puntual'
};

const LABELS_INCIDENCIA = {
  ninguna: 'Sin incidencia',
  retraso: 'Retraso',
  salida_anticipada: 'Salida anticipada',
  visita_proveedor: 'Visita de proveedor',
  entrega_mercaderia: 'Entrega de mercadería',
  seguridad: 'Seguridad',
  mantenimiento: 'Mantenimiento',
  otra: 'Otra'
};

function formatoFechaHora(fecha) {
  return fecha.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatoFechaLarga(fecha) {
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function obtenerClaveFecha(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizarUsername(nombre) {
  return String(nombre || '').trim().toLowerCase();
}

function normalizarTurno(turno, usarSoloOpcionesActuales = false) {
  const valor = String(turno || '').trim().toLowerCase();
  if (valor === 'manana' || valor === 'matutino') return 'matutino';
  if (valor === 'tarde' || valor === 'vespertino') return 'vespertino';
  if (usarSoloOpcionesActuales) return 'matutino';
  return valor || 'matutino';
}

function normalizarRolGestionable(rol, valorPorDefecto = 'empleado') {
  const valor = String(rol || '').trim().toLowerCase();
  return ROLES_GESTIONABLES.includes(valor) ? valor : valorPorDefecto;
}

function crearEstadoInicial() {
  return {
    ultimoIngreso: null,
    ultimaSalida: null,
    historial: []
  };
}

function crearDraftsIniciales() {
  return {
    authView: 'login',
    loginNombre: '',
    loginPassword: '',
    registerNombre: '',
    registerPassword: '',
    registerRol: 'empleado'
  };
}

function obtenerFechaDesdeMovimiento(item) {
  if (!item || !item.fechaISO) return null;
  const fecha = new Date(item.fechaISO);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function normalizarMovimiento(item) {
  const fecha = obtenerFechaDesdeMovimiento(item) || new Date();
  return {
    tipo: item.tipo === 'salida' ? 'salida' : 'ingreso',
    nombre: item.nombre || 'Sin nombre',
    rolPersona: item.rolPersona || item.tipoPersona || 'otro',
    turno: normalizarTurno(item.turno),
    incidencia: item.incidencia || 'ninguna',
    observacion: item.observacion || '',
    fechaISO: item.fechaISO || fecha.toISOString(),
    fechaTexto: item.fechaTexto || formatoFechaHora(fecha),
    fechaDia: item.fechaDia && item.fechaDia.includes('-') ? item.fechaDia : obtenerClaveFecha(fecha),
    creadoPorUsername: String(item.creadoPorUsername || '').trim(),
    creadoPorUsernameKey: normalizarUsername(item.creadoPorUsernameKey || item.creadoPorUsername)
  };
}

function normalizarUsuario(user) {
  return {
    username: String(user.username || '').trim(),
    usernameKey: normalizarUsername(user.usernameKey || user.username),
    password: String(user.password || ''),
    rol: normalizarRolGestionable(user.rol, user.usernameKey === 'dueno' || normalizarUsername(user.username) === 'dueno' ? 'dueno' : 'empleado'),
    observacionUsuario: String(user.observacionUsuario || ''),
    advertencias: Number.isFinite(Number(user.advertencias)) ? Math.max(0, Number(user.advertencias)) : 0,
    sanciones: Number.isFinite(Number(user.sanciones)) ? Math.max(0, Number(user.sanciones)) : 0
  };
}

function crearUsuarioDuenoInicial() {
  return {
    username: 'dueno',
    usernameKey: 'dueno',
    password: '1234',
    rol: 'dueno',
    observacionUsuario: 'Cuenta inicial del sistema. Cambia la contraseña cuando ingreses.',
    advertencias: 0,
    sanciones: 0
  };
}

function obtenerUltimoMovimiento(historial, tipo) {
  return historial.find((item) => item.tipo === tipo) || null;
}

function normalizarEstado(data) {
  const historial = Array.isArray(data.historial) ? data.historial.map(normalizarMovimiento) : [];
  return {
    historial,
    ultimoIngreso: data.ultimoIngreso ? normalizarMovimiento(data.ultimoIngreso) : obtenerUltimoMovimiento(historial, 'ingreso'),
    ultimaSalida: data.ultimaSalida ? normalizarMovimiento(data.ultimaSalida) : obtenerUltimoMovimiento(historial, 'salida')
  };
}

function obtenerUsuariosGuardados() {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(raw) ? raw.map(normalizarUsuario).filter((user) => user.usernameKey) : [];
  } catch (error) {
    return [];
  }
}

function guardarUsuarios(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function asegurarUsuarioDuenoInicial() {
  const users = obtenerUsuariosGuardados();
  if (users.length) return false;
  guardarUsuarios([crearUsuarioDuenoInicial()]);
  return true;
}

function obtenerSesionActual() {
  try {
    const session = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    return session && session.usernameKey ? session : null;
  } catch (error) {
    return null;
  }
}

function guardarSesionActual(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
    username: user.username,
    usernameKey: user.usernameKey,
    rol: user.rol
  }));
}

function obtenerUsuarioPorUsernameKey(usernameKey) {
  return obtenerUsuariosGuardados().find((item) => item.usernameKey === usernameKey) || null;
}

function obtenerUsuarioActualCompleto() {
  const session = obtenerSesionActual();
  return session ? obtenerUsuarioPorUsernameKey(session.usernameKey) : null;
}

function cerrarSesionActual() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function obtenerDraftsAuth() {
  try {
    return Object.assign(crearDraftsIniciales(), JSON.parse(localStorage.getItem(AUTH_DRAFTS_KEY)) || {});
  } catch (error) {
    return crearDraftsIniciales();
  }
}

function guardarDraftsAuth(drafts) {
  localStorage.setItem(AUTH_DRAFTS_KEY, JSON.stringify(drafts));
}

function actualizarDraftsAuth() {
  const elements = obtenerElementos();
  guardarDraftsAuth({
    authView: obtenerVistaAuthActual(),
    loginNombre: elements.loginNombre ? elements.loginNombre.value : '',
    loginPassword: elements.loginPassword ? elements.loginPassword.value : '',
    registerNombre: elements.registerNombre ? elements.registerNombre.value : '',
    registerPassword: elements.registerPassword ? elements.registerPassword.value : '',
    registerRol: elements.registerRol ? elements.registerRol.value : 'empleado'
  });
}

function limpiarDraftsAuth(seccion) {
  const drafts = obtenerDraftsAuth();
  if (seccion === 'login') {
    drafts.loginNombre = '';
    drafts.loginPassword = '';
  }
  if (seccion === 'register') {
    drafts.registerNombre = '';
    drafts.registerPassword = '';
    drafts.registerRol = 'empleado';
  }
  guardarDraftsAuth(drafts);
}

function migrarRegistroLegacy() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (!legacy || localStorage.getItem(STORAGE_KEY)) return;

    const data = crearEstadoInicial();

    if (legacy.ingreso && legacy.ingreso !== '—') {
      data.ultimoIngreso = {
        tipo: 'ingreso',
        nombre: 'Registro anterior',
        rolPersona: 'otro',
        turno: 'matutino',
        incidencia: 'ninguna',
        fechaTexto: legacy.ingreso,
        observacion: 'Migrado desde la versión anterior'
      };
    }

    if (legacy.salida && legacy.salida !== '—') {
      data.ultimaSalida = {
        tipo: 'salida',
        nombre: 'Registro anterior',
        rolPersona: 'otro',
        turno: 'matutino',
        incidencia: 'ninguna',
        fechaTexto: legacy.salida,
        observacion: 'Migrado desde la versión anterior'
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

function obtenerEstadoGuardado() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizarEstado(raw || crearEstadoInicial());
  } catch (error) {
    return crearEstadoInicial();
  }
}

function guardarEstado(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function obtenerElementos() {
  return {
    authShell: document.getElementById('authShell'),
    dashboardShell: document.getElementById('dashboardShell'),
    loginPanel: document.getElementById('loginPanel'),
    registerPanel: document.getElementById('registerPanel'),
    showLogin: document.getElementById('showLogin'),
    showRegister: document.getElementById('showRegister'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginNombre: document.getElementById('loginNombre'),
    loginPassword: document.getElementById('loginPassword'),
    loginStatus: document.getElementById('loginStatus'),
    registerNombre: document.getElementById('registerNombre'),
    registerPassword: document.getElementById('registerPassword'),
    registerRol: document.getElementById('registerRol'),
    registerStatus: document.getElementById('registerStatus'),
    sessionUserName: document.getElementById('sessionUserName'),
    sessionUserRole: document.getElementById('sessionUserRole'),
    sessionRoleChip: document.getElementById('sessionRoleChip'),
    profilePanel: document.querySelector('.profile-panel'),
    profileRole: document.getElementById('profileRole'),
    profileWarnings: document.getElementById('profileWarnings'),
    profileSanctions: document.getElementById('profileSanctions'),
    profileObservation: document.getElementById('profileObservation'),
    togglePasswordPanelButton: document.getElementById('togglePasswordPanel'),
    logoutButton: document.getElementById('cerrarSesion'),
    passwordPanel: document.getElementById('passwordPanel'),
    passwordModal: document.getElementById('passwordModal'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    currentPassword: document.getElementById('currentPassword'),
    newAccountPassword: document.getElementById('newAccountPassword'),
    confirmAccountPassword: document.getElementById('confirmAccountPassword'),
    cancelPasswordPanelButton: document.getElementById('cancelPasswordPanel'),
    closePasswordModalButton: document.getElementById('closePasswordModal'),
    passwordStatus: document.getElementById('passwordStatus'),
    ownerCreateUserForm: document.getElementById('ownerCreateUserForm'),
    ownerCreateUsername: document.getElementById('ownerCreateUsername'),
    ownerCreatePassword: document.getElementById('ownerCreatePassword'),
    ownerCreateRole: document.getElementById('ownerCreateRole'),
    ownerCreateObservation: document.getElementById('ownerCreateObservation'),
    ownerUsersStatus: document.getElementById('ownerUsersStatus'),
    usersBody: document.getElementById('usersBody'),
    userModal: document.getElementById('userModal'),
    closeUserModalButton: document.getElementById('closeUserModal'),
    cancelUserModalButton: document.getElementById('cancelUserModal'),
    editUserForm: document.getElementById('editUserForm'),
    editUserKey: document.getElementById('editUserKey'),
    editUserUsername: document.getElementById('editUserUsername'),
    editUserRole: document.getElementById('editUserRole'),
    editUserPassword: document.getElementById('editUserPassword'),
    editUserWarnings: document.getElementById('editUserWarnings'),
    editUserSanctions: document.getElementById('editUserSanctions'),
    editUserObservation: document.getElementById('editUserObservation'),
    editUserStatus: document.getElementById('editUserStatus'),
    historyModal: document.getElementById('historyModal'),
    closeHistoryModalButton: document.getElementById('closeHistoryModal'),
    cancelHistoryModalButton: document.getElementById('cancelHistoryModal'),
    editHistoryForm: document.getElementById('editHistoryForm'),
    editHistoryIndex: document.getElementById('editHistoryIndex'),
    editHistoryDate: document.getElementById('editHistoryDate'),
    editHistoryType: document.getElementById('editHistoryType'),
    editHistoryName: document.getElementById('editHistoryName'),
    editHistoryRole: document.getElementById('editHistoryRole'),
    editHistoryTurno: document.getElementById('editHistoryTurno'),
    editHistoryIncidencia: document.getElementById('editHistoryIncidencia'),
    editHistoryObservation: document.getElementById('editHistoryObservation'),
    editHistoryStatus: document.getElementById('editHistoryStatus'),
    ownerSections: document.querySelectorAll('[data-owner-section="true"]'),
    employeePlusSections: document.querySelectorAll('[data-employee-plus="true"]'),
    viewerPlusSections: document.querySelectorAll('[data-viewer-plus="true"]'),
    workerControls: document.querySelectorAll('[data-worker-write="true"]'),
    ownerControls: document.querySelectorAll('[data-owner-only="true"]'),
    nombreInput: document.getElementById('nombrePersona'),
    turnoInput: document.getElementById('turnoPersona'),
    incidenciaInput: document.getElementById('incidencia'),
    observacionInput: document.getElementById('observacion'),
    ingresoTime: document.getElementById('ingresoTime'),
    salidaTime: document.getElementById('salidaTime'),
    ultimoIngresoPersona: document.getElementById('ultimoIngresoPersona'),
    ultimaSalidaPersona: document.getElementById('ultimaSalidaPersona'),
    totalMovimientos: document.getElementById('totalMovimientos'),
    resumenHoy: document.getElementById('resumenHoy'),
    totalSemana: document.getElementById('totalSemana'),
    resumenSemana: document.getElementById('resumenSemana'),
    totalMes: document.getElementById('totalMes'),
    resumenMes: document.getElementById('resumenMes'),
    personasHoy: document.getElementById('personasHoy'),
    resumenPersonasHoy: document.getElementById('resumenPersonasHoy'),
    ownerHistoryColumns: document.querySelectorAll('[data-owner-history-column]'),
    historialBody: document.getElementById('historialBody'),
    historyCount: document.getElementById('historyCount'),
    estadoActual: document.getElementById('estadoActual'),
    liveClock: document.getElementById('liveClock'),
    liveDate: document.getElementById('liveDate'),
    filtroNombre: document.getElementById('buscarNombre'),
    filtroPeriodo: document.getElementById('filtroPeriodo'),
    filtroFecha: document.getElementById('filtroFecha'),
    filtroFechaWrap: document.getElementById('fechaFiltroWrap'),
    filtroRol: document.getElementById('filtroRol'),
    filtroTurno: document.getElementById('filtroTurno'),
    filtroIncidencia: document.getElementById('filtroIncidencia'),
    formStatus: document.getElementById('formStatus')
  };
}

function obtenerEtiqueta(mapa, valor) {
  return mapa[valor] || valor || '—';
}

function escapeHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function obtenerInicioSemana(fecha) {
  const copia = new Date(fecha);
  const dia = copia.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + diferencia);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function obtenerFinSemana(fecha) {
  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}

function obtenerFiltros(elements) {
  return {
    nombre: elements.filtroNombre ? elements.filtroNombre.value.trim().toLowerCase() : '',
    periodo: elements.filtroPeriodo ? elements.filtroPeriodo.value : 'todos',
    fecha: elements.filtroFecha ? elements.filtroFecha.value : '',
    rol: elements.filtroRol ? elements.filtroRol.value : 'todos',
    turno: elements.filtroTurno ? elements.filtroTurno.value : 'todos',
    incidencia: elements.filtroIncidencia ? elements.filtroIncidencia.value : 'todos'
  };
}

function movimientoCoincidePeriodo(item, periodo, fechaFiltro) {
  const fecha = obtenerFechaDesdeMovimiento(item);
  if (!fecha) return periodo === 'todos';

  const hoy = new Date();
  if (periodo === 'hoy') return obtenerClaveFecha(fecha) === obtenerClaveFecha(hoy);
  if (periodo === 'semana') return fecha >= obtenerInicioSemana(hoy) && fecha <= obtenerFinSemana(hoy);
  if (periodo === 'mes') return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
  if (periodo === 'fecha') return fechaFiltro ? obtenerClaveFecha(fecha) === fechaFiltro : true;
  return true;
}

function filtrarHistorial(historial, filtros) {
  return historial.filter((item) => {
    const textoBusqueda = `${item.nombre} ${item.observacion}`.toLowerCase();
    const coincideNombre = !filtros.nombre || textoBusqueda.includes(filtros.nombre);
    const coincidePeriodo = movimientoCoincidePeriodo(item, filtros.periodo, filtros.fecha);
    const coincideRol = filtros.rol === 'todos' || item.rolPersona === filtros.rol;
    const coincideTurno = filtros.turno === 'todos' || item.turno === filtros.turno;
    const coincideIncidencia = filtros.incidencia === 'todos' || item.incidencia === filtros.incidencia;
    return coincideNombre && coincidePeriodo && coincideRol && coincideTurno && coincideIncidencia;
  });
}

function filtrarHistorialConIndice(historial, filtros) {
  return historial
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const textoBusqueda = `${item.nombre} ${item.observacion}`.toLowerCase();
      const coincideNombre = !filtros.nombre || textoBusqueda.includes(filtros.nombre);
      const coincidePeriodo = movimientoCoincidePeriodo(item, filtros.periodo, filtros.fecha);
      const coincideRol = filtros.rol === 'todos' || item.rolPersona === filtros.rol;
      const coincideTurno = filtros.turno === 'todos' || item.turno === filtros.turno;
      const coincideIncidencia = filtros.incidencia === 'todos' || item.incidencia === filtros.incidencia;
      return coincideNombre && coincidePeriodo && coincideRol && coincideTurno && coincideIncidencia;
    });
}

function historialVisibleParaUsuario(historial, usuario) {
  if (!usuario) return [];
  if (usuario.rol === 'dueno') return historial;
  return historial.filter((item) => {
    if (item.creadoPorUsernameKey) return item.creadoPorUsernameKey === usuario.usernameKey;
    return normalizarUsername(item.nombre) === usuario.usernameKey;
  });
}

function obtenerMovimientosPorFecha(historial, claveFecha) {
  return historial
    .filter((item) => obtenerClaveFecha(obtenerFechaDesdeMovimiento(item) || new Date()) === claveFecha)
    .slice()
    .sort((a, b) => new Date(a.fechaISO) - new Date(b.fechaISO));
}

function obtenerResumenPeriodo(historial, comparador) {
  return historial.filter((item) => comparador(obtenerFechaDesdeMovimiento(item)));
}

function obtenerPermisosUsuario(usuario) {
  const rol = usuario ? usuario.rol : null;
  return {
    tieneSesion: Boolean(usuario),
    esDueno: rol === 'dueno',
    puedeRegistrar: rol === 'dueno' || rol === 'empleado',
    puedeVerSeguridad: rol === 'dueno',
    puedeVerReportes: rol === 'dueno',
    puedeVerOperacion: rol === 'dueno' || rol === 'empleado',
    puedeVerPanelBase: Boolean(usuario)
  };
}

function obtenerVistaAuthActual() {
  return localStorage.getItem(AUTH_VIEW_KEY) || obtenerDraftsAuth().authView || 'login';
}

function fijarVistaAuth(vista) {
  const nuevaVista = vista === 'register' ? 'register' : 'login';
  localStorage.setItem(AUTH_VIEW_KEY, nuevaVista);
  const drafts = obtenerDraftsAuth();
  drafts.authView = nuevaVista;
  guardarDraftsAuth(drafts);

  const elements = obtenerElementos();
  if (elements.loginPanel) elements.loginPanel.classList.toggle('is-hidden', nuevaVista !== 'login');
  if (elements.registerPanel) elements.registerPanel.classList.toggle('is-hidden', nuevaVista !== 'register');
  if (elements.showLogin) {
    elements.showLogin.classList.toggle('is-active', nuevaVista === 'login');
    elements.showLogin.setAttribute('aria-selected', nuevaVista === 'login' ? 'true' : 'false');
  }
  if (elements.showRegister) {
    elements.showRegister.classList.toggle('is-active', nuevaVista === 'register');
    elements.showRegister.setAttribute('aria-selected', nuevaVista === 'register' ? 'true' : 'false');
  }
}

function actualizarVisibilidadFiltroFecha(elements) {
  if (!elements.filtroFechaWrap || !elements.filtroPeriodo) return;
  elements.filtroFechaWrap.classList.toggle('is-hidden', elements.filtroPeriodo.value !== 'fecha');
}

function restaurarDraftsAuth(elements) {
  const drafts = obtenerDraftsAuth();
  if (elements.loginNombre) elements.loginNombre.value = drafts.loginNombre;
  if (elements.loginPassword) elements.loginPassword.value = drafts.loginPassword;
  if (elements.registerNombre) elements.registerNombre.value = drafts.registerNombre;
  if (elements.registerPassword) elements.registerPassword.value = drafts.registerPassword;
  if (elements.registerRol) elements.registerRol.value = drafts.registerRol || 'empleado';
  fijarVistaAuth('login');
}

function actualizarVistaSesion(elements, usuario) {
  const permisos = obtenerPermisosUsuario(usuario);

  if (elements.authShell) elements.authShell.classList.toggle('is-hidden', permisos.tieneSesion);
  if (elements.dashboardShell) elements.dashboardShell.classList.toggle('is-hidden', !permisos.tieneSesion);
  if (elements.dashboardShell) {
    elements.dashboardShell.classList.toggle('is-owner-view', Boolean(usuario && usuario.rol === 'dueno'));
    elements.dashboardShell.classList.toggle('is-user-view', Boolean(usuario && usuario.rol !== 'dueno'));
  }

  if (!permisos.tieneSesion) return;

  if (elements.sessionUserName) elements.sessionUserName.textContent = usuario.username;
  if (elements.sessionUserRole) {
    elements.sessionUserRole.textContent = permisos.esDueno
      ? 'Acceso total al panel, usuarios, historial y configuración.'
      : permisos.puedeRegistrar
        ? 'Acceso operativo para registrar movimientos.'
        : 'Acceso de consulta al panel.';
  }
  if (elements.sessionRoleChip) elements.sessionRoleChip.textContent = obtenerEtiqueta(LABELS_ROL, usuario.rol);

  elements.ownerSections.forEach((section) => {
    section.classList.toggle('is-hidden', !permisos.puedeVerSeguridad);
  });

  elements.employeePlusSections.forEach((section) => {
    section.classList.toggle('is-hidden', !permisos.puedeVerOperacion);
  });

  elements.viewerPlusSections.forEach((section) => {
    section.classList.toggle('is-hidden', !permisos.puedeVerPanelBase);
  });

  if (elements.profilePanel) {
    elements.profilePanel.classList.toggle('is-hidden', !permisos.puedeVerPanelBase || permisos.esDueno);
  }

  if (elements.ownerHistoryColumns) {
    elements.ownerHistoryColumns.forEach((column) => {
      column.classList.toggle('is-hidden', !permisos.esDueno);
    });
  }

  elements.workerControls.forEach((control) => {
    if ('disabled' in control) control.disabled = !permisos.puedeRegistrar;
  });

  elements.ownerControls.forEach((control) => {
    if ('disabled' in control) control.disabled = !permisos.esDueno;
  });

  if (elements.formStatus) {
    if (permisos.puedeRegistrar) {
      elements.formStatus.textContent = permisos.esDueno
        ? 'Como dueño puedes registrar movimientos, gestionar usuarios, cambiar tu clave y editar el historial.'
        : 'Puedes registrar ingresos y salidas con la cuenta que te asignó el dueño.';
    } else {
      elements.formStatus.textContent = 'Tu rol actual solo permite consulta.';
    }
  }

  if (elements.passwordStatus) {
    elements.passwordStatus.textContent = 'Cada usuario puede cambiar la clave de su propia cuenta.';
  }

  if (elements.nombreInput) {
    if (permisos.esDueno) {
      elements.nombreInput.readOnly = false;
      elements.nombreInput.placeholder = 'Ejemplo: Cristian';
    } else {
      elements.nombreInput.value = usuario.username;
      elements.nombreInput.readOnly = true;
      elements.nombreInput.placeholder = usuario.username;
    }
  }
}

function renderizarFichaUsuarioActual(usuario, elements) {
  if (!usuario) return;
  if (elements.profileRole) elements.profileRole.textContent = obtenerEtiqueta(LABELS_ROL, usuario.rol);
  if (elements.profileWarnings) elements.profileWarnings.textContent = String(usuario.advertencias || 0);
  if (elements.profileSanctions) elements.profileSanctions.textContent = String(usuario.sanciones || 0);
  if (elements.profileObservation) {
    elements.profileObservation.textContent = usuario.observacionUsuario || 'No tienes observaciones registradas.';
  }
}

function renderizarResumenGeneral(data, elements) {
  if (elements.ingresoTime) elements.ingresoTime.textContent = data.ultimoIngreso ? data.ultimoIngreso.fechaTexto : '—';
  if (elements.salidaTime) elements.salidaTime.textContent = data.ultimaSalida ? data.ultimaSalida.fechaTexto : '—';

  if (elements.ultimoIngresoPersona) {
    elements.ultimoIngresoPersona.textContent = data.ultimoIngreso
      ? `${data.ultimoIngreso.nombre} · ${obtenerEtiqueta(LABELS_TURNO, data.ultimoIngreso.turno)}`
      : 'Sin registro';
  }

  if (elements.ultimaSalidaPersona) {
    elements.ultimaSalidaPersona.textContent = data.ultimaSalida
      ? `${data.ultimaSalida.nombre} · ${obtenerEtiqueta(LABELS_TURNO, data.ultimaSalida.turno)}`
      : 'Sin registro';
  }

  const hoyClave = obtenerClaveFecha(new Date());
  const hoy = data.historial.filter((item) => item.fechaDia === hoyClave);
  const hoyIngresos = hoy.filter((item) => item.tipo === 'ingreso').length;
  const hoySalidas = hoy.filter((item) => item.tipo === 'salida').length;

  if (elements.totalMovimientos) elements.totalMovimientos.textContent = hoy.length;
  if (elements.resumenHoy) {
    elements.resumenHoy.textContent = hoy.length
      ? `${hoyIngresos} ingresos y ${hoySalidas} salidas hoy`
      : 'Todavía no hay actividad registrada';
  }

  const semana = obtenerResumenPeriodo(data.historial, (fecha) => {
    if (!fecha) return false;
    return fecha >= obtenerInicioSemana(new Date()) && fecha <= obtenerFinSemana(new Date());
  });

  if (elements.totalSemana) elements.totalSemana.textContent = semana.length;
  if (elements.resumenSemana) {
    const retrasos = semana.filter((item) => item.incidencia === 'retraso').length;
    elements.resumenSemana.textContent = semana.length ? `${retrasos} retrasos en la semana actual` : 'Sin actividad semanal';
  }

  const mes = obtenerResumenPeriodo(data.historial, (fecha) => {
    if (!fecha) return false;
    const hoyFecha = new Date();
    return fecha.getFullYear() === hoyFecha.getFullYear() && fecha.getMonth() === hoyFecha.getMonth();
  });

  if (elements.totalMes) elements.totalMes.textContent = mes.length;
  if (elements.resumenMes) {
    const incidencias = mes.filter((item) => item.incidencia !== 'ninguna').length;
    elements.resumenMes.textContent = mes.length ? `${incidencias} incidencias en el mes actual` : 'Sin actividad mensual';
  }

  const personasUnicasHoy = [...new Set(hoy.map((item) => item.nombre.toLowerCase()))];
  if (elements.personasHoy) elements.personasHoy.textContent = personasUnicasHoy.length;
  if (elements.resumenPersonasHoy) {
    elements.resumenPersonasHoy.textContent = personasUnicasHoy.length
      ? `${personasUnicasHoy.length} personas distintas registradas hoy`
      : 'Sin personas registradas hoy';
  }

  if (elements.estadoActual) {
    const ultimo = data.historial[0];
    if (!ultimo) {
      elements.estadoActual.textContent = 'Sin registros';
      elements.estadoActual.className = 'status-pill';
    } else if (ultimo.tipo === 'ingreso') {
      elements.estadoActual.textContent = 'Estado actual: Dentro del local';
      elements.estadoActual.className = 'status-pill status-in';
    } else {
      elements.estadoActual.textContent = 'Estado actual: Fuera del local';
      elements.estadoActual.className = 'status-pill status-out';
    }
  }
}

function renderizarUsuariosRegistrados(elements) {
  if (!elements.usersBody) return;

  const users = obtenerUsuariosGuardados();
  if (!users.length) {
    elements.usersBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">Todavía no hay usuarios registrados.</td>
      </tr>
    `;
    return;
  }

  elements.usersBody.innerHTML = users.map((user) => `
    <tr>
      <td>${escapeHtml(obtenerEtiqueta(LABELS_ROL, user.rol))}</td>
      <td>${escapeHtml(user.username)}</td>
      <td>${escapeHtml(user.password || '—')}</td>
      <td>${escapeHtml(String(user.advertencias || 0))}</td>
      <td>${escapeHtml(String(user.sanciones || 0))}</td>
      <td>${escapeHtml(user.observacionUsuario || '—')}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="table-action-btn" data-edit-user="${escapeHtml(user.usernameKey)}">Editar</button>
          <button type="button" class="table-action-btn table-action-btn-danger table-action-btn-icon" data-delete-user="${escapeHtml(user.usernameKey)}" aria-label="Eliminar usuario ${escapeHtml(user.username)}" title="Eliminar usuario">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 11h12l1-13H5l1 13Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderizarHistorial(historialFiltrado, totalOriginal, elements, usuarioActual) {
  if (!elements.historialBody) return;
  const esDueno = Boolean(usuarioActual && usuarioActual.rol === 'dueno');
  const colspan = esDueno ? 8 : 6;

  if (!historialFiltrado.length) {
    elements.historialBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="${colspan}">No hay movimientos que coincidan con los filtros actuales.</td>
      </tr>
    `;
  } else {
    elements.historialBody.innerHTML = historialFiltrado.map(({ item, index }) => `
      <tr>
        <td><span class="type-badge ${item.tipo === 'ingreso' ? 'type-in' : 'type-out'}">${item.tipo === 'ingreso' ? 'Ingreso' : 'Salida'}</span></td>
        <td>${escapeHtml(item.nombre)}</td>
        ${esDueno ? `<td>${escapeHtml(obtenerEtiqueta(LABELS_ROL, item.rolPersona))}</td>` : ''}
        <td>${escapeHtml(obtenerEtiqueta(LABELS_TURNO, item.turno))}</td>
        <td>${escapeHtml(obtenerEtiqueta(LABELS_INCIDENCIA, item.incidencia))}</td>
        <td>${escapeHtml(item.fechaTexto)}</td>
        <td>${escapeHtml(item.observacion || '—')}</td>
        ${esDueno ? `<td><div class="table-actions"><button type="button" class="table-action-btn" data-edit-history="${index}">Editar</button><button type="button" class="table-action-btn table-action-btn-danger table-action-btn-icon" data-delete-history="${index}" aria-label="Eliminar movimiento" title="Eliminar movimiento"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 11h12l1-13H5l1 13Z" fill="currentColor"/></svg></button></div></td>` : ''}
      </tr>
    `).join('');
  }

  if (elements.historyCount) elements.historyCount.textContent = `${historialFiltrado.length} de ${totalOriginal} registros`;
}

function renderizarTodo() {
  const data = obtenerEstadoGuardado();
  const elements = obtenerElementos();
  const session = obtenerSesionActual();
  const usuarioActual = session ? obtenerUsuarioPorUsernameKey(session.usernameKey) : null;

  if (session && !usuarioActual) {
    cerrarSesionActual();
    renderizarTodo();
    return;
  }

  restaurarDraftsAuth(elements);
  actualizarVistaSesion(elements, usuarioActual);
  actualizarVisibilidadFiltroFecha(elements);

  if (!usuarioActual) return;

  const historialBase = historialVisibleParaUsuario(data.historial, usuarioActual);
  const filtros = obtenerFiltros(elements);
  const historialFiltrado = filtrarHistorialConIndice(historialBase, filtros);
  renderizarResumenGeneral(data, elements);
  renderizarFichaUsuarioActual(usuarioActual, elements);
  renderizarUsuariosRegistrados(elements);
  renderizarHistorial(historialFiltrado, historialBase.length, elements, usuarioActual);
}

function usuarioPuedeRegistrar() {
  return obtenerPermisosUsuario(obtenerSesionActual()).puedeRegistrar;
}

function usuarioEsDueno() {
  return obtenerPermisosUsuario(obtenerSesionActual()).esDueno;
}

function registrarMovimiento(tipo) {
  if (!usuarioPuedeRegistrar()) {
    alert('Tu rol actual no puede registrar movimientos.');
    return;
  }

  const elements = obtenerElementos();
  const currentSession = obtenerSesionActual();
  const nombre = currentSession && currentSession.rol !== 'dueno'
    ? currentSession.username
    : elements.nombreInput ? elements.nombreInput.value.trim() : '';
  const observacion = elements.observacionInput ? elements.observacionInput.value.trim() : '';
  const rolPersona = currentSession ? currentSession.rol : 'otro';
  const turno = elements.turnoInput ? normalizarTurno(elements.turnoInput.value, true) : 'matutino';
  const incidencia = elements.incidenciaInput ? elements.incidenciaInput.value : 'ninguna';

  if (!nombre) {
    alert('Ingresa un nombre antes de registrar el movimiento.');
    if (elements.nombreInput) elements.nombreInput.focus();
    return;
  }

  const ahora = new Date();
  const data = obtenerEstadoGuardado();
  const movimiento = {
    tipo,
    nombre,
    rolPersona,
    turno,
    incidencia,
    observacion,
    fechaISO: ahora.toISOString(),
    fechaTexto: formatoFechaHora(ahora),
    fechaDia: obtenerClaveFecha(ahora),
    creadoPorUsername: currentSession ? currentSession.username : '',
    creadoPorUsernameKey: currentSession ? currentSession.usernameKey : ''
  };

  data.historial.unshift(movimiento);
  data.ultimoIngreso = tipo === 'ingreso' ? movimiento : obtenerUltimoMovimiento(data.historial, 'ingreso');
  data.ultimaSalida = tipo === 'salida' ? movimiento : obtenerUltimoMovimiento(data.historial, 'salida');
  guardarEstado(data);

  if (elements.observacionInput) elements.observacionInput.value = '';
  if (elements.nombreInput && currentSession && currentSession.rol === 'dueno') elements.nombreInput.value = '';

  renderizarTodo();
}

function limpiarHistorial() {
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede borrar el historial.');
    return;
  }

  if (!window.confirm('Se eliminará todo el historial guardado. ¿Deseas continuar?')) return;

  guardarEstado(crearEstadoInicial());
  renderizarTodo();
}

function escaparCsv(valor) {
  return `"${String(valor || '').replace(/"/g, '""')}"`;
}

function exportarCsv() {
  const data = obtenerEstadoGuardado();
  const elements = obtenerElementos();
  const filtros = obtenerFiltros(elements);
  const historialFiltrado = filtrarHistorial(data.historial, filtros);

  if (!historialFiltrado.length) {
    alert('No hay registros para exportar con los filtros actuales.');
    return;
  }

  const encabezado = ['Tipo', 'Nombre', 'Rol', 'Turno', 'Incidencia', 'Fecha y hora', 'Observacion'];
  const filas = historialFiltrado.map((item) => [
    item.tipo,
    item.nombre,
    obtenerEtiqueta(LABELS_ROL, item.rolPersona),
    obtenerEtiqueta(LABELS_TURNO, item.turno),
    obtenerEtiqueta(LABELS_INCIDENCIA, item.incidencia),
    item.fechaTexto,
    item.observacion || ''
  ]);

  const separador = ';';
  const contenido = [encabezado, ...filas]
    .map((fila) => fila.map(escaparCsv).join(separador))
    .join('\r\n');
  const csv = `\ufeffsep=${separador}\r\n${contenido}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'historial-filtrado-ingreso-salida.csv';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function alternarPanelClave(mostrar) {
  const elements = obtenerElementos();
  if (!elements.passwordModal) return;
  const debeMostrar = typeof mostrar === 'boolean' ? mostrar : elements.passwordModal.classList.contains('is-hidden');
  elements.passwordModal.classList.toggle('is-hidden', !debeMostrar);
  elements.passwordModal.setAttribute('aria-hidden', debeMostrar ? 'false' : 'true');
  if (!debeMostrar) {
    if (elements.currentPassword) elements.currentPassword.value = '';
    if (elements.newAccountPassword) elements.newAccountPassword.value = '';
    if (elements.confirmAccountPassword) elements.confirmAccountPassword.value = '';
  }
}

function cambiarClaveCuenta(event) {
  event.preventDefault();
  const currentSession = obtenerSesionActual();
  if (!currentSession) {
    alert('Debes iniciar sesión para cambiar la clave.');
    return;
  }

  const elements = obtenerElementos();
  const currentPassword = elements.currentPassword ? elements.currentPassword.value : '';
  const newPassword = elements.newAccountPassword ? elements.newAccountPassword.value.trim() : '';
  const confirmPassword = elements.confirmAccountPassword ? elements.confirmAccountPassword.value.trim() : '';
  const users = obtenerUsuariosGuardados();
  const index = users.findIndex((item) => item.usernameKey === currentSession.usernameKey);

  if (index === -1) {
    if (elements.passwordStatus) elements.passwordStatus.textContent = 'No se encontró la cuenta actual.';
    return;
  }

  if (users[index].password !== currentPassword) {
    if (elements.passwordStatus) elements.passwordStatus.textContent = 'La clave actual no coincide.';
    return;
  }

  if (newPassword.length < 4) {
    if (elements.passwordStatus) elements.passwordStatus.textContent = 'La nueva clave debe tener al menos 4 caracteres.';
    return;
  }

  if (newPassword !== confirmPassword) {
    if (elements.passwordStatus) elements.passwordStatus.textContent = 'La confirmación no coincide con la nueva clave.';
    return;
  }

  users[index].password = newPassword;
  guardarUsuarios(users);
  guardarSesionActual(users[index]);
  if (elements.passwordStatus) elements.passwordStatus.textContent = 'Clave actualizada correctamente.';
  alternarPanelClave(false);
}

function alternarModal(elements, modalKey, mostrar) {
  const modal = elements[modalKey];
  if (!modal) return;
  const debeMostrar = typeof mostrar === 'boolean' ? mostrar : modal.classList.contains('is-hidden');
  modal.classList.toggle('is-hidden', !debeMostrar);
  modal.setAttribute('aria-hidden', debeMostrar ? 'false' : 'true');
}

function contarDuenos(users) {
  return users.filter((user) => user.rol === 'dueno').length;
}

function eliminarUsuario(usernameKey) {
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede eliminar usuarios.');
    return;
  }

  const users = obtenerUsuariosGuardados();
  const user = users.find((item) => item.usernameKey === usernameKey);
  if (!user) return;

  if (user.rol === 'dueno' && contarDuenos(users) === 1) {
    alert('Debe permanecer al menos un usuario con rol de dueño.');
    return;
  }

  const sesionActual = obtenerSesionActual();
  if (sesionActual && sesionActual.usernameKey === usernameKey) {
    alert('No puedes eliminar la cuenta con la que estás conectado.');
    return;
  }

  if (!window.confirm(`Se eliminará la cuenta de ${user.username}. ¿Deseas continuar?`)) return;

  guardarUsuarios(users.filter((item) => item.usernameKey !== usernameKey));
  renderizarTodo();
}

function eliminarMovimiento(index) {
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede eliminar movimientos.');
    return;
  }

  const data = obtenerEstadoGuardado();
  const movimiento = data.historial[index];
  if (!movimiento) return;

  if (!window.confirm(`Se eliminará el movimiento de ${movimiento.nombre} del ${movimiento.fechaTexto}. ¿Deseas continuar?`)) return;

  data.historial.splice(index, 1);
  data.ultimoIngreso = obtenerUltimoMovimiento(data.historial, 'ingreso');
  data.ultimaSalida = obtenerUltimoMovimiento(data.historial, 'salida');
  guardarEstado(data);
  renderizarTodo();
}

function crearUsuarioDesdePanel(event) {
  event.preventDefault();
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede registrar usuarios.');
    return;
  }

  const elements = obtenerElementos();
  const username = elements.ownerCreateUsername ? elements.ownerCreateUsername.value.trim() : '';
  const password = elements.ownerCreatePassword ? elements.ownerCreatePassword.value.trim() : '';
  const rol = elements.ownerCreateRole ? elements.ownerCreateRole.value : 'empleado';
  const observacionUsuario = elements.ownerCreateObservation ? elements.ownerCreateObservation.value.trim() : '';

  if (username.length < 3) {
    if (elements.ownerUsersStatus) elements.ownerUsersStatus.textContent = 'El usuario debe tener al menos 3 caracteres.';
    return;
  }

  if (password.length < 4) {
    if (elements.ownerUsersStatus) elements.ownerUsersStatus.textContent = 'La contraseña debe tener al menos 4 caracteres.';
    return;
  }

  const users = obtenerUsuariosGuardados();
  const usernameKey = normalizarUsername(username);
  if (users.some((item) => item.usernameKey === usernameKey)) {
    if (elements.ownerUsersStatus) elements.ownerUsersStatus.textContent = 'Ese usuario ya existe.';
    return;
  }

  users.push(normalizarUsuario({
    username,
    usernameKey,
    password,
    rol: normalizarRolGestionable(rol),
    observacionUsuario,
    advertencias: 0,
    sanciones: 0
  }));
  guardarUsuarios(users);

  if (elements.ownerCreateUserForm) elements.ownerCreateUserForm.reset();
  if (elements.ownerCreateRole) elements.ownerCreateRole.value = 'empleado';
  if (elements.ownerUsersStatus) elements.ownerUsersStatus.textContent = `Usuario ${username} creado correctamente.`;
  renderizarTodo();
}

function abrirEditorUsuario(usernameKey) {
  if (!usuarioEsDueno()) return;
  const user = obtenerUsuarioPorUsernameKey(usernameKey);
  const elements = obtenerElementos();
  if (!user || !elements.userModal) return;

  if (elements.editUserKey) elements.editUserKey.value = user.usernameKey;
  if (elements.editUserUsername) elements.editUserUsername.value = user.username;
  if (elements.editUserRole) elements.editUserRole.value = user.rol;
  if (elements.editUserPassword) elements.editUserPassword.value = user.password;
  if (elements.editUserWarnings) elements.editUserWarnings.value = String(user.advertencias || 0);
  if (elements.editUserSanctions) elements.editUserSanctions.value = String(user.sanciones || 0);
  if (elements.editUserObservation) elements.editUserObservation.value = user.observacionUsuario || '';
  if (elements.editUserStatus) elements.editUserStatus.textContent = `Editando la cuenta de ${user.username}.`;

  alternarModal(elements, 'userModal', true);
}

function guardarEdicionUsuario(event) {
  event.preventDefault();
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede editar usuarios.');
    return;
  }

  const elements = obtenerElementos();
  const usernameKey = elements.editUserKey ? elements.editUserKey.value : '';
  const users = obtenerUsuariosGuardados();
  const index = users.findIndex((item) => item.usernameKey === usernameKey);

  if (index === -1) {
    if (elements.editUserStatus) elements.editUserStatus.textContent = 'No se encontró el usuario seleccionado.';
    return;
  }

  const nuevoRol = elements.editUserRole ? normalizarRolGestionable(elements.editUserRole.value, users[index].rol) : users[index].rol;
  const nuevaClave = elements.editUserPassword ? elements.editUserPassword.value.trim() : users[index].password;
  const nuevasAdvertencias = elements.editUserWarnings ? Math.max(0, Number(elements.editUserWarnings.value || 0)) : 0;
  const nuevasSanciones = elements.editUserSanctions ? Math.max(0, Number(elements.editUserSanctions.value || 0)) : 0;
  const nuevaObservacion = elements.editUserObservation ? elements.editUserObservation.value.trim() : '';

  if (nuevaClave.length < 4) {
    if (elements.editUserStatus) elements.editUserStatus.textContent = 'La contraseña debe tener al menos 4 caracteres.';
    return;
  }

  if (users[index].rol === 'dueno' && nuevoRol !== 'dueno' && contarDuenos(users) === 1) {
    if (elements.editUserStatus) elements.editUserStatus.textContent = 'Debe permanecer al menos un usuario con rol de dueño.';
    return;
  }

  users[index] = normalizarUsuario({
    ...users[index],
    rol: nuevoRol,
    password: nuevaClave,
    advertencias: nuevasAdvertencias,
    sanciones: nuevasSanciones,
    observacionUsuario: nuevaObservacion
  });
  guardarUsuarios(users);

  const sesionActual = obtenerSesionActual();
  if (sesionActual && sesionActual.usernameKey === users[index].usernameKey) {
    guardarSesionActual(users[index]);
  }

  if (elements.editUserStatus) elements.editUserStatus.textContent = 'Usuario actualizado correctamente.';
  alternarModal(elements, 'userModal', false);
  renderizarTodo();
}

function abrirEditorHistorial(index) {
  if (!usuarioEsDueno()) return;
  const data = obtenerEstadoGuardado();
  const item = data.historial[index];
  const elements = obtenerElementos();
  if (!item || !elements.historyModal) return;

  if (elements.editHistoryIndex) elements.editHistoryIndex.value = String(index);
  if (elements.editHistoryDate) elements.editHistoryDate.value = item.fechaTexto;
  if (elements.editHistoryType) elements.editHistoryType.value = item.tipo;
  if (elements.editHistoryName) elements.editHistoryName.value = item.nombre;
  if (elements.editHistoryRole) elements.editHistoryRole.value = obtenerEtiqueta(LABELS_ROL, item.rolPersona);
  if (elements.editHistoryTurno) elements.editHistoryTurno.value = normalizarTurno(item.turno, true);
  if (elements.editHistoryIncidencia) elements.editHistoryIncidencia.value = item.incidencia;
  if (elements.editHistoryObservation) elements.editHistoryObservation.value = item.observacion || '';
  if (elements.editHistoryStatus) elements.editHistoryStatus.textContent = 'Edita los campos necesarios y guarda.';

  alternarModal(elements, 'historyModal', true);
}

function guardarEdicionHistorial(event) {
  event.preventDefault();
  if (!usuarioEsDueno()) {
    alert('Solo el dueño puede editar el historial.');
    return;
  }

  const elements = obtenerElementos();
  const index = Number(elements.editHistoryIndex ? elements.editHistoryIndex.value : -1);
  const data = obtenerEstadoGuardado();
  const actual = data.historial[index];

  if (!actual) {
    if (elements.editHistoryStatus) elements.editHistoryStatus.textContent = 'No se encontró el movimiento seleccionado.';
    return;
  }

  const nombre = elements.editHistoryName ? elements.editHistoryName.value.trim() : '';
  if (!nombre) {
    if (elements.editHistoryStatus) elements.editHistoryStatus.textContent = 'El nombre no puede quedar vacío.';
    return;
  }

  data.historial[index] = normalizarMovimiento({
    ...actual,
    tipo: elements.editHistoryType ? elements.editHistoryType.value : actual.tipo,
    nombre,
    rolPersona: actual.rolPersona,
    turno: elements.editHistoryTurno ? normalizarTurno(elements.editHistoryTurno.value, true) : normalizarTurno(actual.turno, true),
    incidencia: elements.editHistoryIncidencia ? elements.editHistoryIncidencia.value : actual.incidencia,
    observacion: elements.editHistoryObservation ? elements.editHistoryObservation.value.trim() : actual.observacion,
    fechaISO: actual.fechaISO,
    fechaTexto: actual.fechaTexto,
    fechaDia: actual.fechaDia
  });

  data.ultimoIngreso = obtenerUltimoMovimiento(data.historial, 'ingreso');
  data.ultimaSalida = obtenerUltimoMovimiento(data.historial, 'salida');
  guardarEstado(data);

  if (elements.editHistoryStatus) elements.editHistoryStatus.textContent = 'Movimiento actualizado correctamente.';
  alternarModal(elements, 'historyModal', false);
  renderizarTodo();
}

function limpiarFiltros() {
  const elements = obtenerElementos();
  if (elements.filtroNombre) elements.filtroNombre.value = '';
  if (elements.filtroPeriodo) elements.filtroPeriodo.value = 'hoy';
  if (elements.filtroFecha) elements.filtroFecha.value = obtenerClaveFecha(new Date());
  if (elements.filtroRol) elements.filtroRol.value = 'todos';
  if (elements.filtroTurno) elements.filtroTurno.value = 'todos';
  if (elements.filtroIncidencia) elements.filtroIncidencia.value = 'todos';
  renderizarTodo();
}

function actualizarReloj() {
  const ahora = new Date();
  const elements = obtenerElementos();
  if (elements.liveClock) {
    elements.liveClock.textContent = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  if (elements.liveDate) elements.liveDate.textContent = formatoFechaLarga(ahora);
}

function inicializarValoresBase() {
  const elements = obtenerElementos();
  const hoy = obtenerClaveFecha(new Date());
  if (elements.filtroFecha && !elements.filtroFecha.value) elements.filtroFecha.value = hoy;
}

function iniciarSesion(event) {
  event.preventDefault();
  const elements = obtenerElementos();
  const username = elements.loginNombre ? elements.loginNombre.value.trim() : '';
  const password = elements.loginPassword ? elements.loginPassword.value : '';
  const users = obtenerUsuariosGuardados();
  const user = users.find((item) => item.usernameKey === normalizarUsername(username) && item.password === password);

  actualizarDraftsAuth();

  if (!user) {
    fijarVistaAuth('login');
    if (elements.loginStatus) elements.loginStatus.textContent = 'Usuario o contraseña incorrectos.';
    return;
  }

  guardarSesionActual(user);
  limpiarDraftsAuth('login');
  fijarVistaAuth('login');
  if (elements.loginStatus) elements.loginStatus.textContent = `Bienvenido, ${user.username}.`;
  renderizarTodo();
}

function cerrarSesion() {
  cerrarSesionActual();
  alternarPanelClave(false);
  renderizarTodo();
}

function registrarEventos() {
  const elements = obtenerElementos();

  [
    elements.loginNombre,
    elements.loginPassword,
    elements.registerNombre,
    elements.registerPassword,
    elements.registerRol
  ].filter(Boolean).forEach((element) => {
    element.addEventListener('input', actualizarDraftsAuth);
    element.addEventListener('change', actualizarDraftsAuth);
  });

  [
    elements.filtroNombre,
    elements.filtroPeriodo,
    elements.filtroFecha,
    elements.filtroRol,
    elements.filtroTurno,
    elements.filtroIncidencia
  ].filter(Boolean).forEach((element) => {
    element.addEventListener('input', renderizarTodo);
    element.addEventListener('change', renderizarTodo);
  });

  if (elements.loginForm) elements.loginForm.addEventListener('submit', iniciarSesion);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', cerrarSesion);
  if (elements.showLogin) elements.showLogin.addEventListener('click', () => fijarVistaAuth('login'));
  if (elements.showRegister) elements.showRegister.addEventListener('click', () => fijarVistaAuth('register'));
  if (elements.ownerCreateUserForm) elements.ownerCreateUserForm.addEventListener('submit', crearUsuarioDesdePanel);
  if (elements.editUserForm) elements.editUserForm.addEventListener('submit', guardarEdicionUsuario);
  if (elements.editHistoryForm) elements.editHistoryForm.addEventListener('submit', guardarEdicionHistorial);
  if (elements.togglePasswordPanelButton) elements.togglePasswordPanelButton.addEventListener('click', () => alternarPanelClave());
  if (elements.cancelPasswordPanelButton) elements.cancelPasswordPanelButton.addEventListener('click', () => alternarPanelClave(false));
  if (elements.changePasswordForm) elements.changePasswordForm.addEventListener('submit', cambiarClaveCuenta);
  if (elements.closePasswordModalButton) elements.closePasswordModalButton.addEventListener('click', () => alternarPanelClave(false));
  if (elements.closeUserModalButton) elements.closeUserModalButton.addEventListener('click', () => alternarModal(elements, 'userModal', false));
  if (elements.cancelUserModalButton) elements.cancelUserModalButton.addEventListener('click', () => alternarModal(elements, 'userModal', false));
  if (elements.closeHistoryModalButton) elements.closeHistoryModalButton.addEventListener('click', () => alternarModal(elements, 'historyModal', false));
  if (elements.cancelHistoryModalButton) elements.cancelHistoryModalButton.addEventListener('click', () => alternarModal(elements, 'historyModal', false));
  if (elements.passwordModal) {
    elements.passwordModal.addEventListener('click', (event) => {
      if (event.target === elements.passwordModal) alternarPanelClave(false);
    });
  }
  if (elements.userModal) {
    elements.userModal.addEventListener('click', (event) => {
      if (event.target === elements.userModal) alternarModal(elements, 'userModal', false);
    });
  }
  if (elements.historyModal) {
    elements.historyModal.addEventListener('click', (event) => {
      if (event.target === elements.historyModal) alternarModal(elements, 'historyModal', false);
    });
  }
  if (elements.usersBody) {
    elements.usersBody.addEventListener('click', (event) => {
      const botonEditar = event.target.closest('[data-edit-user]');
      if (botonEditar) {
        abrirEditorUsuario(botonEditar.getAttribute('data-edit-user'));
        return;
      }

      const botonEliminar = event.target.closest('[data-delete-user]');
      if (botonEliminar) {
        eliminarUsuario(botonEliminar.getAttribute('data-delete-user'));
      }
    });
  }
  if (elements.historialBody) {
    elements.historialBody.addEventListener('click', (event) => {
      const botonEditar = event.target.closest('[data-edit-history]');
      if (botonEditar) {
        abrirEditorHistorial(Number(botonEditar.getAttribute('data-edit-history')));
        return;
      }

      const botonEliminar = event.target.closest('[data-delete-history]');
      if (botonEliminar) {
        eliminarMovimiento(Number(botonEliminar.getAttribute('data-delete-history')));
      }
    });
  }

  const botonIngreso = document.getElementById('ingreso');
  const botonSalida = document.getElementById('salida');
  const botonLimpiar = document.getElementById('limpiarHistorial');
  const botonExportar = document.getElementById('exportarCsv');
  const botonLimpiarFiltros = document.getElementById('limpiarFiltros');

  if (botonIngreso) botonIngreso.addEventListener('click', () => registrarMovimiento('ingreso'));
  if (botonSalida) botonSalida.addEventListener('click', () => registrarMovimiento('salida'));
  if (botonLimpiar) botonLimpiar.addEventListener('click', limpiarHistorial);
  if (botonExportar) botonExportar.addEventListener('click', exportarCsv);
  if (botonLimpiarFiltros) botonLimpiarFiltros.addEventListener('click', limpiarFiltros);
}

document.addEventListener('DOMContentLoaded', () => {
  migrarRegistroLegacy();
  const seCreoUsuarioInicial = asegurarUsuarioDuenoInicial();
  inicializarValoresBase();
  registrarEventos();
  renderizarTodo();
  if (seCreoUsuarioInicial) {
    const elements = obtenerElementos();
    if (elements.loginStatus) {
      elements.loginStatus.textContent = 'Usuario inicial creado: dueno / 1234. Entra y cambia la clave.';
    }
  }
  actualizarReloj();
  window.setInterval(actualizarReloj, 1000);
});