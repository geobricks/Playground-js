define(['jquery',
        'mustache',
        'text!navbar_module/html/templates.html',
        'i18n!libs/nls/translate',
        'bootstrap'], function ($, Mustache, templates, translate) {

    var global = this;

    global.Navbar = function (config) {

        var CONFIG = {
            lang: 'en',
            placeholder: 'navbar_placeholder',
            template_id: 'navbar'
        }

        CONFIG = $.extend(true, {}, CONFIG, config);

        require.config({'locale' : CONFIG.lang});

        var build = function () {
//            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                var view = {
                    early_warning: translate.early_warning,
                    distribution: translate.distribution,
                    scatter_analysis: translate.scatter_analysis,
                    early_warning_sadc: translate.early_warning_sadc
                };
                var render = Mustache.render(template, view);
                $('#' + CONFIG.placeholder).html(render);
//            });

        };

        return {
            build: build
        };

    };

});