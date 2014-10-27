define(['jquery',
    'text!fnx_raster_histogram/config/histogram_template.json',
    'FNX_MAPS_LOADING_WINDOW',
    'highcharts'], function ($, histogram_template, loadingwindow) {

    'use strict';

    function FNX_RASTER_HISTOGRAM() {
        this.o = {
            chart: {
                //color: ['rgba(0, 0, 0, .5)'],
                id: null,
                series: '',
                decimalvalues: 4,
                chart_title: '',
                yaxis_title: '',
                xaxis_title: '',
                keyword: 'FAOSTAT_DEFAULT_LINE',

                // Chart Obj
                chartObj: '',

                // colors
                colors: ["#1f678a", "#92a8b7", "#5eadd5", "#6c79db", "#a68122", "#ffd569", "#439966", "#800432", "#067dcc", "#1f678a", "#92a8b7", "#5eadd5", "#6c79db", "#a68122", "#ffd569", "#439966", "#800432", "#067dcc"]
            },
            stats: {
                id: null
            },
            l: '', // layer
            map: '', // map if we want interact with the map
            callback: ''
        };
    }

    FNX_RASTER_HISTOGRAM.prototype.init = function(obj) {
        this.o = $.extend(true, {}, this.o, obj);
        this.histogram_template = $.parseJSON(histogram_template);
        this.createHistogram()
    };

    FNX_RASTER_HISTOGRAM.prototype.createHistogram = function() {
        //var url = this.o.url_stats_raster_histogram.replace("{{LAYERS}}", o.l.layer.layers)
        var url = this.o.url_stats_raster.replace("{{LAYERS}}", this.o.l.layer.layers)
        var _this = this;
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                response = (typeof response == 'string')? $.parseJSON(response): response;
                if (_this.o.chart.id) {
                    _this.parseHistogramResponse(response.hist[0]);
                }
                if (_this.o.stats.id) {
                    _this.parseStats(response.stats[0]);
                }
            },
            error : function(err, b, c) {}
        });
    };

    FNX_RASTER_HISTOGRAM.prototype.parseHistogramResponse = function(response) {
        var l = this.o.l.layer;
        l.histogram = {};
        l.histogram.min = response.min;
        l.histogram.max = response.max;
        l.histogram.buckets = response.buckets;
        l.histogram.values = response.values;
        this.o.chart.series = this.parseChartSeries(response.values);
        this.o.chart.categories = this.createCategories(response.min, response.max, response.buckets, this.o.chart.decimalvalues);
        $("#" + this.o.chart.id).empty();
        this.createChart(this.o.chart);
    }

    FNX_RASTER_HISTOGRAM.prototype.createCategories = function(min, max, buckets, decimalvalues) {
        // sum the absolute values of min max
        // |min|+|max| / buckets
        var categories = [];
        var step = (Math.abs(min) + Math.abs(max) ) / buckets
        while(min < max) {  //check if < or <= ??
            // TODO: check decimalvalues toFixed(0) why it doesn't work
            categories.push((decimalvalues)? min.toFixed(decimalvalues) : min);
            min = min + step;
        }
        if ( categories.length < buckets )  { }
        return categories;
    }

    /** TODO: handle multiple raster bands **/
    FNX_RASTER_HISTOGRAM.prototype.parseChartSeries = function(data) {
        var series = [];
        series.push({
            name: 'Histogram',
            data: data
        });
        return series;
    }

    FNX_RASTER_HISTOGRAM.prototype.createChart = function(obj) {
        $("#" + this.o.chart.id).empty();
        var c = {
            chart: {
                renderTo: this.o.chart.id,
                events: {
                }
            },
            series: obj.series
        };
        c = $.extend(true, {}, c, this.histogram_template);
        this.o.chart.chartObj = new Highcharts.Chart(c);
    }

    return FNX_RASTER_HISTOGRAM;
});