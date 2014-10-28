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
            lang            :   'en',
            placeholder     :   'main_content_placeholder',
            modules_buffer  :   []
        };

    }

    FNX_TABS_MANAGER.prototype.init = function(config) {

        /* Extend default configuration. */
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        /* Cast configuration files. */
        tabs_configuration = $.parseJSON(tabs_configuration);

        /* Load tabs structure. */
        var view = {};
        var template = $(templates).filter('#tabs_structure').html();
        var render = Mustache.render(template, view);
        $('#' + this.CONFIG.placeholder).html(render);

        /* Add a new tab. */
        for (var i = 0 ; i < tabs_configuration.length ; i++) {

            /* Add new header. */
            view = {
                href: '#' + tabs_configuration[i].module_code + '_tab_content',
                tab_label: translate[tabs_configuration[i].label_code]
            };
            template = $(templates).filter('#single_tab_header').html();
            render = Mustache.render(template, view);
            $(render).appendTo('#tab_headers');

            /* Add new content. */
            view = {
                tab_id: tabs_configuration[i].module_code + '_tab_content',
                tab_content_placeholder: tabs_configuration[i].module_code + '_tab_content_placeholder'
            };
            template = $(templates).filter('#single_tab_content').html();
            render = Mustache.render(template, view);
            $(render).appendTo('#tab_contents');

        }

        /* Make the new tab active. */
        $('#tab_headers a:first').tab('show');

        /* Initiate the first module. */
        this.init_module(tabs_configuration[0].module_code);

        /* Add listener to the tabs.*/
        var _this = this;
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target_module_name = e.target.hash.substring(1, e.target.hash.indexOf('_tab_content'));
            _this.init_module(target_module_name);
        })

    };

    FNX_TABS_MANAGER.prototype.init_module = function(module_code) {
        if ($.inArray(module_code, this.CONFIG.modules_buffer) < 0) {
            this.CONFIG.modules_buffer.push(module_code);
            var _this = this;
            require([module_code], function (MODULE) {
                var app = new MODULE();
                app.init({
                    lang: _this.CONFIG.lang,
                    placeholder: module_code + '_tab_content_placeholder'
                });
            });
        }
    };

    return new FNX_TABS_MANAGER();

});