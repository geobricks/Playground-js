define(['jquery',
        'mustache',
        'text!fnx_tabs_manager/js/ghg-qa-qc/html/templates.html',
        'text!fnx_tabs_manager/js/ghg-qa-qc/config/tabs_configuration.json',
        'i18n!fnx_tabs_manager/js/ghg-qa-qc/nls/translate',
        'chosen',
        'bootstrap'], function ($,
                                Mustache,
                                templates,
                                tabs_configuration,
                                translate) {

    'use strict';

    function FNX_TABS_MANAGER() {

        this.CONFIG = {
            lang            :   'E'
        };

    }

    FNX_TABS_MANAGER.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

    };

    return new FNX_TABS_MANAGER();

});