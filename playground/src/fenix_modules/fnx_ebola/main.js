define(['jquery',
    'mustache',
    'text!fnx_ebola/html/template.html',
    'text!fnx_ebola/config/chart_template',
    'text!fnx_ebola/data/chart_data.csv',
    'fenix-map',
    'highcharts',
    'chosen',
    'jquery.hoverIntent',
    'csvjson',
    'bootstrap'], function ($, Mustache, template, chart_template, chart_data) {

    'use strict';

    function FM_EBOLA() {
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
        };
    }

    FM_EBOLA.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        console.log(this.CONFIG);

        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).html(t)

        this.CONFIG.chart_data = csvjson.csv2json(chart_data, { delim : "," })


        console.log( this.CONFIG.chart_data)
        this.create_chart("chart")
    };

    FM_EBOLA.prototype.create_chart = function(id) {

        var s = [
            "Cases_Guinea", "Deaths_Guinea",
            "Cases_Liberia","Deaths_Liberia",
            "Cases_SierraLeone", "Deaths_SierraLeone",
            "Cases_Nigeria", "Deaths_Nigeria"]

        var chart_id = id
        var c = {}
        c.chart = {
            "renderTo" : chart_id,
            "type" : "line"
        }
        var rows = this.CONFIG.chart_data.rows
        var categories = []
        var series = []
        for (var i=0; i < s.length; i++) {
            series.push({ "name" : s[i],
                "data" :[],
                "lineWidth" : 1
            })
        }
        for (var i=rows.length-1; i >= 0; i--) {
            for(var j=0; j< s.length; j++) {
                if ( rows[i][s[j]] != 0) {
                    series[j].data.push(rows[i][s[j]])
                }
                else {
                        if ( series[j].data[series[j].data.length - 1]) {
                            series[j].data.push(series[j].data[series[j].data.length - 1])
                        }else {
                            series[j].data.push(0)
                        }
                }
            }
           categories.push(rows[i].Date)
        }
        c.plotOptions = {
            series: {
                marker: {
                    enabled: false
                }
            }
        },
        c.series = series;
        c.xAxis = []
        c.xAxis.push(
            {
                categories : categories,
                labels: {
                    rotation: -45,
                    style: {
                        fontSize: '10px',
                        fontFamily: 'Roboto'
                    }
                }
            }
        )
        var ct = $.parseJSON(chart_template);
        c = $.extend(true, {}, ct, c);
        var c = new Highcharts.Chart(c);
    };



    return FM_EBOLA;
});