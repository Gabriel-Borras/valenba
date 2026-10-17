export type Language = 'va' | 'es' | 'en';

export interface Translations {
  // Header & Nav
  appName: string;
  navMap: string;
  navForecast: string;
  navUserLogin: string;
  navUserProfile: string;

  // Hero / Home View
  heroTitle: string;
  heroSubtitle: string;

  // Form Section
  formTitle: string;
  formStationLabel: string;
  formStationPlaceholder: string;
  formStationHint: string;
  formDateLabel: string;
  formSubmitBtn: string;
  formCalculating: string;
  formErrorValidStation: string;
  formErrorMaintenance: string;
  formErrorDateTime: string;
  formErrorConnection: string;

  // Prediction Result Card
  waitingInputTitle: string;
  waitingInputDesc: string;
  predFor: string;
  predBikesAvailable: string;
  predUncertaintyMargin: string;
  predCapacity: string;
  predOccupancyEst: string;
  predSuccessProb: string;
  predModelDev: string;
  predSuccessHigh: string;
  predSuccessMedium: string;
  predSuccessLow: string;
  predSuccessHint: string;
  predWeatherConditions: string;
  predTemperature: string;
  predRain: string;
  predAvailableTag: string;
  liveNowTitle: string;
  liveBikesNow: string;
  liveFreeDocks: string;
  liveStatusOpen: string;
  liveStatusClosed: string;
  liveUpdated: string;

  // Map View & Controls
  mapTitle: string;
  mapSubtitle: string;
  mapBackToForecast: string;
  mapSelectedStation: string;
  mapSelectHint: string;
  mapMaintenanceNotice: string;
  mapDocksCapacity: string;
  mapTotalDocks: string;
  mapTotalBases: string;
  mapOnlyFavsTitle: string;
  mapOnlyFavsDesc: string;
  mapDatasetStations: string;
  mapFavoriteStations: string;
  mapMaintenanceTag: string;
  mapPopupCapacity: string;
  mapSelectBtn: string;
  mapForecastPopup: string;
  mapModelUnavailable: string;
  layerCartoLight: string;
  layerCartoColor: string;
  layerOsm: string;
  mapSearchPlaceholder: string;
  realTimeBikes: string;
  availableBikes: string;
  renameStation: string;
  favoritesPrefix: string;
  bikesTag: string;
  namePrompt: string;
  activeStationsCount: string;
  tabViewMap: string;
  tabViewPrediction: string;
  btnBackToMap: string;
  mapIntegratedHint: string;
  viewAllStations: string;
  filterOnlyFavorites: string;

  // Station Combobox
  comboboxPlaceholder: string;
  comboboxClear: string;
  comboboxAddFav: string;
  comboboxRemoveFav: string;
  comboboxMatches: string;
  comboboxTotalStations: string;
  comboboxKeyboardHint: string;
  comboboxFavsTitle: string;
  comboboxNoResults: string;
  comboboxNoResultsHint: string;

  // Time Scrubber
  today: string;
  tomorrow: string;
  periodMorning: string;
  periodMidday: string;
  periodAfternoon: string;
  periodNight: string;
  manualSelector: string;
  hideManualSelector: string;
  exactDateTime: string;
  forecastDay: string;
  quickPresets: string;
  presetNow: string;
  preset30m: string;
  preset1h: string;
  preset3h: string;
  presetTomorrow9: string;
  presetTomorrow14: string;

  // User Drawer / Auth
  drawerAccountTitle: string;
  drawerAccountSubtitle: string;
  drawerLoginTab: string;
  drawerRegisterTab: string;
  drawerNameLabel: string;
  drawerNamePlaceholder: string;
  drawerEmailLabel: string;
  drawerEmailPlaceholder: string;
  drawerPasswordLabel: string;
  drawerPasswordPlaceholder: string;
  drawerLoginBtn: string;
  drawerRegisterBtn: string;
  drawerNoAccount: string;
  drawerHaveAccount: string;
  drawerRegisterLink: string;
  drawerLoginLink: string;
  drawerLogoutBtn: string;
  drawerValenbaUser: string;
  drawerMemberSince: string;
  drawerFavsTitle: string;
  drawerNoFavs: string;
  drawerFavHint: string;
  drawerPredictQuick: string;
  drawerSyncActive: string;
  drawerUnlimitedAccess: string;
  drawerSelectLang: string;

  // Footer & Legal / RGPD
  footerDisclaimer: string;
  footerLegalNotice: string;
  footerPrivacyPolicy: string;
  footerRights: string;
  drawerPrivacyConsent: string;
  drawerPrivacyRequired: string;
  legalModalTitle: string;
  legalResponsibleTitle: string;
  legalResponsibleText: string;
  legalPurposeTitle: string;
  legalPurposeText: string;
  legalRightsTitle: string;
  legalRightsText: string;
  legalSecurityTitle: string;
  legalSecurityText: string;
  legalBrandNoticeTitle: string;
  legalBrandNoticeText: string;
  legalCloseBtn: string;

  // Network Telemetry & Urban Mobility Extensions
  networkActiveStations: string;
  networkTotalBikes: string;
  networkTotalDocks: string;
  filterAll: string;
  filterWithBikes: string;
  filterWithDocks: string;
  locateMeBtn: string;
  locateMeSearching: string;
  locateMeError: string;
  legendOptimal: string;
  legendLow: string;
  legendEmpty: string;
  legendFav: string;
  step1Label: string;
  step2Label: string;
  limit72hBadge: string;
  selectedStationLive: string;
  docksFreeLabel: string;
  bikesAvailableLabel: string;
  predFreeDocksEst: string;
  predConfidenceBandTitle: string;
  predConfidenceBandDesc: string;
  planBTitle: string;
  planBWalkTime: string;
  planBSwitchBtn: string;
  methodologyBtn: string;
  methodologyTitle: string;
  methodologySubtitle: string;
  methSec1Title: string;
  methSec1Text: string;
  methSec2Title: string;
  methSec2Text: string;
  methSec3Title: string;
  methSec3Text: string;
  methSec4Title: string;
  methSec4Text: string;
}

export const translations: Record<Language, Translations> = {
  va: {
    appName: "valenBA",
    navMap: "MAPA",
    navForecast: "PRONÒSTIC",
    navUserLogin: "Iniciar Sessió",
    navUserProfile: "El Meu Compte",

    heroTitle: "Previsió de Disponibilitat de Bicicletes",
    heroSubtitle: "Estat en temps real i estimació de disponibilitat a les estacions de Valenbisi.",

    formTitle: "Consulta d'Estació i Horitzó",
    formStationLabel: "Carrer o ID de l'Estació",
    formStationPlaceholder: "Carrer de la Pau o 114",
    formStationHint: "Consulta l'ID en el mapa oficial.",
    formDateLabel: "Data i Hora de Consulta",
    formSubmitBtn: "Consultar Previsió",
    formCalculating: "Calculant previsió...",
    formErrorValidStation: "Per favor introdueix una estació vàlida.",
    formErrorMaintenance: "L'estació es troba actualment inactiva per manteniment.",
    formErrorDateTime: "Selecciona una data i hora per a la previsió.",
    formErrorConnection: "Error en connectar amb el servidor.",

    waitingInputTitle: "Esperant dades d'entrada",
    waitingInputDesc: "Selecciona una estació i una hora per a consultar l'estimació de disponibilitat.",
    predFor: "Previsió per a",
    predBikesAvailable: "Bicicletes Estimades",
    predUncertaintyMargin: "Marge d'incertesa",
    predCapacity: "Capacitat",
    predOccupancyEst: "Ocupació estimada",
    predSuccessProb: "Probabilitat de Disponibilitat",
    predModelDev: "Model en desenvolupament per a aquesta estació.",
    predSuccessHigh: "Alta",
    predSuccessMedium: "Mitjana",
    predSuccessLow: "Baixa",
    predSuccessHint: "Probabilitat estimada de trobar almenys 1 bicicleta disponible.",
    predWeatherConditions: "Meteorologia Prevista",
    predTemperature: "Temperatura",
    predRain: "Precipitació",
    predAvailableTag: "disponible",
    liveNowTitle: "Estat en directe (Valenbisi)",
    liveBikesNow: "bicis disponibles",
    liveFreeDocks: "borns lliures",
    liveStatusOpen: "Estació operativa",
    liveStatusClosed: "Estació tancada",
    liveUpdated: "Actualitzat",

    mapTitle: "Mapa Interactiu d'Estacions",
    mapSubtitle: "Fes clic en una estació per a seleccionar-la i fer prediccions directes",
    mapBackToForecast: "← Anar al Panell de Previsió",
    mapSelectedStation: "Estació Seleccionada",
    mapSelectHint: "Selecciona un marcador en el mapa o fes clic en la llista inferior per a configurar la predicció.",
    mapMaintenanceNotice: "Aquesta estació està inactiva per manteniment tècnic.",
    mapDocksCapacity: "Capacitat d'Ancoratges",
    mapTotalDocks: "borns totals",
    mapTotalBases: "borns",
    mapOnlyFavsTitle: "Veure només Preferides",
    mapOnlyFavsDesc: "Filtrar estacions en el mapa",
    mapDatasetStations: "Estacions del Dataset",
    mapFavoriteStations: "Estacions Preferides",
    mapMaintenanceTag: "Manteniment",
    mapPopupCapacity: "Capacitat total:",
    mapSelectBtn: "Seleccionar Estació",
    mapForecastPopup: "Previsió",
    mapModelUnavailable: "Model no disponible",
    layerCartoLight: "Clar",
    layerCartoColor: "Carrerer",
    layerOsm: "OSM",
    mapSearchPlaceholder: "Cercar per carrer o ID...",
    realTimeBikes: "bicis ara",
    availableBikes: "bicis disponibles",
    renameStation: "Reanomenar estació",
    favoritesPrefix: "Preferides:",
    bikesTag: "bicis",
    namePrompt: "Nom...",
    activeStationsCount: "276 estacions",
    tabViewMap: "Mapa d'Estacions",
    tabViewPrediction: "Fitxa de Previsió",
    btnBackToMap: "Tornar al Mapa",
    mapIntegratedHint: "Fes clic en qualsevol estació per a seleccionar-la",
    viewAllStations: "Totes",
    filterOnlyFavorites: "Preferides",

    comboboxPlaceholder: "Cerca per carrer, número o ID (ex. 114)...",
    comboboxClear: "Esborrar selecció",
    comboboxAddFav: "Afegir a preferides",
    comboboxRemoveFav: "Treure de preferides",
    comboboxMatches: "Coincidències",
    comboboxTotalStations: "276 estacions de Valenbisi",
    comboboxKeyboardHint: "↑↓ Navegar • Enter Seleccionar",
    comboboxFavsTitle: "Les Teues Estacions Preferides",
    comboboxNoResults: "No hem trobat cap estació",
    comboboxNoResultsHint: "Prova amb un altre número d'ID o nom de carrer.",

    today: "Hui",
    tomorrow: "Demà",
    periodMorning: "Matí",
    periodMidday: "Migdia",
    periodAfternoon: "Vesprada",
    periodNight: "Nit",
    manualSelector: "Hora exacta",
    hideManualSelector: "Ocultar",
    exactDateTime: "Data i hora exactes",
    forecastDay: "Dia de consulta:",
    quickPresets: "Ràpid:",
    presetNow: "Ara",
    preset30m: "+30 min",
    preset1h: "+1 h",
    preset3h: "+3 h",
    presetTomorrow9: "Demà 09:00",
    presetTomorrow14: "Demà 14:00",

    drawerAccountTitle: "Compte ValenBA",
    drawerAccountSubtitle: "Sincronitza les teues estacions preferides",
    drawerLoginTab: "Iniciar Sessió",
    drawerRegisterTab: "Crear Compte",
    drawerNameLabel: "Nom Complet",
    drawerNamePlaceholder: "Nom complet",
    drawerEmailLabel: "Correu Electrònic",
    drawerEmailPlaceholder: "el_teu_correu@email.com",
    drawerPasswordLabel: "Contrasenya",
    drawerPasswordPlaceholder: "Mínim 4 caràcters",
    drawerLoginBtn: "Entrar al meu Compte",
    drawerRegisterBtn: "Crear Compte",
    drawerNoAccount: "Encara no tens compte?",
    drawerHaveAccount: "Ja tens un compte registrat?",
    drawerRegisterLink: "Registra't ací",
    drawerLoginLink: "Inicia sessió",
    drawerLogoutBtn: "Tancar Sessió",
    drawerValenbaUser: "Usuari Registrat",
    drawerMemberSince: "Des de",
    drawerFavsTitle: "Les Teues Estacions Preferides",
    drawerNoFavs: "Encara no has guardat cap estació preferida. Prem l'estrela en qualsevol estació per a fixar-la ací.",
    drawerFavHint: "Veure en mapa →",
    drawerPredictQuick: "Consultar",
    drawerSyncActive: "Sincronització d'estacions preferides activa",
    drawerUnlimitedAccess: "Consulta en temps real i previsió a 72 hores vista",
    drawerSelectLang: "Idioma / Llengua:",

    footerDisclaimer: "Valenba és una plataforma analítica i predictiva independent. Valenbisi® és una marca comercial registrada de JCDecaux i de l'Ajuntament de València. Aquesta aplicació no està patrocinada, vinculada ni afiliada oficialment amb aquestes entitats.",
    footerLegalNotice: "Avís Legal",
    footerPrivacyPolicy: "Política de Privacitat",
    footerRights: "Tots els drets reservats.",
    drawerPrivacyConsent: "He llegit i accepte la Política de Privacitat i l'Avís Legal.",
    drawerPrivacyRequired: "Has d'acceptar la Política de Privacitat per a poder registrar-te.",
    legalModalTitle: "Avís Legal i Política de Privacitat (RGPD)",
    legalResponsibleTitle: "1. Responsable del Tractament",
    legalResponsibleText: "El responsable del tractament de les dades recollides a través d'aquesta plataforma és l'equip de desenrotllament de Valenba.",
    legalPurposeTitle: "2. Finalitat i Legitimació",
    legalPurposeText: "Les dades de registre (nom, correu electrònic i estacions preferides) es tracten exclusivament amb el consentiment de l'usuari per a oferir accés personalitzat, sincronització de favorites i persistència de dades. En cap cas es vendran ni cediran a tercers.",
    legalRightsTitle: "3. Els Teus Drets (RGPD / LOPD-GDD)",
    legalRightsText: "Pots exercir els teus drets d'accés, rectificació, supressió (dret a l'oblit), limitació del tractament i portabilitat de dades directament tancant sessió o eliminant el teu compte des del panell d'usuari o contactant amb nosaltres.",
    legalSecurityTitle: "4. Seguretat i Xifratge",
    legalSecurityText: "Les contrasenyes s'emmagatzemen protegides mitjançant algoritmes de resum criptogràfic (hash unidireccional amb sal PBKDF2/SHA-256). Totes les comunicacions es realitzen mitjançant protocols xifrats TLS/HTTPS.",
    legalBrandNoticeTitle: "5. Propietat Industrial i Dades Obertes",
    legalBrandNoticeText: "La informació sobre disponibilitat de bicicletes prové de fonts obertes de dades públiques (Open Data). Valenbisi® és una marca registrada propietat de JCDecaux i de l'Ajuntament de València. Valenba és un servici d'analítica predictiva totalment independent.",
    legalCloseBtn: "Entés i Tancar",

    networkActiveStations: "Estacions actives",
    networkTotalBikes: "Bicis disponibles ara",
    networkTotalDocks: "Borns lliures ara",
    filterAll: "Totes",
    filterWithBikes: "Amb bicis (>0)",
    filterWithDocks: "Amb borns (>0)",
    locateMeBtn: "Prop de mi",
    locateMeSearching: "Localitzant...",
    locateMeError: "No s'ha pogut obtindre la ubicació.",
    legendOptimal: ">5 bicis",
    legendLow: "1-5 bicis",
    legendEmpty: "0 bicis",
    legendFav: "Preferida",
    step1Label: "PAS 01 • ESTACIÓ",
    step2Label: "PAS 02 • HORITZÓ TEMPORAL",
    limit72hBadge: "Horitzó 72h",
    selectedStationLive: "Estat actual en estació",
    docksFreeLabel: "Borns lliures",
    bikesAvailableLabel: "Bicis disponibles",
    predFreeDocksEst: "Borns Lliures Estimats",
    predConfidenceBandTitle: "Interval de Confiança (95%)",
    predConfidenceBandDesc: "Forquilla estadística esperada segons la variabilitat històrica de l'estació.",
    planBTitle: "Alternativa més pròxima (Pla B)",
    planBWalkTime: "min a peu",
    planBSwitchBtn: "Seleccionar estació →",
    methodologyBtn: "Metodologia",
    methodologyTitle: "Metodologia i Arquitectura de Dades",
    methodologySubtitle: "Sistema de telemetria en temps real i previsió estadística a 72 hores vista per a la xarxa Valenbisi",
    methSec1Title: "1. Telemetria en Temps Real (Open Data / JCDecaux)",
    methSec1Text: "L'estat operatiu actual de les 276 estacions de València (bicicletes disponibles en base i borns d'ancoratge lliures) se sincronitza contínuament cada 30 segons. Això permet contrastar l'inventari físic immediat amb la corba d'estimació futura.",
    methSec2Title: "2. Model Estructural amb Transformació Logit Acotada",
    methSec2Text: "Per a previsions a mitjà termini (fins a 72 hores vista), l'inventari es modela sobre un espai Logit restringit físicament entre 0 i la capacitat total de cada estació. S'incorporen sèries de Fourier condicionals diferenciant règims laborables (ordre 30) i festius del calendari oficial valencià (ordre 10).",
    methSec3Title: "3. Regressors Meteorològics Exògens (Open-Meteo)",
    methSec3Text: "Cada consulta integra la previsió meteorològica horària per a les coordenades de València: temperatura aparent, intensitat de precipitació i ratxes de vent, ponderades mitjançant funcions de pertinença contínues.",
    methSec4Title: "4. Intervals de Confiança i Estació Alternativa (Pla B)",
    methSec4Text: "Tota estimació puntual s'acompanya del seu interval d'incertesa [mínim — màxim] i de la probabilitat d'èxit. A més, es calcula per distància geodèsica (Haversine) l'estació operativa més pròxima com a alternativa immediata."
  },

  es: {
    appName: "valenBA",
    navMap: "MAPA",
    navForecast: "PRONÓSTICO",
    navUserLogin: "Iniciar Sesión",
    navUserProfile: "Mi Cuenta",

    heroTitle: "Previsión de Disponibilidad de Bicicletas",
    heroSubtitle: "Estado en tiempo real y estimación de disponibilidad en las estaciones de Valenbisi.",

    formTitle: "Consulta de Estación y Horizonte",
    formStationLabel: "Calle o ID de la Estación",
    formStationPlaceholder: "Calle de la Paz o 114",
    formStationHint: "Consulta el ID en el mapa oficial.",
    formDateLabel: "Fecha y Hora de Consulta",
    formSubmitBtn: "Consultar Previsión",
    formCalculating: "Calculando previsión...",
    formErrorValidStation: "Por favor introduce una estación válida.",
    formErrorMaintenance: "La estación se encuentra actualmente inactiva por mantenimiento.",
    formErrorDateTime: "Selecciona una fecha y hora para la previsión.",
    formErrorConnection: "Error al conectar con el servidor.",

    waitingInputTitle: "Esperando datos de entrada",
    waitingInputDesc: "Selecciona una estación y una hora para consultar la estimación de disponibilidad.",
    predFor: "Previsión para",
    predBikesAvailable: "Bicicletas Estimadas",
    predUncertaintyMargin: "Margen de incertidumbre",
    predCapacity: "Capacidad",
    predOccupancyEst: "Ocupación estimada",
    predSuccessProb: "Probabilidad de Disponibilidad",
    predModelDev: "Modelo en desarrollo para esta estación.",
    predSuccessHigh: "Alta",
    predSuccessMedium: "Media",
    predSuccessLow: "Baja",
    predSuccessHint: "Probabilidad estimada de encontrar al menos 1 bicicleta disponible.",
    predWeatherConditions: "Meteorología Prevista",
    predTemperature: "Temperatura",
    predRain: "Precipitación",
    predAvailableTag: "disponible",
    liveNowTitle: "Estado en directo (Valenbisi)",
    liveBikesNow: "bicis disponibles",
    liveFreeDocks: "anclajes libres",
    liveStatusOpen: "Estación operativa",
    liveStatusClosed: "Estación cerrada",
    liveUpdated: "Actualizado",

    mapTitle: "Mapa Interactivo de Estaciones",
    mapSubtitle: "Haz clic en una estación para seleccionarla y realizar predicciones directas",
    mapBackToForecast: "← Ir al Panel de Previsión",
    mapSelectedStation: "Estación Seleccionada",
    mapSelectHint: "Selecciona un marcador en el mapa o haz clic en la lista inferior para configurar la predicción.",
    mapMaintenanceNotice: "Esta estación está inactiva por mantenimiento técnico.",
    mapDocksCapacity: "Capacidad de Anclajes",
    mapTotalDocks: "bornes totales",
    mapTotalBases: "anclajes",
    mapOnlyFavsTitle: "Ver solo Favoritas",
    mapOnlyFavsDesc: "Filtrar estaciones en el mapa",
    mapDatasetStations: "Estaciones del Dataset",
    mapFavoriteStations: "Estaciones Favoritas",
    mapMaintenanceTag: "Mantenimiento",
    mapPopupCapacity: "Capacidad total:",
    mapSelectBtn: "Seleccionar Estación",
    mapForecastPopup: "Previsión",
    mapModelUnavailable: "Modelo no disponible",
    layerCartoLight: "Claro",
    layerCartoColor: "Callejero",
    layerOsm: "OSM",
    mapSearchPlaceholder: "Buscar por calle o ID...",
    realTimeBikes: "bicis ahora",
    availableBikes: "bicis disponibles",
    renameStation: "Renombrar estación",
    favoritesPrefix: "Favoritas:",
    bikesTag: "bicis",
    namePrompt: "Nombre...",
    activeStationsCount: "276 estaciones",
    tabViewMap: "Mapa de Estaciones",
    tabViewPrediction: "Ficha de Previsión",
    btnBackToMap: "Volver al Mapa",
    mapIntegratedHint: "Haz clic en cualquier estación para seleccionarla",
    viewAllStations: "Todas",
    filterOnlyFavorites: "Favoritas",

    comboboxPlaceholder: "Busca por calle, número o ID (ej. 114)...",
    comboboxClear: "Borrar selección",
    comboboxAddFav: "Añadir a favoritas",
    comboboxRemoveFav: "Quitar de favoritas",
    comboboxMatches: "Coincidencias",
    comboboxTotalStations: "276 estaciones de Valenbisi",
    comboboxKeyboardHint: "↑↓ Navegar • Enter Seleccionar",
    comboboxFavsTitle: "Tus Estaciones Favoritas",
    comboboxNoResults: "No encontramos ninguna estación",
    comboboxNoResultsHint: "Prueba con otro número de ID o nombre de calle.",

    today: "Hoy",
    tomorrow: "Mañana",
    periodMorning: "Mañana",
    periodMidday: "Mediodía",
    periodAfternoon: "Tarde",
    periodNight: "Noche",
    manualSelector: "Hora exacta",
    hideManualSelector: "Ocultar",
    exactDateTime: "Fecha y hora exactas",
    forecastDay: "Día de consulta:",
    quickPresets: "Rápido:",
    presetNow: "Ahora",
    preset30m: "+30 min",
    preset1h: "+1 h",
    preset3h: "+3 h",
    presetTomorrow9: "Mañana 09:00",
    presetTomorrow14: "Mañana 14:00",

    drawerAccountTitle: "Cuenta ValenBA",
    drawerAccountSubtitle: "Sincroniza tus estaciones favoritas",
    drawerLoginTab: "Iniciar Sesión",
    drawerRegisterTab: "Crear Cuenta",
    drawerNameLabel: "Nombre Completo",
    drawerNamePlaceholder: "Nombre completo",
    drawerEmailLabel: "Correo Electrónico",
    drawerEmailPlaceholder: "tu_correo@email.com",
    drawerPasswordLabel: "Contraseña",
    drawerPasswordPlaceholder: "Mínimo 4 caracteres",
    drawerLoginBtn: "Entrar a mi Cuenta",
    drawerRegisterBtn: "Crear Cuenta",
    drawerNoAccount: "¿Aún no tienes cuenta?",
    drawerHaveAccount: "¿Ya tienes una cuenta registrada?",
    drawerRegisterLink: "Regístrate aquí",
    drawerLoginLink: "Inicia sesión",
    drawerLogoutBtn: "Cerrar Sesión",
    drawerValenbaUser: "Usuario Registrado",
    drawerMemberSince: "Desde",
    drawerFavsTitle: "Tus Estaciones Favoritas",
    drawerNoFavs: "Aún no has guardado ninguna estación favorita. Pulsa la estrella en cualquier estación para fijarla aquí.",
    drawerFavHint: "Ver en mapa →",
    drawerPredictQuick: "Consultar",
    drawerSyncActive: "Sincronización de estaciones favoritas activa",
    drawerUnlimitedAccess: "Consulta en tiempo real y previsión a 72 horas vista",
    drawerSelectLang: "Idioma / Lengua:",

    footerDisclaimer: "Valenba es una plataforma analítica y predictiva independiente. Valenbisi® es una marca comercial registrada de JCDecaux y del Ayuntamiento de Valencia. Esta aplicación no está respaldada, patrocinada ni afiliada oficialmente con dichas entidades.",
    footerLegalNotice: "Aviso Legal",
    footerPrivacyPolicy: "Política de Privacidad",
    footerRights: "Todos los derechos reservados.",
    drawerPrivacyConsent: "He leído y acepto la Política de Privacidad y el Aviso Legal.",
    drawerPrivacyRequired: "Debes aceptar la Política de Privacidad para poder registrarte.",
    legalModalTitle: "Aviso Legal y Política de Privacidad (RGPD)",
    legalResponsibleTitle: "1. Responsable del Tratamiento",
    legalResponsibleText: "El responsable del tratamiento de los datos recopilados a través de esta plataforma es el equipo de desarrollo de Valenba.",
    legalPurposeTitle: "2. Finalidad y Legitimación",
    legalPurposeText: "Los datos facilitados durante el registro (nombre, correo electrónico y estaciones favoritas) son tratados bajo el consentimiento del usuario con la única finalidad de permitir el acceso a su cuenta personalizada, sincronización de favoritas y persistencia de datos. Bajo ninguna circunstancia se cederán a terceros.",
    legalRightsTitle: "3. Tus Derechos (RGPD / LOPD-GDD)",
    legalRightsText: "Tienes derecho a acceder, rectificar, limitar o solicitar la supresión completa de tus datos personales (derecho al olvido) en cualquier momento desde los ajustes de tu cuenta o contactando con nuestro soporte.",
    legalSecurityTitle: "4. Seguridad y Cifrado",
    legalSecurityText: "Las contraseñas se almacenan protegidas mediante algoritmos de hash unidireccional con sal (PBKDF2/SHA-256). Todas las transmisiones cliente-servidor se encuentran protegidas mediante cifrado TLS/HTTPS.",
    legalBrandNoticeTitle: "5. Propiedad Industrial y Fuentes Abiertas",
    legalBrandNoticeText: "La información de disponibilidad de bicicletas se obtiene de portales de datos abiertos (Open Data). Valenbisi® es una marca registrada de JCDecaux y del Ayuntamiento de Valencia. Valenba opera como un servicio de inteligencia predictiva independiente.",
    legalCloseBtn: "Entendido y Cerrar",

    networkActiveStations: "Estaciones activas",
    networkTotalBikes: "Bicis disponibles ahora",
    networkTotalDocks: "Anclajes libres ahora",
    filterAll: "Todas",
    filterWithBikes: "Con bicis (>0)",
    filterWithDocks: "Con anclajes (>0)",
    locateMeBtn: "Cerca de mí",
    locateMeSearching: "Localizando...",
    locateMeError: "No se pudo obtener la ubicación.",
    legendOptimal: ">5 bicis",
    legendLow: "1-5 bicis",
    legendEmpty: "0 bicis",
    legendFav: "Favorita",
    step1Label: "PASO 01 • ESTACIÓN",
    step2Label: "PASO 02 • HORIZONTE TEMPORAL",
    limit72hBadge: "Horizonte 72h",
    selectedStationLive: "Estado actual en estación",
    docksFreeLabel: "Anclajes libres",
    bikesAvailableLabel: "Bicis disponibles",
    predFreeDocksEst: "Anclajes Libres Estimados",
    predConfidenceBandTitle: "Intervalo de Confianza (95%)",
    predConfidenceBandDesc: "Horquilla estadística esperada según la variabilidad histórica de la estación.",
    planBTitle: "Alternativa más cercana (Plan B)",
    planBWalkTime: "min a pie",
    planBSwitchBtn: "Seleccionar estación →",
    methodologyBtn: "Metodología",
    methodologyTitle: "Metodología y Arquitectura de Datos",
    methodologySubtitle: "Sistema de telemetría en tiempo real y previsión estadística a 72 horas vista para la red Valenbisi",
    methSec1Title: "1. Telemetría en Tiempo Real (Open Data / JCDecaux)",
    methSec1Text: "El estado operativo actual de las 276 estaciones de Valencia (bicicletas disponibles en base y bornes de anclaje libres) se sincroniza continuamente cada 30 segundos. Esto permite contrastar el inventario físico inmediato con la curva de estimación futura.",
    methSec2Title: "2. Modelo Estructural con Transformación Logit Acotada",
    methSec2Text: "Para previsiones a medio plazo (hasta 72 horas vista), el inventario se modela sobre un espacio Logit restringido físicamente entre 0 y la capacidad total de cada estación. Se incorporan series de Fourier condicionales diferenciando regímenes laborables (orden 30) y festivos del calendario oficial valenciano (orden 10).",
    methSec3Title: "3. Regresores Meteorológicos Exógenos (Open-Meteo)",
    methSec3Text: "Cada consulta integra la previsión meteorológica horaria para las coordenadas de Valencia: temperatura aparente, intensidad de precipitación y rachas de viento, ponderadas mediante funciones de pertenencia continuas.",
    methSec4Title: "4. Intervalos de Confianza y Estación Alternativa (Plan B)",
    methSec4Text: "Toda estimación puntual se acompaña de su intervalo de incertidumbre [mínimo — máximo] y de la probabilidad de éxito. Además, se calcula por distancia geodésica (Haversine) la estación operativa más próxima como alternativa inmediata."
  },

  en: {
    appName: "valenBA",
    navMap: "MAP",
    navForecast: "FORECAST",
    navUserLogin: "Sign In",
    navUserProfile: "My Account",

    heroTitle: "Bicycle Availability Forecast",
    heroSubtitle: "Real-time status and availability forecast across Valenbisi stations.",

    formTitle: "Station & Horizon Inquiry",
    formStationLabel: "Street or Station ID",
    formStationPlaceholder: "Calle de la Paz or 114",
    formStationHint: "Check the station ID on the official map.",
    formDateLabel: "Inquiry Date & Time",
    formSubmitBtn: "Check Forecast",
    formCalculating: "Calculating forecast...",
    formErrorValidStation: "Please enter a valid station.",
    formErrorMaintenance: "This station is currently closed for maintenance.",
    formErrorDateTime: "Please select a date and time for prediction.",
    formErrorConnection: "Error connecting to the server.",

    waitingInputTitle: "Awaiting input data",
    waitingInputDesc: "Select a station and date/time to check the availability forecast.",
    predFor: "Forecast for",
    predBikesAvailable: "Estimated Bikes",
    predUncertaintyMargin: "Uncertainty margin",
    predCapacity: "Capacity",
    predOccupancyEst: "Estimated occupancy",
    predSuccessProb: "Availability Probability",
    predModelDev: "Model under development for this station.",
    predSuccessHigh: "High",
    predSuccessMedium: "Medium",
    predSuccessLow: "Low",
    predSuccessHint: "Estimated chance of finding at least 1 bike available.",
    predWeatherConditions: "Expected Weather",
    predTemperature: "Temperature",
    predRain: "Precipitation",
    predAvailableTag: "available",
    liveNowTitle: "Live status (Valenbisi)",
    liveBikesNow: "bikes available",
    liveFreeDocks: "free docks",
    liveStatusOpen: "Station active",
    liveStatusClosed: "Station closed",
    liveUpdated: "Updated",

    mapTitle: "Interactive Stations Map",
    mapSubtitle: "Click on any station to select it and run direct forecasts",
    mapBackToForecast: "← Go to Forecast Panel",
    mapSelectedStation: "Selected Station",
    mapSelectHint: "Select a pin on the map or click a station in the list below to configure prediction.",
    mapMaintenanceNotice: "This station is out of service for technical maintenance.",
    mapDocksCapacity: "Dock Capacity",
    mapTotalDocks: "total docks",
    mapTotalBases: "docks",
    mapOnlyFavsTitle: "Show Favorites Only",
    mapOnlyFavsDesc: "Filter stations on the map",
    mapDatasetStations: "Dataset Stations",
    mapFavoriteStations: "Favorite Stations",
    mapMaintenanceTag: "Maintenance",
    mapPopupCapacity: "Total capacity:",
    mapSelectBtn: "Select Station",
    mapForecastPopup: "Forecast",
    mapModelUnavailable: "Model unavailable",
    layerCartoLight: "Light",
    layerCartoColor: "Streets",
    layerOsm: "OSM",
    mapSearchPlaceholder: "Search by street or ID...",
    realTimeBikes: "bikes now",
    availableBikes: "available bikes",
    renameStation: "Rename station",
    favoritesPrefix: "Favorites:",
    bikesTag: "bikes",
    namePrompt: "Name...",
    activeStationsCount: "276 stations",
    tabViewMap: "Stations Map",
    tabViewPrediction: "Forecast Sheet",
    btnBackToMap: "Back to Map",
    mapIntegratedHint: "Click any station on the map to select it",
    viewAllStations: "All",
    filterOnlyFavorites: "Favorites",

    comboboxPlaceholder: "Search by street, number or ID (e.g. 114)...",
    comboboxClear: "Clear selection",
    comboboxAddFav: "Add to favorites",
    comboboxRemoveFav: "Remove from favorites",
    comboboxMatches: "Matches",
    comboboxTotalStations: "276 Valenbisi stations",
    comboboxKeyboardHint: "↑↓ Navigate • Enter Select",
    comboboxFavsTitle: "Your Favorite Stations",
    comboboxNoResults: "No stations found",
    comboboxNoResultsHint: "Try another ID number or street name.",

    today: "Today",
    tomorrow: "Tomorrow",
    periodMorning: "Morning",
    periodMidday: "Midday",
    periodAfternoon: "Afternoon",
    periodNight: "Night",
    manualSelector: "Exact time",
    hideManualSelector: "Hide",
    exactDateTime: "Exact date and time",
    forecastDay: "Forecast day:",
    quickPresets: "Quick:",
    presetNow: "Now",
    preset30m: "+30 min",
    preset1h: "+1 h",
    preset3h: "+3 h",
    presetTomorrow9: "Tomorrow 09:00",
    presetTomorrow14: "Tomorrow 14:00",

    drawerAccountTitle: "ValenBA Account",
    drawerAccountSubtitle: "Synchronize your favorite stations",
    drawerLoginTab: "Sign In",
    drawerRegisterTab: "Create Account",
    drawerNameLabel: "Full Name",
    drawerNamePlaceholder: "Full name",
    drawerEmailLabel: "Email Address",
    drawerEmailPlaceholder: "your_email@email.com",
    drawerPasswordLabel: "Password",
    drawerPasswordPlaceholder: "Minimum 4 characters",
    drawerLoginBtn: "Sign In to My Account",
    drawerRegisterBtn: "Create Account",
    drawerNoAccount: "Don't have an account?",
    drawerHaveAccount: "Already have an account?",
    drawerRegisterLink: "Sign up here",
    drawerLoginLink: "Log in",
    drawerLogoutBtn: "Sign Out",
    drawerValenbaUser: "Registered User",
    drawerMemberSince: "Since",
    drawerFavsTitle: "Your Favorite Stations",
    drawerNoFavs: "No favorite stations saved yet. Click the star icon on any station to pin it here.",
    drawerFavHint: "View on map →",
    drawerPredictQuick: "Check",
    drawerSyncActive: "Favorite stations synchronization active",
    drawerUnlimitedAccess: "Real-time telemetry & 72-hour statistical forecasts",
    drawerSelectLang: "Language:",

    footerDisclaimer: "Valenba is an independent analytical and predictive platform. Valenbisi® is a registered trademark of JCDecaux and Valencia City Council. This application is not officially endorsed, sponsored, or affiliated with these entities.",
    footerLegalNotice: "Legal Notice",
    footerPrivacyPolicy: "Privacy Policy",
    footerRights: "All rights reserved.",
    drawerPrivacyConsent: "I have read and agree to the Privacy Policy and Legal Notice.",
    drawerPrivacyRequired: "You must accept the Privacy Policy to register.",
    legalModalTitle: "Legal Notice & Privacy Policy (GDPR)",
    legalResponsibleTitle: "1. Data Controller",
    legalResponsibleText: "The data controller responsible for the personal data collected through this application is the Valenba Development Team.",
    legalPurposeTitle: "2. Purpose and Legal Basis",
    legalPurposeText: "Data provided upon registration (name, email address, and favorite stations) is processed solely with your explicit consent to manage your personal account, synchronize favorites, and persist preferences. We never share or sell personal data to third parties.",
    legalRightsTitle: "3. Your Rights (GDPR)",
    legalRightsText: "You are entitled to access, rectify, limit processing, or request full deletion of your personal data at any time directly through your account drawer or by reaching out to support.",
    legalSecurityTitle: "4. Security & Encryption",
    legalSecurityText: "User passwords are secure using one-way salted hashing algorithms (PBKDF2/SHA-256). All communications are protected over secure encrypted TLS/HTTPS protocols.",
    legalBrandNoticeTitle: "5. Intellectual Property & Open Data",
    legalBrandNoticeText: "Real-time bicycle inventory is sourced via Open Data feeds. Valenbisi® is a registered trademark of JCDecaux and Valencia City Council. Valenba is an autonomous predictive intelligence project.",
    legalCloseBtn: "Understood & Close",

    networkActiveStations: "Active stations",
    networkTotalBikes: "Bikes available now",
    networkTotalDocks: "Free docks now",
    filterAll: "All",
    filterWithBikes: "With bikes (>0)",
    filterWithDocks: "With docks (>0)",
    locateMeBtn: "Near me",
    locateMeSearching: "Locating...",
    locateMeError: "Could not retrieve location.",
    legendOptimal: ">5 bikes",
    legendLow: "1-5 bikes",
    legendEmpty: "0 bikes",
    legendFav: "Favorite",
    step1Label: "STEP 01 • STATION",
    step2Label: "STEP 02 • TIME HORIZON",
    limit72hBadge: "72h Horizon",
    selectedStationLive: "Current station status",
    docksFreeLabel: "Free docks",
    bikesAvailableLabel: "Available bikes",
    predFreeDocksEst: "Estimated Free Docks",
    predConfidenceBandTitle: "Confidence Interval (95%)",
    predConfidenceBandDesc: "Expected statistical bracket based on historical station variability.",
    planBTitle: "Nearest Alternative (Plan B)",
    planBWalkTime: "min walk",
    planBSwitchBtn: "Select station →",
    methodologyBtn: "Methodology",
    methodologyTitle: "Methodology & Data Architecture",
    methodologySubtitle: "Real-time telemetry and 72-hour statistical forecasting system for the Valenbisi network",
    methSec1Title: "1. Real-Time Telemetry (Open Data / JCDecaux)",
    methSec1Text: "The live operational status of all 276 stations in Valencia (available bicycles and free docking points) is synchronized every 30 seconds, allowing direct comparison between immediate inventory and future projections.",
    methSec2Title: "2. Structural Model with Bounded Logit Transformation",
    methSec2Text: "For medium-range horizons (up to 72 hours ahead), station inventory is modeled within a bounded Logit space strictly constrained between 0 and total station capacity. Conditional Fourier series capture distinct working-day (order 30) and official Valencia holiday (order 10) regimes.",
    methSec3Title: "3. Exogenous Weather Regressors (Open-Meteo)",
    methSec3Text: "Every forecast incorporates hourly meteorological projections for Valencia's coordinates: apparent temperature, precipitation intensity, and wind gusts, weighted through continuous membership functions.",
    methSec4Title: "4. Confidence Intervals & Geodesic Alternative (Plan B)",
    methSec4Text: "Each point estimate includes its [min — max] uncertainty bracket and availability probability. Furthermore, Haversine geodesic distance is used to automatically identify the closest operational backup station."
  }
};
