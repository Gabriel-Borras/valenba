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

  // Map View
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
}

export const translations: Record<Language, Translations> = {
  va: {
    appName: "valenBA",
    navMap: "MAPA",
    navForecast: "PRONÒSTIC",
    navUserLogin: "Iniciar Sessió",
    navUserProfile: "El Meu Compte",

    heroTitle: "Previsió de Disponibilitat",
    heroSubtitle: "El nostre motor d'IA analitza dades històriques i meteorològiques per a estimar si hi haurà bicicletes disponibles quan les necessites.",

    formTitle: "Configurar Predicció",
    formStationLabel: "Carrer o ID de l'Estació",
    formStationPlaceholder: "Carrer de la Pau o 114",
    formStationHint: "Consulta l'ID en el mapa oficial.",
    formDateLabel: "DATA I HORA OBJECTIU",
    formSubmitBtn: "Executar Model Predictiu",
    formCalculating: "Calculant predicció...",
    formErrorValidStation: "Per favor introdueix una estació vàlida.",
    formErrorMaintenance: "L'estació es troba actualment inactiva per manteniment.",
    formErrorDateTime: "Selecciona una data i hora per a la predicció.",
    formErrorConnection: "Error en connectar amb el servidor.",

    waitingInputTitle: "Esperant dades d'entrada",
    waitingInputDesc: "Introdueix l'ID d'una estació i els paràmetres ambientals per a visualitzar la predicció generada pel nostre model.",
    predFor: "Predicció per a",
    predBikesAvailable: "Bicicletes Estimades",
    predUncertaintyMargin: "Marge d'incertesa",
    predCapacity: "Capacitat",
    predOccupancyEst: "Ocupació estimada",
    predSuccessProb: "Probabilitat d'Èxit",
    predModelDev: "Model en desenvolupament. Requereix entrenament previ per a calcular la probabilitat.",
    predSuccessHigh: "Alta",
    predSuccessMedium: "Mitjana",
    predSuccessLow: "Baixa",
    predSuccessHint: "Probabilitat estimada de trobar almenys 1 bicicleta disponible.",
    predWeatherConditions: "Condicions Previstes",
    predTemperature: "Temperatura",
    predRain: "Precipitació",
    predAvailableTag: "disponible",

    mapTitle: "Mapa Interactiu d'Estacions",
    mapSubtitle: "Fes clic en una estació per a seleccionar-la i fer prediccions directes",
    mapBackToForecast: "← Anar al Panell de Previsió",
    mapSelectedStation: "Estació Seleccionada",
    mapSelectHint: "Selecciona un marcador en el mapa o fes clic en la llista inferior per a configurar la predicció.",
    mapMaintenanceNotice: "Aquesta estació està inactiva per manteniment tècnic.",
    mapDocksCapacity: "Capacitat d'Ancoratges",
    mapTotalDocks: "borns totals",
    mapTotalBases: "bases",
    mapOnlyFavsTitle: "Veure només Preferides",
    mapOnlyFavsDesc: "Filtrar estacions en el mapa",
    mapDatasetStations: "Estacions del Dataset",
    mapFavoriteStations: "Estacions Preferides",
    mapMaintenanceTag: "Manteniment",
    mapPopupCapacity: "Capacitat total:",
    mapSelectBtn: "Seleccionar Estació",
    mapForecastPopup: "Previsió",
    mapModelUnavailable: "Model no disponible",

    drawerAccountTitle: "Accés ValenBA",
    drawerAccountSubtitle: "Gestiona les teues preferides i alertes",
    drawerLoginTab: "Iniciar Sessió",
    drawerRegisterTab: "Crear Compte",
    drawerNameLabel: "Nom Complet",
    drawerNamePlaceholder: "Nom complet",
    drawerEmailLabel: "Correu Electrònic",
    drawerEmailPlaceholder: "el_teu_correu@email.com",
    drawerPasswordLabel: "Contrasenya",
    drawerPasswordPlaceholder: "Mínim 4 caràcters",
    drawerLoginBtn: "Entrar al meu Compte",
    drawerRegisterBtn: "Registrar-me De Baldes",
    drawerNoAccount: "Encara no tens compte?",
    drawerHaveAccount: "Ja tens un compte registrat?",
    drawerRegisterLink: "Registra't ací",
    drawerLoginLink: "Inicia sessió",
    drawerLogoutBtn: "Tancar Sessió",
    drawerValenbaUser: "Usuari ValenBA",
    drawerMemberSince: "Des de",
    drawerFavsTitle: "Les Teues Estacions Preferides",
    drawerNoFavs: "Encara no has guardat cap estació preferida. Prem l'estrela en qualsevol estació per a fixar-la ací.",
    drawerFavHint: "Veure en mapa →",
    drawerPredictQuick: "Preveure",
    drawerSyncActive: "Sincronització en base de dades activa",
    drawerUnlimitedAccess: "Accés il·limitat a models predictius Prophet",
    drawerSelectLang: "Idioma / Llengua:"
  },

  es: {
    appName: "valenBA",
    navMap: "MAPA",
    navForecast: "PRONÓSTICO",
    navUserLogin: "Iniciar Sesión",
    navUserProfile: "Mi Cuenta",

    heroTitle: "Previsión de Disponibilidad",
    heroSubtitle: "Nuestro motor de IA analiza datos históricos y meteorológicos para estimar si habrá bicicletas disponibles cuando las necesites.",

    formTitle: "Configurar Predicción",
    formStationLabel: "Calle o ID de la Estación",
    formStationPlaceholder: "Calle de la Paz o 114",
    formStationHint: "Consulta el ID en el mapa oficial.",
    formDateLabel: "FECHA Y HORA TARGET",
    formSubmitBtn: "Ejecutar Modelo Predictivo",
    formCalculating: "Calculando predicción...",
    formErrorValidStation: "Por favor introduce una estación válida.",
    formErrorMaintenance: "La estación se encuentra actualmente inactiva por mantenimiento.",
    formErrorDateTime: "Selecciona una fecha y hora para la predicción.",
    formErrorConnection: "Error al conectar con el servidor.",

    waitingInputTitle: "Esperando datos de entrada",
    waitingInputDesc: "Introduce el ID de una estación y los parámetros ambientales para visualizar la predicción generada por nuestro modelo.",
    predFor: "Predicción para",
    predBikesAvailable: "Bicicletas Estimadas",
    predUncertaintyMargin: "Margen de incertidumbre",
    predCapacity: "Capacidad",
    predOccupancyEst: "Ocupación estimada",
    predSuccessProb: "Probabilidad de Éxito",
    predModelDev: "Modelo en desarrollo. Requiere entrenamiento previo para calcular la probabilidad.",
    predSuccessHigh: "Alta",
    predSuccessMedium: "Media",
    predSuccessLow: "Baja",
    predSuccessHint: "Probabilidad estimada de encontrar al menos 1 bicicleta disponible.",
    predWeatherConditions: "Condiciones Previstas",
    predTemperature: "Temperatura",
    predRain: "Precipitación",
    predAvailableTag: "disponible",

    mapTitle: "Mapa Interactivo de Estaciones",
    mapSubtitle: "Haz clic en una estación para seleccionarla y realizar predicciones directas",
    mapBackToForecast: "← Ir al Panel de Previsión",
    mapSelectedStation: "Estación Seleccionada",
    mapSelectHint: "Selecciona un marcador en el mapa o haz clic en la lista inferior para configurar la predicción.",
    mapMaintenanceNotice: "Esta estación está inactiva por mantenimiento técnico.",
    mapDocksCapacity: "Capacidad de Anclajes",
    mapTotalDocks: "bornes totales",
    mapTotalBases: "bases",
    mapOnlyFavsTitle: "Ver solo Favoritas",
    mapOnlyFavsDesc: "Filtrar estaciones en el mapa",
    mapDatasetStations: "Estaciones del Dataset",
    mapFavoriteStations: "Estaciones Favoritas",
    mapMaintenanceTag: "Mantenimiento",
    mapPopupCapacity: "Capacidad total:",
    mapSelectBtn: "Seleccionar Estación",
    mapForecastPopup: "Previsión",
    mapModelUnavailable: "Modelo no disponible",

    drawerAccountTitle: "Acceso ValenBA",
    drawerAccountSubtitle: "Gestiona tus favoritas y alertas",
    drawerLoginTab: "Iniciar Sesión",
    drawerRegisterTab: "Crear Cuenta",
    drawerNameLabel: "Nombre Completo",
    drawerNamePlaceholder: "Nombre completo",
    drawerEmailLabel: "Correo Electrónico",
    drawerEmailPlaceholder: "tu_correo@email.com",
    drawerPasswordLabel: "Contrasenya",
    drawerPasswordPlaceholder: "Mínimo 4 caracteres",
    drawerLoginBtn: "Entrar a mi Cuenta",
    drawerRegisterBtn: "Registrarme Gratis",
    drawerNoAccount: "¿Aún no tienes cuenta?",
    drawerHaveAccount: "¿Ya tienes una cuenta registrada?",
    drawerRegisterLink: "Regístrate aquí",
    drawerLoginLink: "Inicia sesión",
    drawerLogoutBtn: "Cerrar Sesión",
    drawerValenbaUser: "Usuario ValenBA",
    drawerMemberSince: "Desde",
    drawerFavsTitle: "Tus Estaciones Favoritas",
    drawerNoFavs: "Aún no has guardado ninguna estación favorita. Pulsa la estrella en cualquier estación para fijarla aquí.",
    drawerFavHint: "Ver en mapa →",
    drawerPredictQuick: "Predecir",
    drawerSyncActive: "Sincronización en base de datos activa",
    drawerUnlimitedAccess: "Acceso ilimitado a modelos predictivos Prophet",
    drawerSelectLang: "Idioma / Lengua:"
  },

  en: {
    appName: "valenBA",
    navMap: "MAP",
    navForecast: "FORECAST",
    navUserLogin: "Sign In",
    navUserProfile: "My Account",

    heroTitle: "Availability Forecast",
    heroSubtitle: "Our AI engine analyzes historical and weather data to estimate bike availability right when you need it.",

    formTitle: "Configure Forecast",
    formStationLabel: "Street or Station ID",
    formStationPlaceholder: "Calle de la Paz or 114",
    formStationHint: "Check the station ID on the official map.",
    formDateLabel: "TARGET DATE & TIME",
    formSubmitBtn: "Run Predictive Model",
    formCalculating: "Calculating forecast...",
    formErrorValidStation: "Please enter a valid station.",
    formErrorMaintenance: "This station is currently closed for maintenance.",
    formErrorDateTime: "Please select a date and time for prediction.",
    formErrorConnection: "Error connecting to the server.",

    waitingInputTitle: "Awaiting input data",
    waitingInputDesc: "Enter a station ID and date/time parameters to preview the machine learning forecast.",
    predFor: "Forecast for",
    predBikesAvailable: "Estimated Bikes",
    predUncertaintyMargin: "Uncertainty margin",
    predCapacity: "Capacity",
    predOccupancyEst: "Estimated occupancy",
    predSuccessProb: "Success Probability",
    predModelDev: "Model under development. Requires training to calculate availability probability.",
    predSuccessHigh: "High",
    predSuccessMedium: "Medium",
    predSuccessLow: "Low",
    predSuccessHint: "Estimated chance of finding at least 1 bike available.",
    predWeatherConditions: "Expected Weather",
    predTemperature: "Temperature",
    predRain: "Precipitation",
    predAvailableTag: "available",

    mapTitle: "Interactive Stations Map",
    mapSubtitle: "Click on any station to select it and run direct forecasts",
    mapBackToForecast: "← Go to Forecast Panel",
    mapSelectedStation: "Selected Station",
    mapSelectHint: "Select a pin on the map or click a station in the list below to configure prediction.",
    mapMaintenanceNotice: "This station is out of service for technical maintenance.",
    mapDocksCapacity: "Dock Capacity",
    mapTotalDocks: "total docks",
    mapTotalBases: "bases",
    mapOnlyFavsTitle: "Show Favorites Only",
    mapOnlyFavsDesc: "Filter stations on the map",
    mapDatasetStations: "Dataset Stations",
    mapFavoriteStations: "Favorite Stations",
    mapMaintenanceTag: "Maintenance",
    mapPopupCapacity: "Total capacity:",
    mapSelectBtn: "Select Station",
    mapForecastPopup: "Forecast",
    mapModelUnavailable: "Model unavailable",

    drawerAccountTitle: "ValenBA Access",
    drawerAccountSubtitle: "Manage your favorite stations and alerts",
    drawerLoginTab: "Sign In",
    drawerRegisterTab: "Create Account",
    drawerNameLabel: "Full Name",
    drawerNamePlaceholder: "Full name",
    drawerEmailLabel: "Email Address",
    drawerEmailPlaceholder: "your_email@email.com",
    drawerPasswordLabel: "Password",
    drawerPasswordPlaceholder: "Minimum 4 characters",
    drawerLoginBtn: "Sign In to My Account",
    drawerRegisterBtn: "Register for Free",
    drawerNoAccount: "Don't have an account?",
    drawerHaveAccount: "Already have an account?",
    drawerRegisterLink: "Sign up here",
    drawerLoginLink: "Log in",
    drawerLogoutBtn: "Sign Out",
    drawerValenbaUser: "ValenBA User",
    drawerMemberSince: "Member since",
    drawerFavsTitle: "Your Favorite Stations",
    drawerNoFavs: "No favorite stations saved yet. Click the star icon on any station to pin it here.",
    drawerFavHint: "View on map →",
    drawerPredictQuick: "Forecast",
    drawerSyncActive: "Database synchronization active",
    drawerUnlimitedAccess: "Unlimited access to Prophet AI forecast models",
    drawerSelectLang: "Language:"
  }
};
