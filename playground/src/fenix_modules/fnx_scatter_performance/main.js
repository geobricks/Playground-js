define(['jquery',
    'mustache',
    'text!fnx_maps_morocco/html/template.html',
    'text!fnx_maps_morocco/config/chart_template',
    'fenix-map',
    'chosen',
    'jquery.hoverIntent',
    'highcharts',
    'highcharts-heatmap',
    'bootstrap'], function ($, Mustache, template, chart_template) {

    'use strict';

    function FM_ANALYSIS() {
        this.CONFIG = {
            lang : 'en',

            "placeholder"   : "main_content_placeholder",

            "product_structure_id": "pgeo_analysis_product_id",
            "map_structure_id"    : "pgeo_analysis_map_id",
            "chart_structure_id"  : "pgeo_analysis_chart_id",

            "product_dropdown_id" : "pgeo_analysis_product_select",
            "map_id" : "pgeo_analysis_map",

            "chart_id" : "pgeo_analysis_chart",

            "chart_obj" : "", // this the chart obj used to add the series

            // layers to be added and queried
            "cached_layers" : []
//            "cached_layers" : [
//                {
//                    id : "",
//                    layers : []
//                }
//            ]
        };
    }

    FM_ANALYSIS.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        console.log(this.CONFIG);

        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).html(t)

        this.create_chart('chart')
    };

    FM_ANALYSIS.prototype.create_chart = function(chart_id) {
        var yAxis_categories = ['0.0', '198.446850586', '396.893701172', '595.340551758', '793.787402344', '992.23425293', '1190.68110352', '1389.1279541', '1587.57480469', '1786.02165527', '1984.46850586']
        var xAxis_categories = ['0.0', '160.581396484', '321.162792969', '481.744189453', '642.325585938', '802.906982422', '963.488378906', '1124.06977539', '1284.65117188', '1445.23256836', '1605.81396484']

        var series = [{
            borderWidth: 1,
            data:
                [[0, 0, 14309.0], [0, 1, 699535.0], [0, 2, 522412.0], [0, 3, 19662.0], [0, 4, 2.0], [0, 5, 0.0], [0, 6, 0.0], [0, 7, 0.0], [0, 8, 0.0], [0, 9, 0.0], [0, 10, 0.0], [1, 0, 36.0], [1, 1, 126940.0], [1, 2, 473998.0], [1, 3, 189960.0], [1, 4, 18423.0], [1, 5, 2100.0], [1, 6, 103.0], [1, 7, 0.0], [1, 8, 0.0], [1, 9, 0.0], [1, 10, 0.0], [2, 0, 0.0], [2, 1, 779.0], [2, 2, 86612.0], [2, 3, 162773.0], [2, 4, 57155.0], [2, 5, 4540.0], [2, 6, 529.0], [2, 7, 62.0], [2, 8, 0.0], [2, 9, 0.0], [2, 10, 0.0], [3, 0, 0.0], [3, 1, 0.0], [3, 2, 18413.0], [3, 3, 75775.0], [3, 4, 73848.0], [3, 5, 19890.0], [3, 6, 502.0], [3, 7, 165.0], [3, 8, 54.0], [3, 9, 0.0], [3, 10, 0.0], [4, 0, 0.0], [4, 1, 0.0], [4, 2, 0.0], [4, 3, 41801.0], [4, 4, 57601.0], [4, 5, 29996.0], [4, 6, 3321.0], [4, 7, 233.0], [4, 8, 143.0], [4, 9, 64.0], [4, 10, 0.0], [5, 0, 0.0], [5, 1, 0.0], [5, 2, 0.0], [5, 3, 0.0], [5, 4, 52761.0], [5, 5, 33909.0], [5, 6, 6680.0], [5, 7, 409.0], [5, 8, 37.0], [5, 9, 139.0], [5, 10, 1.0], [6, 0, 0.0], [6, 1, 0.0], [6, 2, 0.0], [6, 3, 0.0], [6, 4, 5734.0], [6, 5, 41240.0], [6, 6, 9109.0], [6, 7, 400.0], [6, 8, 0.0], [6, 9, 0.0], [6, 10, 0.0], [7, 0, 0.0], [7, 1, 0.0], [7, 2, 0.0], [7, 3, 0.0], [7, 4, 0.0], [7, 5, 7930.0], [7, 6, 11295.0], [7, 7, 535.0], [7, 8, 0.0], [7, 9, 0.0], [7, 10, 0.0], [8, 0, 0.0], [8, 1, 0.0], [8, 2, 0.0], [8, 3, 0.0], [8, 4, 0.0], [8, 5, 0.0], [8, 6, 3981.0], [8, 7, 2094.0], [8, 8, 0.0], [8, 9, 0.0], [8, 10, 0.0], [9, 0, 0.0], [9, 1, 0.0], [9, 2, 0.0], [9, 3, 0.0], [9, 4, 0.0], [9, 5, 0.0], [9, 6, 0.0], [9, 7, 2122.0], [9, 8, 96.0], [9, 9, 0.0], [9, 10, 0.0], [10, 0, 0.0], [10, 1, 0.0], [10, 2, 0.0], [10, 3, 0.0], [10, 4, 0.0], [10, 5, 0.0], [10, 6, 0.0], [10, 7, 0.0], [10, 8, 1.0], [10, 9, 0.0], [10, 10, 0.0]]
        }]

        var chart = {
            chart: {
                type: 'heatmap',
                marginTop: 40,
                marginBottom: 140,
                "renderTo" : chart_id
            },
            xAxis: {
                categories: xAxis_categories,
                labels: {
                    rotation: -45,
                    style: {
                        fontSize: '9px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            yAxis: {
                title : "Provinces",
                categories: yAxis_categories,
                labels: {
                    style: {
                        fontSize: '9px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            },
            colorAxis: {
                min: 0,
                //max: 8500,
//                max: 0,
                minColor: '#FFFFFF',
                maxColor: Highcharts.getOptions().colors[0]

            },
            legend: {
                align: 'right',
                layout: 'vertical',
                margin: 0,
                verticalAlign: 'top'
            },
            series: series
        }

        console.log(chart)
        var c = new Highcharts.Chart(chart);


    }



    return FM_ANALYSIS;
});