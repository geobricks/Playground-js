define(['jquery',
    'mustache',
    'text!fnx_scatter_performance/html/template.html',
    'text!fnx_scatter_performance/config/chart_template',
    'fenix-map',
    'chosen',
    'jquery.hoverIntent',
    'highcharts',
    'highcharts-heatmap',
    'bootstrap'], function ($, Mustache, template, chart_template) {

    'use strict';

    function FNX_SCATTER_PERFORMANCE() {
        this.CONFIG = {
            lang : 'en',
            "placeholder"   : "main_content_placeholder"
        };
    }

    FNX_SCATTER_PERFORMANCE.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);

        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).html(t)

        var _this = this;
        $("#fx_chart_performance_test_apply").bind( "click", function() {

            var size = $("#fx_chart_performance_test_size").val();
            _this.create_chart("chart", size)
        });

    };



    return FNX_SCATTER_PERFORMANCE;
});