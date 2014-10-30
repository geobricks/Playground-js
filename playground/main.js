
var repository = '//fenixapps.fao.org/repository/js/';

var fnx_modules = 'src/fenix_modules/';



require.config({

    baseUrl: '',

    paths: {

        'i18n'                  : 'libs/i18n',
        'text'                  : 'libs/text',
        'domReady'              : 'libs/domReady',
        'loglevel'              : 'libs/logger/loglevel.min',
        'bootstrap-datepicker'  : 'libs/bootstrap-datepicker/bootstrap-datepicker',

        bootstrap               :   '//netdna.bootstrapcdn.com/bootstrap/3.0.1/js/bootstrap.min',
        backbone                :   '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        chosen                  :   '//fenixapps.fao.org/repository/js/chosen/1.0.0/chosen.jquery.min',
        'highcharts'            :   repository + 'highcharts/4.0.4/js/highcharts',
        'highcharts_exporting'  :   repository + 'highcharts/4.0.4/js/modules/exporting',
        "highcharts-heatmap"    :   'http://code.highcharts.com/maps/modules/heatmap',
        "highcharts-data"       :   'http://code.highcharts.com/maps/modules/data',
        jquery                  :   '//code.jquery.com/jquery-1.10.1.min',
        'jquery.hoverIntent'    :   '//fenixapps.fao.org/repository/js/jquery.hoverIntent/1.0/jquery.hoverIntent',

        mustache                :   '//cdnjs.cloudflare.com/ajax/libs/mustache.js/0.8.1/mustache',
        underscore              :   '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',

        'csvjson'               :   'http://fenixapps.fao.org/repository/js/csvjson/1.0/csvjson.min.1.0',

        // navbar

        navbar                  :   'src/navbar/geobricks_navbar',
        navbar_module           :   'src/navbar',

        // fenix-map-js
        'import-dependencies'   :   '//fenixapps.fao.org/repository/js/FENIX/utils/import-dependencies-1.0',
        'leaflet'               :   '//fenixapps.fao.org/repository/js/leaflet/0.7.3/leaflet',
        'jquery.power.tip'      :   '//fenixapps.fao.org/repository/js/jquery.power.tip/1.1.0/jquery.powertip.min',
        'jquery-ui'             :   '//fenixapps.fao.org/repository/js/jquery-ui/1.10.3/jquery-ui-1.10.3.custom.min',
        'jquery.i18n.properties':   '//fenixapps.fao.org/repository/js/jquery/1.0.9/jquery.i18n.properties-min',
        'jquery.hoverIntent'    :   '//fenixapps.fao.org/repository/js/jquery.hoverIntent/1.0/jquery.hoverIntent',

        // fenix-map-scatter
        'csvjson'               :   'http://fenixapps.fao.org/repository/js/csvjson/1.0/csvjson.min.1.0',
        'FMChartLibrary'        :   'http://168.202.28.214:7070/fenix-map-js/plugins/ChartLibrary',
        'FMChartScatter'        :   'http://168.202.28.214:7070/fenix-map-js/plugins/FMChartScatterRefactoring',
        'regression'            :   'http://fenixapps.fao.org/repository/js/highcharts/plugins/regression/1.0/regression',
        // TODO: change link
        'wkt'                   :   'http://fenixapps.fao.org/repository/js/FENIX/fenix-map-js/2.1/wkt',

        'fenix-map'             :   'http://168.202.28.214:7070/fenix-map-js/fenix-map-min',
        'fenix-map-config'      :   'http://168.202.28.214:7070/fenix-map-js/fenix-map-config',
        'fenix-map-scatter-analysis'      :   'http://168.202.28.214:7070/fenix-map-js/fenix-map-config',

        FNX_MAPS_LOADING_WINDOW : fnx_modules + 'utils/fnx_maps_loading_window',

        EARLY_WARNING            :   fnx_modules + 'fnx_maps_early_warning/early_warning',
        fnx_maps_early_warning   :   fnx_modules + 'fnx_maps_early_warning',
        early_warning_chart      :   fnx_modules + 'fnx_maps_early_warning/early_warning_chart',


        EARLY_WARNING_SADC          :   fnx_modules + 'fnx_maps_early_warning_sadc/early_warning_sadc',
        fnx_maps_early_warning_sadc :   fnx_modules + 'fnx_maps_early_warning_sadc',
        early_warning_chart_sadc    :   fnx_modules + 'fnx_maps_early_warning_sadc/early_warning_chart_sadc',


        DISTRIBUTION             :   fnx_modules + 'fnx_maps_distribution/distribution',
        fnx_maps_distribution    :   fnx_modules + 'fnx_maps_distribution',

        SCATTER_ANALYSIS            :   fnx_modules + 'fnx_maps_scatter_analysis/main',
        fnx_maps_scatter_analysis   :   fnx_modules + 'fnx_maps_scatter_analysis',

        GHG_FIRES            :   fnx_modules + 'fnx_maps_ghg_fires/ghg_fires',
        GHG_FIRES            :   fnx_modules + 'fnx_maps_ghg_fires/ghg_fires',
        fnx_maps_ghg_fires   :   fnx_modules + 'fnx_maps_ghg_fires',
        ghg_fires_chart      :   fnx_modules + 'fnx_maps_ghg_fires/ghg_fires_chart',

        FNX_MAPS_ANALYSIS_MODULE: fnx_modules + 'fnx_maps_analysis/main',
        fnx_maps_analysis       : fnx_modules + 'fnx_maps_analysis',

        FNX_MAPS_HISTOGRAM_ANALYSIS_MODULE  : fnx_modules + 'fnx_maps_histogram_analysis/main',
        fnx_maps_histogram_analysis         : fnx_modules + 'fnx_maps_histogram_analysis',

        FNX_CROP_CALENDAR_MODULE    : fnx_modules + 'fnx_crop_calendar/main',
        fnx_crop_calendar           : fnx_modules + 'fnx_crop_calendar',

        FNX_MAPS_RASTER_COMPARE_MODULE   : fnx_modules + 'fnx_maps_raster_compare/main',
        fnx_maps_raster_compare        : fnx_modules + 'fnx_maps_raster_compare',

        FNX_EBOLA_MODULE : fnx_modules + 'fnx_ebola/main',
        fnx_ebola        : fnx_modules + 'fnx_ebola',

        FNX_SCATTER_PERFORMANCE_MODULE : fnx_modules + 'fnx_scatter_performance/main',
        fnx_scatter_performance        : fnx_modules + 'fnx_scatter_performance',

        FNX_RASTER_HISTOGRAM_MODULE : fnx_modules + 'raster/fnx_raster_histogram/main',
        fnx_raster_histogram        : fnx_modules + 'raster/fnx_raster_histogram',

        FNX_TABS_MANAGER_MODULE : fnx_modules + 'fnx_tabs_manager/fnx_tabs_manager',
        fnx_tabs_manager        : fnx_modules + 'fnx_tabs_manager'
    },

    shim: {
        bootstrap: ['jquery'],
        backbone: {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        chosen: ['jquery'],
        highcharts: ['jquery'],
        underscore: {
            exports: '_'
        },

        'jquery-ui' : ['jquery'],
        'jquery.power.tip': ['jquery'],
        'jquery.i18n.properties': ['jquery'],
        'jquery.hoverIntent': ['jquery'],
        'fenix-map':  {
            deps: ['jquery',
                'leaflet',
                'jquery-ui',
                'fenix-map-config', 'import-dependencies',
                'jquery.power.tip', 'jquery.i18n.properties',
                'jquery.hoverIntent', 'chosen']
        },
        'FMChartScatter' : {
            deps: ['fenix-map',
                'csvjson',
                'FMChartLibrary',
                'regression',
                'wkt']
        },
        "highcharts-heatmap" : {
            deps: ['highcharts',
                'highcharts-data']
        }
    }

});

require(['jquery',
         'mustache',
         'text!html/templates.html',
         'backbone',
         'loglevel',
         'text!config/config.json',
         'chosen',
         'navbar',
         'bootstrap',,
         'domReady!'], function($, Mustache, templates, Backbone, log, config) {

    log.setLevel(0);

    var config = $.parseJSON(config);


    var ApplicationRouter = Backbone.Router.extend({

        isRendered: false,

        initialize: function (options) {
            Backbone.history.start();
        },


        routes: {
            '(/)early_warning_sadc(/):lang': 'early_warning_sadc',
            '(/)early_warning(/):lang': 'early_warning',
            '(/)distribution(/):lang': 'distribution',
            '(/)scatter_analysis(/):lang': 'scatter_analysis',
            '(/)ghg_fires(/):lang': 'ghg_fires',
            '(/)analysis(/):lang': 'analysis',
            '(/)crop_calendar(/):lang': 'crop_calendar',
            '(/)morocco_analysis(/):lang': 'morocco',
            '(/)ebola(/):lang': 'ebola',
            '(/)scatter_performance(/):lang': 'scatter_performance',
            '(/)tabs_manager(/):lang': 'tabs_manager',
            '': 'early_warning'
        },

        early_warning: function(lang) {
            this._init(lang);
            require(['EARLY_WARNING'], function() {
                Early_warning().build({lang: lang});
            });
        },

        tabs_manager: function(lang) {
            this._init(lang);
            require(['FNX_TABS_MANAGER_MODULE'], function(FNX_TABS_MANAGER) {
                FNX_TABS_MANAGER.init(config);
            });
        },

        early_warning_sadc: function(lang) {
            this._init(lang);
            require(['EARLY_WARNING_SADC'], function() {
                Early_warning_sadc().build({lang: lang});
            });
        },

        distribution: function(lang) {
            this._init(lang);
            require(['DISTRIBUTION'], function() {
                Distribution().build({lang: lang});
            });
        },

        scatter_analysis: function(lang) {
            this._init(lang);
            require(['SCATTER_ANALYSIS'], function() {
                Scatter_Analysis().build({lang: lang});
            });
        },

        ghg_fires: function(lang) {
            this._init(lang);
            require(['GHG_FIRES'], function() {
                GHG_Fires().build({lang: lang});
            });
        },

        analysis: function(lang) {
            this._init(lang);
            require(['FNX_MAPS_ANALYSIS_MODULE'], function(FM_ANALYSIS) {
                var analysis = new FM_ANALYSIS()
                config.lang = lang
                analysis.init(config);
            });
        },

        crop_calendar: function(lang) {
            this._init(lang);
            require(['FNX_CROP_CALENDAR_MODULE'], function(FNX_CROP_CALENDAR) {
                var app = new FNX_CROP_CALENDAR()
                config.lang = lang
                app.init(config);
            });
        },


        morocco: function(lang) {
            this._init(lang);
            require(['FNX_MAPS_RASTER_COMPARE_MODULE'], function(MODULE) {
                var app = new MODULE()
                config.lang = lang
                app.init(config);
            });
        },

        ebola: function(lang) {
            this._init(lang);
            require(['FNX_EBOLA_MODULE'], function(MODULE) {
                var app = new MODULE()
                config.lang = lang
                app.init(config);
            });
        },

        scatter_performance: function(lang) {
            this._init(lang);
            require(['FNX_SCATTER_PERFORMANCE_MODULE'], function(MODULE) {
                var app = new MODULE()
                config.lang = lang
                app.init(config);
            });
        },

        _init: function (lang) {

            if (lang) {
                this._initLanguage(lang)
            }

            if (!this.isRendered) {
                this.isRendered = true;
                var template = $(templates).filter('#structure').html();
                var view = {};
                var render = Mustache.render(template, view);
                $('#js_geo_placeholder').html(render);
                var navbar = new Navbar({lang: lang});
                navbar.build();
            }

        },

        _initLanguage: function (lang) {
            require.config({"locale": lang});
        }

    });

    new ApplicationRouter();

});