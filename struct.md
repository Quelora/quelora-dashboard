├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── DockerfileDashboard
├── LICENSE
├── nginx.conf
├── package-lock.json
├── package.json
├── production.env
├── public
│   ├── apple-touch-icon.png
│   ├── data
│   │   └── countries.geo.json
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── icon.png
│   ├── images
│   │   ├── map
│   │   │   ├── marker-icon-2x.png
│   │   │   ├── marker-icon.png
│   │   │   └── marker-shadow.png
│   │   ├── quelora.blue.png
│   │   ├── quelora.blue.sm.png
│   │   ├── quelora.png
│   │   └── quelora.sm.png
│   ├── index.html
│   ├── manifest.json
│   └── og-image.jpg
├── read.MD
├── src
│   ├── App.js
│   ├── api
│   │   ├── admin.js
│   │   ├── advertiserProfiles.js
│   │   ├── auth.js
│   │   ├── axiosConfig.js
│   │   ├── campaigns.js
│   │   ├── email.js
│   │   ├── gamification.js
│   │   ├── logs.js
│   │   ├── media.js
│   │   ├── moderation.js
│   │   ├── placementPricing.js
│   │   ├── placements.js
│   │   ├── posts.js
│   │   ├── profile.js
│   │   ├── reports.js
│   │   ├── stats.js
│   │   ├── surveys.js
│   │   ├── systemUsers.js
│   │   ├── users.js
│   │   └── vapid.js
│   ├── assets
│   │   ├── css
│   │   │   ├── Console.css
│   │   │   ├── Login.css
│   │   │   ├── index.css
│   │   │   ├── theme-overrides.css
│   │   │   └── variables.css
│   │   └── locales
│   │       ├── ar
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── de
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── en
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── gamification.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── password_req.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── role_descriptions.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── es
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── gamification.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── password_req.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── role_descriptions.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── fr
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── he
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── hi
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── it
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── ja
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── pt
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       ├── ru
│   │       │   ├── accounts.json
│   │       │   ├── advertiser.json
│   │       │   ├── app.json
│   │       │   ├── cache.json
│   │       │   ├── campaign.json
│   │       │   ├── client.json
│   │       │   ├── clientPosts.json
│   │       │   ├── comments.json
│   │       │   ├── common.json
│   │       │   ├── console.json
│   │       │   ├── dashboard.json
│   │       │   ├── db.json
│   │       │   ├── liveMode.json
│   │       │   ├── login.json
│   │       │   ├── moderationAnalytics.json
│   │       │   ├── placement.json
│   │       │   ├── placementPricing.json
│   │       │   ├── postForm.json
│   │       │   ├── profile.json
│   │       │   ├── profileAnalytics.json
│   │       │   ├── reports.json
│   │       │   ├── sidebar.json
│   │       │   ├── survey.json
│   │       │   ├── trash.json
│   │       │   ├── upload.json
│   │       │   └── users.json
│   │       └── zh
│   │           ├── accounts.json
│   │           ├── advertiser.json
│   │           ├── app.json
│   │           ├── cache.json
│   │           ├── campaign.json
│   │           ├── client.json
│   │           ├── clientPosts.json
│   │           ├── comments.json
│   │           ├── common.json
│   │           ├── console.json
│   │           ├── dashboard.json
│   │           ├── db.json
│   │           ├── liveMode.json
│   │           ├── login.json
│   │           ├── moderationAnalytics.json
│   │           ├── placement.json
│   │           ├── placementPricing.json
│   │           ├── postForm.json
│   │           ├── profile.json
│   │           ├── profileAnalytics.json
│   │           ├── reports.json
│   │           ├── sidebar.json
│   │           ├── survey.json
│   │           ├── trash.json
│   │           ├── upload.json
│   │           └── users.json
│   ├── components
│   │   ├── Advertiser
│   │   │   ├── AdvertiserProfileForm.jsx
│   │   │   ├── AdvertiserProfileModal.jsx
│   │   │   └── BackgroundCropper.jsx
│   │   ├── Auth
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── Login.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── Campaign
│   │   │   ├── BannerCropper.jsx
│   │   │   ├── CampaignBudgetTab.jsx
│   │   │   ├── CampaignCreativesTab.jsx
│   │   │   ├── CampaignDeliveryTab.jsx
│   │   │   ├── CampaignForm.jsx
│   │   │   ├── CampaignGeneralTab.jsx
│   │   │   ├── CampaignModal.jsx
│   │   │   └── CreativePostSelector.jsx
│   │   ├── Client
│   │   │   ├── CaptchaConfig.jsx
│   │   │   ├── Client.jsx
│   │   │   ├── ClientHeader.jsx
│   │   │   ├── ClientList.jsx
│   │   │   ├── CodeModal.jsx
│   │   │   ├── CommentsConfig.jsx
│   │   │   ├── ConfigDialog.jsx
│   │   │   ├── CorsConfig.jsx
│   │   │   ├── EmailConfigModal.jsx
│   │   │   ├── EntityConfig.jsx
│   │   │   ├── LoginConfig.jsx
│   │   │   ├── OtherConfig.jsx
│   │   │   └── VapidConfigModal.jsx
│   │   ├── Common
│   │   │   ├── CustomTextField.jsx
│   │   │   ├── DateRangeSelector.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── GeoTargetingTab.jsx
│   │   │   ├── GodClientSelector.jsx
│   │   │   ├── PaginatedTable.jsx
│   │   │   └── ThemeSwitcher.jsx
│   │   ├── Console
│   │   │   ├── ConsoleDrawer.jsx
│   │   │   └── ConsoleToolbarButton.jsx
│   │   ├── Dashboard
│   │   │   ├── ActivityOverTimeChart.jsx
│   │   │   ├── DashboardHeader.jsx
│   │   │   ├── GeoDistributionChart.jsx
│   │   │   ├── HourlyActivityChart.jsx
│   │   │   ├── LanguageMenu.jsx
│   │   │   ├── PostGeoView.jsx
│   │   │   ├── PostStatsTable.jsx
│   │   │   ├── PostTimeChart.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── StatsCharts.jsx
│   │   │   └── countryCodes.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── EmbedLayout.jsx
│   │   ├── Gamification
│   │   │   ├── AvatarFrameCropper.jsx
│   │   │   ├── GamificationConfigTab.jsx
│   │   │   ├── GamificationLedgerTab.jsx
│   │   │   ├── GamificationLevelsTab.jsx
│   │   │   ├── GamificationQuestsTab.jsx
│   │   │   ├── GamificationRulesTab.jsx
│   │   │   ├── GamificationShopTab.jsx
│   │   │   └── GamificationUsersTab.jsx
│   │   ├── Placement
│   │   │   ├── PlacementForm.jsx
│   │   │   ├── PlacementModal.jsx
│   │   │   ├── PlacementPricingForm.jsx
│   │   │   └── PlacementPricingModal.jsx
│   │   ├── Post
│   │   │   ├── AdvancedTab.jsx
│   │   │   ├── AudioTab.jsx
│   │   │   ├── CommentsTab.jsx
│   │   │   ├── GeneralTab.jsx
│   │   │   ├── LiveTab.jsx
│   │   │   ├── PostForm.jsx
│   │   │   └── PostModal.jsx
│   │   ├── Profile
│   │   │   ├── ImageCropper.jsx
│   │   │   ├── PasswordSettings.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── ProfileDetails.jsx
│   │   │   └── TwoFactorSettings.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Survey
│   │   │   ├── SurveyForm.jsx
│   │   │   ├── SurveyGeneralTab.jsx
│   │   │   ├── SurveyModal.jsx
│   │   │   ├── SurveyOptionsTab.jsx
│   │   │   └── SurveyPostsTab.jsx
│   │   ├── SystemUser
│   │   │   └── SystemUserForm.jsx
│   │   └── User
│   │       ├── NolanChart.jsx
│   │       └── UserCommentsModal.jsx
│   ├── contexts
│   │   └── UserContext.js
│   ├── hooks
│   │   ├── useAdvertiserProfileModal.js
│   │   ├── useCampaignForm.js
│   │   ├── useCampaignModal.js
│   │   ├── useDashboardStats.js
│   │   ├── useDebounce.js
│   │   ├── useDebouncedResize.js
│   │   ├── useGamification.js
│   │   ├── usePaginatedList.js
│   │   ├── usePlacementModal.js
│   │   ├── usePlacementPricingModal.js
│   │   ├── usePostForm.js
│   │   ├── usePostModal.js
│   │   ├── useSurveyForm.js
│   │   ├── useSurveyModal.js
│   │   └── useSystemUserForm.js
│   ├── i18n.js
│   ├── index.js
│   ├── pages
│   │   ├── AdvertiserProfilesPage.jsx
│   │   ├── CampaignsPage.jsx
│   │   ├── ClientPage.jsx
│   │   ├── ClientPostsPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── GamificationPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ModerationAnalyticsPage.jsx
│   │   ├── PlacementPricingPage.jsx
│   │   ├── PlacementsPage.jsx
│   │   ├── PostCommentsPage.jsx
│   │   ├── PostPage.jsx
│   │   ├── PostStatsPage.jsx
│   │   ├── ProfileAnalyticsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SurveysPage.jsx
│   │   ├── SystemUsersPage.jsx
│   │   ├── TrashPage.jsx
│   │   └── UserPage.jsx
│   ├── setupProxy.js
│   └── utils
│       ├── crypto.js
│       ├── exportHelper.js
│       └── permissions.js
└── struct.md
