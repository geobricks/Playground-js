define(['jquery',
    'mustache',
    'text!../../html/browse.html',
    'loglevel',
    'fenix-map',
    'bootstrap'], function ($, Mustache, templates, log) {

    var global = this;

    global.GBBrowse = function() {

        var CONFIG = {
            lang: 'en',
            placeholder: 'main_content_placeholder',
            template_id: 'map'
        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            require(['i18n!nls/translate'], function (translate) {

                log.info(templates);
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                var view = {
                    company: translate.company,
                    browse: translate.browse,
                    download: translate.download
                };
                var render = Mustache.render(template, view);
                log.info(template);
                $('#' + CONFIG.placeholder).html(templates);

                var options = {
                    plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
                    guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
                    gui: {disclaimerfao: true }
                }

                var mapOptions = { zoomControl:false,attributionControl: false };
                var m = new FM.Map('map', options, mapOptions);
                m.createMap();
            });
        }

        // public instance methods
        return {
            build: build
        };
    };

});