define(['jquery',
    'mustache',
    'text!fnx_maps_raster_compare/html/template.html',
    'text!fnx_maps_raster_compare/config/chart_scatter_template.json',
    'FNX_RASTER_HISTOGRAM_MODULE',
    'FNX_MAPS_LOADING_WINDOW',
    'fenix-map',
    'highcharts',
    'bootstrap',
    'FMChartScatter'], function ($, Mustache, templates, chart_scatter_template, Histogram, loadingwindow) {

    'use strict';

    function FNX_RASTER_COMPARE() {
        this.o = {
            lang : 'en',
            "placeholder": "main_content_placeholder",
            "template_id": "structure",
            "content_id": "fnx_raster_compare_content",
            "content_template_id": "fnx_raster_compare_content_template",

            // Objects interaction
            "prod1" : {
                id : "fnx_raster_compare_prod1",
                layers_id: "fnx_raster_compare_layers_select1"
            },

            "prod2" : {
                id : "fnx_raster_compare_prod2",
                layers_id: "fnx_raster_compare_layers_select2"
            },

            "chart_scatter": {
                id: "fnx_raster_compare_chart_scatter",
                maps: []
            },

            "chart_histogram1": {
                id: "fnx_raster_compare_chart_histogram1",
                maps: []
            },

            "chart_histogram2": {
                id: "fnx_raster_compare_chart_histogram2",
                maps: []
            },

            "map1": {
                id: "fnx_raster_compare_map1",
                m: null,
                default_layer: null, // the one selected from the dropdown
                layer_scatter: null, // the highlighted pixels from the scatter chart
                layer_histogram: null // the highlighted pixels from the histogram chart
            },

            "map2": {
                id: "fnx_raster_compare_map2",
                m: null,
                default_layer: null,
                layer_scatter: null,
                layer_histogram: null
            }
        };
    }

    FNX_RASTER_COMPARE.prototype.init = function(obj) {
        this.o = $.extend(true, {}, this.o, obj);
        var o = this.o
        var template = $(templates).filter('#' + o.template_id).html();
        $('#' + o.placeholder).html(template);


        // parsing the chart temaplte and initialize loading window
        this.chart_scatter_template = $.parseJSON(chart_scatter_template);
        this.loadingwindow = new loadingwindow()

        // creating objects
        var map1 = this.createMap(o.map1.id);
        var map2 = this.createMap(o.map2.id);
        map1.syncOnMove(map2);
        map2.syncOnMove(map1);

        // caching maps
        this.o.map1.m = map1;
        this.o.map2.m = map2;

        // building dropdowns
        this.build_dropdown_products(o.prod1.id, o.prod1.layers_id, this.o.map1)
        this.build_dropdown_products(o.prod2.id, o.prod2.layers_id, this.o.map2)

        var _this = this;
        $("#pgeo_dist_analysis_button").bind("click", {layer_id1 : o.prod1.layers_id, layer_id2 : o.prod2.layers_id},function(event) {
            var uids = []
            uids.push($("#" + event.data.layer_id1).chosen().val())
            uids.push($("#" + event.data.layer_id2).chosen().val());
            _this.create_analysis(uids)
        });
    };

    FNX_RASTER_COMPARE.prototype.build_dropdown_products = function(id, layer_dd_ID, mapObj) {
        var _this =this;
        var url = this.o.url_search_all_products
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                _this.build_dropdown_products_response(id, layer_dd_ID, response, mapObj)
            },
            error : function(err, b, c) {}
        });
    }

    FNX_RASTER_COMPARE.prototype.build_dropdown_products_response = function(id, layer_dd_ID, response, mapObj) {
        var _this =this;
        response = (typeof response === 'string')? $.parseJSON(response): response;
        var dropdowndID = id + "_select";
        var html = '<select id="'+ dropdowndID+'" style="width:100%;">';
        html += '<option value=""></option>';
        for(var i=0; i < response.length; i++) {
            html += '<option value="' + response[i] + '">' + response[i] + '</option>';
        }
        html += '</select>';

        $('#' + id).empty();
        $('#' + id).append(html);

        try {
            $('#' + dropdowndID).chosen({disable_search_threshold:6, width: '100%'});
        }  catch (e) {}

        // change dropdowns layers
        $( "#" + dropdowndID ).change({ mapObj: mapObj}, function (event) {
            _this.build_dropdown_layers(layer_dd_ID, $(this).val(), event.data.mapObj)
        });

        // this shouldn't be here
        // change layer in the map
        var _this = this;
        $( "#" + layer_dd_ID ).change({ mapObj : mapObj}, function (event) {

            // remove the scatter analysis applied until now
            $('#' + _this.o.content_id).empty();

            var mapObj = event.data.mapObj;
            // remove the layers if exists on the map
            if ( mapObj.default_layer)
                mapObj.m.removeLayer(mapObj.default_layer)
            try {
                if (mapObj.layer_scatter)
                    mapObj.m.removeLayer(mapObj.layer_scatter)
            } catch (e) {}
            try {
                if ( mapObj.default_layer)
                    mapObj.m.removeLayer(mapObj.layer_histogram)
            } catch (e) {}

            // remove all layers
            try {
                mapObj.m.removeLayer(mapObj.default_layer)
            }catch (e){}
            try {
                mapObj.m.removeLayer(mapObj.layer_scatter)
            }catch (e){}
            try {
                mapObj.m.removeLayer(mapObj.layer_histogram)
            }catch (e){}

            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + layer_dd_ID + " :selected").text();
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.defaultgfi = true;
            layer.openlegend= true;
            mapObj.default_layer = new FM.layer(layer);
            mapObj.m.addLayer(mapObj.default_layer);

            // caching scatter and histograms (TODO: it should be added dinamically to the map at runtime)
            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + layer_dd_ID + " :selected").text() + " - Scatter";
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.style = "THIS IS APPLIED ON THE FLY!"
            mapObj.layer_scatter = new FM.layer(layer, mapObj.m);
            mapObj.m.addLayer(mapObj.layer_scatter);

            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + layer_dd_ID + " :selected").text() + " - Histogram";
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.style = "THIS IS APPLIED ON THE FLY!"
            mapObj.layer_histogram = new FM.layer(layer, mapObj.m);
            mapObj.m.addLayer(mapObj.layer_histogram);
        });
    }

    FNX_RASTER_COMPARE.prototype.build_dropdown_layers = function(id, product, mapObj) {
        var url = this.o.url_search_layer_product + product;
        var _this = this;
        $("#" + id).empty()
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                _this.build_dropdown_layers_response(id, product, response, mapObj)
            },
            error : function(err, b, c) {}
        });
    }

    FNX_RASTER_COMPARE.prototype.build_dropdown_layers_response = function(id, product, response, mapObj) {
        var lang = this.o.lang.toLocaleUpperCase()
        response = (typeof response == 'string')? $.parseJSON(response): response;
        var html = '<option value=""></option>';
        for(var i=0; i < response.length; i++) {
            html += '<option value="' + response[i].uid + '">' + response[i].title[lang] + '</option>';
        }
        $('#' + id).append(html);
        $('#' + id).trigger("chosen:updated");
    }

    FNX_RASTER_COMPARE.prototype.create_analysis = function(uids) {
        $('#' + this.o.content_id).html($(templates).filter('#' + this.o.content_template_id).html());

        var o = this.o;
        var template = $(templates).filter('#' + o.content_template_id).html();
        $('#' + o.content_id).html(template);

        // create the analysis widgets
        this.scatter_analysis(uids, this.o.map1, this.o.map2)
        this.histogram_analysis(this.o.chart_histogram1.id, uids[0], this.o.map1)
        this.histogram_analysis(this.o.chart_histogram2.id, uids[1], this.o.map2)
    }

    FNX_RASTER_COMPARE.prototype.scatter_analysis = function(uids, map1, map2) {
        this.loadingwindow.showPleaseWait()
        var url = this.o.url_stats_rasters_scatter_plot_workers.replace("{{LAYERS}}", uids)
        var _this = this;
        $.ajax({
            type : 'GET',
            url : url,
            contentType: 'application/json;charset=UTF-8',
            success : function(response) {
                _this.loadingwindow.hidePleaseWait();
                response = (typeof response == 'string')? $.parseJSON(response): response;
                _this.createScatter(response, map1, map2)
            },
            error : function(err, b, c) {
                $('#' + _this.o.content_id).empty();
                _this.loadingwindow.hidePleaseWait()
                alert(err.responseJSON.message);
            }
        });
    }

    FNX_RASTER_COMPARE.prototype.histogram_analysis = function(id, uid, map) {
        console.log(id + " " + uid);
        var obj = {
            chart : {
                id : id //'fnx_raster_compare_chart_histogram1'
            },
            l : {
                layer : {
                    layers : uid //'fenix:trmm_04_2014'
                }
            }
        }
        var o = $.extend(true, {}, obj, this.o);
        var hist = new Histogram();
        hist.init(o);
    }

    FNX_RASTER_COMPARE.prototype.get_string_codes = function(values) {
        var codes= ""
        for( var i=0; i < values.length; i++) {
            codes += "'"+ values[i] +"',"
        }
        return codes.substring(0, codes.length - 1);
    }

    FNX_RASTER_COMPARE.prototype.get_string_uids = function(values) {
        var codes= ""
        for( var i=0; i < values.length; i++) {
            codes += "" + values[i] +";"
        }
        return codes.substring(0, codes.length - 1);
    }

    FNX_RASTER_COMPARE.prototype.createScatter =  function(response, map1, map2) {
        var _this = this;
        var c = {
            chart: {
                renderTo: this.o.chart_scatter.id,
                events: {
                    redraw: function (e) {

                        // TODO: make it nicer the selection of the SLD to apply
                        if (this.xAxis[0].min !=  this.xAxis[0].originalMin || this.xAxis[0].max  !=  this.xAxis[0].originalMax) {
                            _this.applyStyle(map1.m, map1.layer_scatter,
                                    '* {' +
                                    'raster-channels: auto;' +
                                    'raster-color-map-type: intervals;' +
                                    'raster-color-map:' +
                                        'color-map-entry(black, ' + this.xAxis[0].min + ', 0)' +
                                        'color-map-entry(purple,  ' + this.xAxis[0].max + ')' +
                                    '}'
                            );
                        }
                        else {
                            map1.layer_scatter.leafletLayer.wmsParams.sld = "";
                            map1.layer_scatter.leafletLayer.redraw()
                        }

                        if (this.yAxis[0].min !=  this.yAxis[0].originalMin || this.yAxis[0].max  !=  this.yAxis[0].originalMax) {
                            _this.applyStyle(map2.m, map2.layer_scatter,
                                    '* {' +
                                    'raster-channels: auto;' +
                                    'raster-color-map-type: intervals;' +
                                    'raster-color-map:' +
                                        'color-map-entry(black, ' + this.yAxis[0].min + ', 0)' +
                                        'color-map-entry(purple,  ' + this.yAxis[0].max + ')' +
                                    '}'
                            );
                        }
                        else {
                            map2.layer_scatter.leafletLayer.wmsParams.sld = "";
                            map2.layer_scatter.leafletLayer.redraw()
                        }

                    },
                    load: function (e) {
                        this.xAxis[0].originalMin = this.xAxis[0].min;
                        this.xAxis[0].originalMax = this.xAxis[0].max;

                        this.yAxis[0].originalMin = this.yAxis[0].min;
                        this.yAxis[0].originalMax = this.yAxis[0].max;

                        // caching the Axes to be used in the selection
//                        this.originalAxes = {
//                            xmin: this.xAxis[0].min,
//                            xmax: this.xAxis[0].max,
//                            ymin: this.yAxis[0].min,
//                            ymax: this.yAxis[0].max
//                        }
                    }
                }
            },
            series: response.series
        };
        c = $.extend(true, {}, this.chart_scatter_template, c);
        this.o.chart_scatter.chartObj = new Highcharts.Chart(c);
    }

    FNX_RASTER_COMPARE.prototype.applyStyle = function(m, l, style) {
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

    FNX_RASTER_COMPARE.prototype.createMap = function(mapID, uid) {
        var options = {
            plugins: {
                geosearch : false,
                mouseposition: false,
                controlloading : true,
                zoomControl: 'bottomright'
            },
            guiController: {
                overlay : true,
                baselayer: true,
                wmsLoader: true
            },
            gui: {
                disclaimerfao: true
            }
        }

        var mapOptions = {
            zoomControl:false,
            attributionControl: false
        };

        var m = new FM.Map(mapID, options, mapOptions);
        m.createMap();

        return m;
    }

    return FNX_RASTER_COMPARE;
});