define(['jquery',
    'mustache',
    'text!fnx_maps_analysis/html/template.html',
    'text!fnx_maps_crop_calendar/config/chart_template',
    'fenix-map',
    'highcharts',
    'chosen',
    'jquery.hoverIntent',
    'bootstrap'], function ($, Mustache, template, chart_template) {

    'use strict';

    function FX_CROP_CALENDAR() {
        this.CONFIG = {
            lang : 'en',

            "placeholder"   : "main_content_placeholder"
        };
    }

    FX_CROP_CALENDAR.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        console.log(this.CONFIG);

        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).html(t)

        this.create_gui()
    };


    return FX_CROP_CALENDAR;
});