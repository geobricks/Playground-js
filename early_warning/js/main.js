require.config({

    baseUrl: 'js/libs',

    paths: {
        bootstrap               :   '//netdna.bootstrapcdn.com/bootstrap/3.0.1/js/bootstrap.min',
        backbone                :   '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        chosen                  :   '//fenixapps.fao.org/repository/js/chosen/1.0.0/chosen.jquery.min',
        highcharts              :   '//code.highcharts.com/highcharts',
        jquery                  :   '//code.jquery.com/jquery-1.10.1.min',
        loglevel                :   'logger/loglevel.min',
        mustache                :   '//cdnjs.cloudflare.com/ajax/libs/mustache.js/0.8.1/mustache',
        navbar                  :   '../navbar/geobricks_navbar',
        underscore              :   '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',

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

        early_warning           :   '../early_warning/early_warning',
        early_warning_chart     :   '../early_warning/early_warning_chart',
        distribution            :   '../distribution/distribution',
        scatter_analysis                :   '../scatter_analysis/scatter_analysis'
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
        }
    }

});

require(['jquery',
         'mustache',
         'text!../../html/templates.html',
         'backbone',
         'loglevel',
         'chosen',
         'navbar',
         'bootstrap',,
         'domReady!'], function($, Mustache, templates, Backbone, log) {

    log.setLevel(0);


    var ApplicationRouter = Backbone.Router.extend({

        isRendered: false,

        initialize: function (options) {
            Backbone.history.start();
        },



        routes: {
            '(/)early_warning(/):lang': 'early_warning',
            '(/)distribution(/):lang': 'distribution',
            '(/)scatter_analysis(/):lang': 'scatter_analysis',
            '': 'early_warning'
        },

        early_warning: function(lang) {
            this._init(lang);
            require(['early_warning'], function() {
                Early_warning().build({lang: lang});
            });
        },

        distribution: function(lang) {
            this._init(lang);
            require(['distribution'], function() {
                Distribution().build({lang: lang});
            });
        },

        scatter_analysis: function(lang) {
            this._init(lang);
            require(['scatter_analysis'], function() {
                Scatter_Analysis().build({lang: lang});
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