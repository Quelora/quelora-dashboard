# Mapa Mental — Ecosistema Quelora

> Visualización del ecosistema completo: **quelora-dashboard** (frontend), **quelora-dashboard-api** (backend) y **@quelora/common** (librería compartida).

---

## Dashboard (Frontend)

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

---

## API Backend

```mermaid
mindmap
  root((quelora-dashboard-api))
    Stack
      Node.js + Express 4
      MongoDB Mongoose
      Redis caché + queues
      JWT + Bcrypt
      Speakeasy 2FA TOTP
      Puppeteer scraping
      Cheerio HTML parsing
      Bull-Board UI queues
      express-rate-limit
      Multer uploads
    Arquitectura
      Multi-tenant por CID
      X-Client-Id header
      RBAC 7 roles
        god 100
        admin 50
        editor 40
        moderator 30
        advertiser 20
        analyst 15
        user 10
      Middlewares
        Helmet seguridad
        CORS dinámico
        JWT auth
        Rate limiting global-strict-login
        Response compressor
        Cache invalidator
        Request logger
    Endpoints
      auth
        POST generate-token
        POST renew-token
        POST verify-2fa
      user
        GET profile y clients
        GET list
        PATCH profile
        POST change-password
        POST create
        POST 2fa setup-verify-disable
        DELETE-PATCH userId
      client
        POST-PUT generate-upsert-cid
        GET posts y post y comments
        PUT upsert-post
        PATCH trash-restore
        GET users y stats y nolan
        PATCH ban-unban
        GET logs y reports
        PATCH comments hide-unhide
      stats
        GET get geo posts post
        GET top-users profile-analytics
        GET moderation-analytics reputation
      reputation CRUD
      resilience
        GET-POST config
        POST generate-keys ed25519
      notifications
        POST send push
        POST send-mail
        GET search users
        GET generate-vapid-keys
      media POST upload
      admin god-only
        GET search clients
        POST set active CID
        POST jobs-suggestions
      GET health
    Modelos propios
      User admin
        given-family name
        email username
        password bcrypt
        role
        2FA secret encriptado
        failedLogin lockUntil
        mustChangePassword
        isDeleted timestamps
    Servicios propios
      commentAnalysisNolanService
        Análisis político Nolan Chart
        OpenAI GPT-4o
      puppeteerService
        Web scraping títulos URLs
        Extrae description canonical
    Cron Jobs
      discoveryJob cada minuto
        Posts sin título modeDiscovery
        Scraping con Puppeteer
        Actualiza título description
    Seeds DB
      seedAdminUser
      seedFakerUser
      seedComments
      SeedFollowers
      SeedPostsLikes
      seedReputationLogs
      seedGamification varios
      seedVAPID
      seedResilienceKeys
    Integraciones externas
      Google Perspective API toxicidad
      Google Translation
      OpenAI GPT-4o
      Grok / Gemini / DeepSeek
      Detect Language API
      GIPHY API
      Reddit API seeding
      SMTP Postfix email
    Enterprise opcional
      Gamification
      Campaigns
      Placements
      Advertiser Profiles
      Surveys
```

---

## Librería Compartida

```mermaid
mindmap
  root((@quelora/common))
    Stack
      Node.js JavaScript
      MongoDB Mongoose ODM
      Redis ioredis
      BullMQ job queues
      JWT + JWKS
      bcrypt + speakeasy
      Nodemailer SMTP
      MaxMind geolocation
      ngeohash spatial
      web-push VAPID
      OpenAI Gemini Grok DeepSeek
    Modelos 26 schemas
      Profile 35KB
        identidad
        reputación
        configuración
        relaciones
      Post 21KB
        contenido
        interacciones
        config live-audio
      Comment
      Client 41KB config tenant
      Relaciones
        ProfileFollower-Following
        ProfileFollowRequest
        ProfileBlock
      Interacciones
        ProfileLike-Share-Bookmark
        ProfileComment
      Stats
        ProfileStats-Daily
        PostStats
        GeoStats-GeoPostStats
        TokenUsageStats
      Configuración
        ReputationConfig
        JobExecutionLog
      Activity Report ProfileSuggestion
    Servicios 30+
      authService JWT multi-tenant
      profileService caché 57KB
      clientConfigService cifrado
      cacheService Redis TTL
      moderateService filtrado
      contentQualityService análisis
      statsService-rollupService
      notificationAggregatorService
      pushService VAPID
      emailService cola
      ssoService multi-provider
      queueFactory BullMQ
      suggestService recomendaciones
      reputationService gamificación
      geoService analytics geo
      i18nService-languageService
      activityService eventos
      onboardingService
    Middlewares 11
      authMiddleware Bearer JWT + CID
      optionalAuthMiddleware
      rateLimiterMiddleware
        global strict login
      captchaMiddleware
      globalErrorHandler
      extractGeoDataMiddleware IP
      trackUserPresence
      validateClientHeaderMiddleware
      requestLogger
      responseCompressor
      cacheInvalidator
      validatePasswordResetToken
    SSO Providers 5
      GoogleProvider OAuth
      FacebookProvider OAuth
      XProvider Twitter
      AppleProvider Sign-In
      QueloraProvider nativo
    Moderation Providers 4
      ModerationProvider base abstract
      OpenAIModerationProvider
      GeminiModerationProvider
      GrokModerationProvider
      DeepSeekModerationProvider
    Config
      dynamicCorsConfig por tenant
      corsClientConfig estático
      helmetConfig CSP HSTS
    Utils 13
      cipher AES encrypt-decrypt
      password bcrypt hash
      textUtils validación
      profileUtils avatar URLs
      geoUtils geohash coords
      imageHelper URL processing
      notificationUtils 13KB
      rankingUtils scoring
      recordProfileActivity
      recordStatsActivity
      formatComment
      deepMerge
      featureLoader Enterprise-Community
    Patrones
      Singleton DB conexión
      Factory queueFactory
      Strategy moderation-SSO
      Service Locator clientConfig
      Pagination Factory cursor
      Versioned Cache CID namespace
      Optional Module Loading
    i18n 11 idiomas
      en de fr it es pt ru ar he hi zh
    Templates email
      verificationTemplate
      notificationTemplate
    Constantes
      PROFILE_CACHE_TTL 300s
      PAGINATION_LIMIT 15
      FOLLOWER_LIMIT 25
      FANOUT_LIMIT_THRESHOLD 2000
      AGGREGATION_WINDOW 1min
```

---

## Flujo de datos entre proyectos

```mermaid
flowchart TD
    A[quelora-dashboard\nReact SPA] -->|REST HTTP\nBearer JWT\nX-Client-Id| B[quelora-dashboard-api\nNode.js Express]
    B -->|require| C[@quelora/common\nLibrería compartida]
    C -->|Mongoose| D[(MongoDB)]
    C -->|ioredis| E[(Redis)]
    C -->|BullMQ| F[Job Queues]
    B -->|Puppeteer| G[Web externo scraping]
    B -->|OpenAI/Grok/Gemini| H[AI APIs]
    C -->|MaxMind| I[GeoIP]
    C -->|Nodemailer| J[SMTP Email]
    C -->|web-push| K[Push Notifications]
    C -->|Google/Facebook/Apple/X OAuth| L[SSO Providers]
```
