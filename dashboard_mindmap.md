# Mapa Mental de Quelora-Dashboard

He encontrado un archivo `mindmap.md` en el proyecto que ya contiene una excelente visualización de las funcionalidades. Aquí te presento el mapa mental para `quelora-dashboard`:

```mermaid
mindmap
  root((quelora-dashboard))
    Stack
      React 18 + React Router 6
      Material UI v7
      Axios + interceptores JWT
      i18next 12 idiomas
      Recharts / Victory / Sparklines
      Mapbox GL / Leaflet / Simple Maps
      React Quill editor rico
      React Image Crop
      SweetAlert2
      date-fns / React Datepicker
      Crypto-JS / QR Code
    Arquitectura
      SPA Create React App
      DashboardLayout
        Sidebar
        TopBar
        ConsoleDrawer dev
      EmbedLayout
      PrivateRoute RBAC
      UserContext estado global
      embedStorage localStorage-sessionStorage
      axiosConfig JWT + descompresión
    Rutas
      /login
      / Dashboard
      /profile
      /client/:cid
      /client/:cid/posts
      /post/:pid y stats y comments
      /user/:uid
      /trash
      /reports
      /profile-analytics
      /moderation-analytics
      /surveys
      /campaigns
      /placements
      /placement-pricing
      /advertiser-profiles
      /system-users
      /gamification
    Módulos
      Auth
        Login
        LanguageSelector
      Dashboard
        StatsCards
        Charts actividad
        GeoDistribution
      Client
        ClientList y Card
        CorsConfig
        CaptchaConfig
        CommentsConfig
        AuthWidgetConfig
      Post
        GeneralTab
        AdvancedTab
        AudioTab
        CommentsTab
        LiveTab
      User
        UserList
        UserAnalytics
        UserCommentsModal
      Campaign
        GeneralTab
        BudgetTab
        CreativesTab
        DeliveryTab
        GeoTargetingTab
        BannerCropper
      Survey
        GeneralTab
        OptionsTab
        PostsTab
      Advertiser
        AdvertiserProfileForm
        BackgroundCropper
      Placement
        PlacementForm
        PricingForm
      Gamification
        ConfigTab
        LevelsTab
        QuestsTab
        RulesTab
        ShopTab
        UsersTab
        LedgerTab
        AvatarFrameCropper
      SystemUser CRUD
      Reports y Moderation
      Trash restore
    Hooks
      usePostForm
      useCampaignForm
      useSurveyForm
      useUserData
      useClientData
      useGamification
      15+ hooks custom
    Common Components
      PaginatedTable
      DateRangeSelector
      FileUpload
      ThemeSwitcher dark-light
      GodClientSelector admin
    Infraestructura
      Dockerfile + Nginx SPA
      .env REACT_APP_API_URL
      MIT License
```

El archivo original también incluye mapas para el API (`quelora-dashboard-api`) y una librería compartida (`@quelora/common`). Si quieres, puedo generarte también los mapas mentales para esas partes del ecosistema.
