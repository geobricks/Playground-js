define(['jquery',
    'mustache',
    'text!fnx_maps_raster_compare/html/template.html',
    'text!fnx_maps_raster_compare/config/chart_scatter_template.json',
    'FNX_MAPS_LOADING_WINDOW',
    'fenix-map',
    'highcharts',
    'bootstrap',
    'FMChartScatter'], function ($, Mustache, templates, chart_scatter_template, loadingwindow) {

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
                id: "fnx_raster_compare_chart_scatter",
                maps: []
            },

            "chart_histogram2": {
                id: "fnx_raster_compare_chart_scatter",
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
        chart_scatter_template = $.parseJSON(chart_scatter_template);
        loadingwindow = new loadingwindow()

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

        var _this =this;
        $("#pgeo_dist_analysis_button").bind("click", {layer_id1 : o.prod1.layers_id, layer_id2 : o.prod2.layers_id},function(event) {
            var uids = []
            uids.push($("#" + event.data.layer_id1).chosen().val())
            uids.push($("#" + event.data.layer_id2).chosen().val());
            if ( uids[0] == "")
                uids.splice(0, 1)
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

        $( "#" + dropdowndID ).change({ mapObj: mapObj}, function (event) {
            console.log("build_dropdown_layers");
            _this.build_dropdown_layers(layer_dd_ID, $(this).val(), event.data.mapObj)
        });

        // this shouldn't be here
        var _this = this;
        $( "#" + layer_dd_ID ).change({ mapObj : mapObj}, function (event) {
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


            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + id + " :selected").text();
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.defaultgfi = true;
            layer.openlegend= true;
            mapObj.default_layer = new FM.layer(layer);
            mapObj.m.addLayer(mapObj.default_layer);

            // caching scatter and histograms
            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + id + " :selected").text() + " Scatter";
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.style = "TO BE APPLIED ON THE FLY!"
            mapObj.layer_scatter = new FM.layer(layer, mapObj.m);

            var layer = {};
            layer.layers = $(this).val()
            layer.layertitle = $("#" + id + " :selected").text() + " Histogram";
            layer.urlWMS = _this.o.url_geoserver_wms
            layer.style = "TO BE APPLIED ON THE FLY!"
            mapObj.layer_histogram = new FM.layer(layer, mapObj.m);
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
                console.log("here");
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

    FNX_RASTER_COMPARE.prototype.build_map = function(id) {
            var options = {
                plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
                guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
                gui: {disclaimerfao: true }
            }

            var mapOptions = { zoomControl:false, attributionControl: false };
            CONFIG.m = new FM.Map(id, options, mapOptions);
            CONFIG.m.createMap();

            var layer = {};
            layer.layers = "gaul0_3857"
            layer.layertitle = "Administrative unit1"
            layer.urlWMS = CONFIG.url_geoserver_wms
            layer.opacity='0.7';
            layer.zindex= 500;
            layer.style = 'gaul0_highlight_polygon';
            layer.cql_filter="adm0_code IN (0)";
            CONFIG.l_gaul0_highlight = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul0_highlight);

            var layer = {};
            layer.layers = "fenix:gaul0_line_3857"
            layer.layertitle = "Boundaries"
            layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
            layer.styles = "gaul0_line"
            layer.opacity='0.7';
            layer.zindex= 550;
            CONFIG.l_gaul0 = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul0);
        }

    FNX_RASTER_COMPARE.prototype.collector_to_build_stats = function() {
            var gaul = $("#ew_drowdown_gaul_select").chosen().val();
            var threshold = $("#ew_threshold").val();
            // TODO: check threshold
            // TODO: function
            if ( CONFIG.l.layer.layers && gaul.length > 0) {
                build_stats(CONFIG.l.layer.layers, gaul, threshold, "ew_stats")
            }
        }

    FNX_RASTER_COMPARE.prototype.create_analysis = function(uids) {
        $('#' + this.o.content_id).html($(templates).filter('#' + this.o.content_template_id).html());

        var o = this.o;
        var template = $(templates).filter('#' + o.content_template_id).html();
        $('#' + o.content_id).html(template);

        // create the analysis widgets
        this.scatter_analysis(uids, this.o.map1, this.o.map2)
        this.histogram_analysis(this.o.uids)
    }

    FNX_RASTER_COMPARE.prototype.scatter_analysis = function(uids, map1, map2) {
        loadingwindow.showPleaseWait()
        var url = this.o.url_stats_rasters_scatter_plot;
        url = url.replace("{{LAYERS}}", uids)
        var _this = this;
        $.ajax({
            type : 'GET',
            url : url,
            contentType: 'application/json;charset=UTF-8',
            success : function(response) {
                loadingwindow.hidePleaseWait();
                response = (typeof response == 'string')? $.parseJSON(response): response;
                _this.createScatter(response, map1, map2)
            },
            error : function(err, b, c) {
                $('#' + _this.o.content_id).empty();
                loadingwindow.hidePleaseWait()
                alert(err.responseJSON.message);
            }
        });
    }

    FNX_RASTER_COMPARE.prototype.histogram_analysis = function(id, uid, map) {


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
                        // Get min/Max

                        // Get SLD

                        // Apply SLD the scatter layer

                        console.log(this.xAxis[0].min, this.xAxis[0].max, this.yAxis[0].min,  this.yAxis[0].max);
                            //mapsSpatialQueries(mapsObj, series,  this.xAxis[0].min, this.xAxis[0].max, this.yAxis[0].min, this.yAxis[0].max)
                        console.log(map1);
                        console.log(map2);

                        _this.applyStyle(map1.layer_scatter,
                               '* {'+
                            'raster-channels: auto;' +
                            'raster-color-map:'+
                            'color-map-entry(black, ' + this.xAxis[0].min + ', 0)'+
                            'color-map-entry(red, ' + this.xAxis[0].min + ')'+
                            'color-map-entry(black,  ' + this.xAxis[0].max + ', 0)'+
                            '}'
                        );

                        _this.applyStyle(map2.layer_scatter,
                                '* {'+
                                'raster-channels: auto;' +
                                'raster-color-map:'+
                                'color-map-entry(black, ' + this.yAxis[0].min + ', 0)'+
                                'color-map-entry(red, ' + this.yAxis[0].min + ')'+
                                'color-map-entry(black,  ' + this.yAxis[0].max + ', 0)'+
                                '}'
                        );
                    }
                }
            },
            series: response.series
        };
//        var time_create_data = Date.now();
//        var n1 = Date.now() - time_create_data;
        //chart.redraw();
//        var time_to_draw = Date.now() - time_create_data;
//        var end = new Date().getTime();
//        $('#time').text('Render To create serie: '+(n1)+' mSec');
//        $('#time_all').text('Render Time: All: '+(time_to_draw)+' mSec');
        c = $.extend(true, {}, chart_scatter_template, c);
        var chart = new Highcharts.Chart(c);
    }

    FNX_RASTER_COMPARE.prototype.applyStyle = function(l, style) {
        console.log("APPLY STYLE");
        console.log(l);
        console.log(style);
        var data = {
            stylename: l.layer.layers,
            style: style
        };

        console.log(data);
        $.ajax({
            type : 'POST',
            url  : "http://fenixapps2.fao.org/geoservices/CSS2SLD",
            data : data,
            success : function(response) {
                console.log(response);

                try {
                    l._fenixMap.removeLayer(l)
                } catch (e) {}
                l.addLayer()

                //l.leafletLayer.wmsParams.sld_body = response;
                l.leafletLayer.wmsParams.sld = response;
                l.leafletLayer.redraw();
            },
            error : function(err, b, c) {
               console.log(err);
                loadingwindow.hidePleaseWait()
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

    FNX_RASTER_COMPARE.prototype.createLayer = function() {
            var layer = FMDEFAULTLAYER.getLayer("GAUL1", true)
            layer.urlWMS = CONFIG.url_geoserver_wms
            layer.layertitle="Scatter layer x/y"
            layer.opacity='0.8'
            layer.joindata=''
            layer.addborders='true'
            layer.borderscolor='FFFFFF'
            layer.bordersstroke='0.8'
            layer.bordersopacity='0.4'
            layer.legendtitle='x/y'
            layer.mu = 'Index';
            //layer.layertype = 'JOIN';
            //layer.lang='e';
            layer.jointype='shaded';
            layer.defaultgfi = true;
            layer.openlegend = true;
            layer.intervals='5';
            layer.colorramp='YlOrRd';
//            layer.colors='33CCff,00CCFF,0099FF,0066FF,0000FF';

            layer.formula = '(series[i].data[j].x / series[i].data[j].y)';
            //layer.formula = '';
            //layer.formula = '(series[i].data[j].y)';
            layer.reclassify = false;

            var l = new FM.layer(layer);
            l.zindex = 100
            return l
    }


    return FNX_RASTER_COMPARE;
});