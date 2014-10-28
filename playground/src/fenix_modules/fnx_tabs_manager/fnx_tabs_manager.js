define(['jquery',
        'mustache',
        'text!fnx_tabs_manager/html/templates.html',
        'text!fnx_tabs_manager/config/tabs_configuration.json',
        'i18n!fnx_tabs_manager/nls/translate',
        'chosen',
        'bootstrap'], function ($,
                                Mustache,
                                templates,
                                tabs_configuration,
                                translate) {

    'use strict';

    function FNX_TABS_MANAGER() {

        this.CONFIG = {
            lang            :   'E',
            placeholder     :   'main_content_placeholder'
        };

    }

    FNX_TABS_MANAGER.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Load tabs structure. */
        var view = {};
        var template = $(templates).filter('#tabs_structure').html();
        var render = Mustache.render(template, view);
        $('#' + this.CONFIG.placeholder).html(render);


    };

    return new FNX_TABS_MANAGER();

});