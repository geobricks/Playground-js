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
                    company: translate.company,
                    browse: translate.browse,
                    download: translate.download,
                    configuration: translate.configuration,
                    login: translate.login
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