define(['jquery',
        'mustache',
        'text!../../html/templates.html',
        'bootstrap'], function ($, Mustache, templates) {

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
            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                var view = {
                    early_warning: translate.early_warning,
                    distribution: translate.distribution,
                    scatter_analysis: translate.scatter_analysis
                };
                var render = Mustache.render(template, view);
                $('#' + CONFIG.placeholder).html(render);
            });

        };

        return {
            build: build
        };

    };

});