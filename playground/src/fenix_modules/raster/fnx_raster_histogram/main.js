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
                c: {}, // chart definition that is merged with the template
                decimalvalues: 4,
                keyword: 'FAOSTAT_DEFAULT_LINE',

                // Chart Obj
                chartObj: '',

                // colors
                colors: ["#1f678a", "#92a8b7", "#5eadd5", "#6c79db", "#a68122", "#ffd569", "#439966", "#800432", "#067dcc", "#1f678a", "#92a8b7", "#5eadd5", "#6c79db", "#a68122", "#ffd569", "#439966", "#800432", "#067dcc"]
            },
            stats: {
                id: null
            },
            highlight_color: "#5eadd5",
            /** TODO:
             *  1) this should be an array of layers/maps to interact with
             *  2) the load/redraw should be done at the level of application probably
             *  with a CALLBACK function and not in here
             */
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
        return [{ name: 'Histogram', data: data  }];
    }

    FNX_RASTER_HISTOGRAM.prototype.createChart = function(obj) {
        $("#" + this.o.chart.id).empty();
        var _this= this;
        var c = {
            chart: {
                renderTo: this.o.chart.id,
                events: {
                    redraw: function (e) {
                        // TODO: make it nicer the selection of the SLD to apply
                        var selectedMin = parseFloat(this.xAxis[0].categories[Math.round(this.xAxis[0].min)])
                        var selectedMax = parseFloat(this.xAxis[0].categories[Math.round(this.xAxis[0].max)])
                        if (selectedMin != this.xAxis[0].originalMin || selectedMax != this.xAxis[0].originalMax) {
                           var min = (selectedMin >= this.xAxis[0].originalMin)? selectedMin: this.xAxis[0].originalMin;
                           var max = (selectedMax <= this.xAxis[0].originalMax)? selectedMax: this.xAxis[0].originalMax;

                            _this.applyStyle(_this.o.l,
                                    '* {' +
                                    'raster-channels: auto;' +
                                    'raster-color-map-type: intervals;' +
                                    'raster-color-map:' +
                                    'color-map-entry(black, ' + min+ ', 0)' +
                                    'color-map-entry('+ _this.o.highlight_color +',  ' + max + ')' +
                                    '}'
                            );
                        }
                        else {
                            _this.o.l.leafletLayer.wmsParams.sld = "";
                            _this.o.l.leafletLayer.redraw()
                        }
                    },
                    load: function (e) {
                        this.xAxis[0].originalMin = parseFloat(this.xAxis[0].categories[0]);
                        this.xAxis[0].originalMax = parseFloat(this.xAxis[0].categories[this.xAxis[0].categories.length-1]);
                    }
                }
            },
            xAxis: {
                categories: obj.categories,
                tickInterval: 20,
                labels: {
                    rotation: -45
                }

            },
            series: obj.series
        };
        // merge with the option passed to the main object
        c = $.extend(true, {}, this.o.chart.c, c);
        // merge with the option in the template
        c = $.extend(true, {}, this.histogram_template, c);
        this.o.chart.chartObj = new Highcharts.Chart(c);
    }

    FNX_RASTER_HISTOGRAM.prototype.applyStyle = function(l, style) {
        console.log(l);
        console.log(style);
        var data = {
            stylename: l.layer.layers,
            style: style
        };
        var url = this.o.url_css2sld;
        var _this = this;
        $.ajax({
            type : 'POST',
            url  : url,
            data : data,
            success : function(response) {
                l.leafletLayer.wmsParams.sld = response;
                l.leafletLayer.redraw()
            },
            error : function(err, b, c) {
                _this.loadingwindow.hidePleaseWait()
                alert(err.responseJSON.message);
            }
        });
    };

    return FNX_RASTER_HISTOGRAM;
});