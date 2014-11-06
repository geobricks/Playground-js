define(['jquery',
    'mustache',
    'text!fnx_maps_histogram_analysis/html/template.html',
    'text!fnx_maps_histogram_analysis/config/chart_scatter_template.json',
    'FNX_RASTER_HISTOGRAM_MODULE',
    'FNX_MAPS_LOADING_WINDOW',
    'fenix-map',
    'highcharts',
    'bootstrap',
    'FMChartScatter'], function ($, Mustache, templates, chart_scatter_template, Histogram, loadingwindow) {

    'use strict';

    function FNX_HISTOGRAM_ANALYSIS() {
        this.o = {
            lang : 'en',
            "placeholder": "main_content_placeholder",
            "template_id": "structure",
            "content_id": "fnx_raster_histogram_content",
            "button_add_histogram_id": "fnx_raster_histogram_add",

            "content_template_id": "fnx_raster_histogram_content_template",

            // used to build dinamically the charts (TODO: remove and build it really dinamically)
            "histogram_base_id": "fnx_raster_histogram_chart_",
            "counter_histogram_id": 0,
            "counter_histogram_current_id": 0,


            // Objects interaction
            "prod" : {
                id : "fnx_raster_histogram_prod1",
                layers_id: "fnx_raster_histogram_layers_select1"
            },

            "chart_histogram": {
                id: "fnx_raster_histogram_chart_histogram1",
                maps: []
            },

            "map": {
                id: "fnx_maps_histogram_analysis_map",
                m: null,
                lat: 32.650000,
                lng: -8.433333,
                zoom: 10,
                l: null // cached layer used to change visible view
            },



            // TODO: default product and layer to be shown if they exists
            "default_product_list": ["Doukkala - wheat seasonal", "Doukkola - NDVI", "Doukkola - Temperature", "Doukkala - reference evapotransipiration", "Doukkala - actual evapotransipiration", "Doukkala - potential evapotransipiration", "Doukkola - Precipitation"],
            "default_product": {
                "product_code": "Doukkala - wheat seasonal",
               "layer_code": "fenix:actual_-_transpiration"
            }
        };
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.init = function(obj) {
        console.log(obj);
        this.o = $.extend(true, {}, this.o, obj);
        var o = this.o
        var template = $(templates).filter('#' + o.template_id).html();
        $('#' + o.placeholder).html(template);

        // parsing the chart temaplte and initialize loading window
        this.loadingwindow = new loadingwindow()

        // building dropdowns
        this.build_dropdown_products(o.prod.id, o.prod.layers_id, this.o.map, this.o.default_product, this.o.default_product_list)

        // create histograms rows
        var t = $(templates).filter('#' + o.content_template_id).html();
        for (var j=0; j < 10; j++) {
            var view = {}
            for (var i = 0; i < 3; i++) {
                view['chart_id' + i] = o.histogram_base_id + o.counter_histogram_id++;
            }
            var render = Mustache.render(t, view);
            $("#" + o.content_id).append(render);
        }

        // bind button to add histogram
        var _this = this;
        $("#" + o.button_add_histogram_id).bind( "click", function() {
            var uid = $("#" + _this.o.prod.layers_id).chosen().val()
            var title = $("#" + _this.o.prod.layers_id + " :selected").text()
            var id = _this.o.histogram_base_id + _this.o.counter_histogram_current_id++;
            _this.add_histogram(id, uid, title)
            _this.add_layer(uid, title);
        });

        // create map
        this.o.map.m = this.create_map(this.o.map.id)
    };

    FNX_HISTOGRAM_ANALYSIS.prototype.force_map_refresh = function() {
        this.o.map.m.map.invalidateSize();
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.build_dropdown_products = function(id, layer_dd_ID, mapObj, default_product, default_product_list) {
        if ( default_product_list) {
            this.build_dropdown_products_response(id, layer_dd_ID, default_product_list, mapObj, default_product)
        }
        else {
            var _this = this;
            var url = this.o.url_search_all_products
            $.ajax({
                type: 'GET',
                url: url,
                success: function (response) {
                    _this.build_dropdown_products_response(id, layer_dd_ID, response, mapObj, default_product)
                },
                error: function (err, b, c) {
                }
            });
        }
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.build_dropdown_products_response = function(id, layer_dd_ID, response, mapObj, default_product) {
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
//        $( "#" + layer_dd_ID ).change({ mapObj : mapObj}, function (event) {
//            _this.add_layer($(this).val(), $("#" + layer_dd_ID + " :selected").text());
//        });

        // set default product if exists
       if ( default_product ) {
           $('#' + dropdowndID).val(default_product.product_code).trigger("chosen:updated");
           this.build_dropdown_layers(layer_dd_ID, default_product.product_code, mapObj, default_product.layer_code)
       }
    }


    FNX_HISTOGRAM_ANALYSIS.prototype.build_dropdown_layers = function(id, product, mapObj, default_layer) {
        var url = this.o.url_search_layer_product + product;
        var _this = this;
        $("#" + id).empty()
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                _this.build_dropdown_layers_response(id, product, response, mapObj, default_layer)
            },
            error : function(err, b, c) {}
        });
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.build_dropdown_layers_response = function(id, product, response, mapObj, default_layer) {
        var lang = this.o.lang.toLocaleUpperCase()
        response = (typeof response == 'string')? $.parseJSON(response): response;
        var html = '<option value=""></option>';
        for(var i=0; i < response.length; i++) {
            html += '<option value="' + response[i].uid + '">' + response[i].title[lang] + '</option>';
        }
        $('#' + id).append(html);
        $('#' + id).trigger("chosen:updated");

        try {
            if (default_layer) {
                $('#' + id).val(default_layer).trigger("chosen:updated");
                this.layer_selected(mapObj, default_layer, $("#" + id + " :selected").text())
            }
        }catch (e) {}
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.add_histogram = function(id, uid, title) {
        this.histogram_analysis(id, uid, title)
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.add_layer = function(uid, title) {
        try {
            if (this.o.map.l)
                this.o.map.m.removeLayer(this.o.map.l)
        } catch (e) {}

        var layer = {};
        layer.layers = uid
        layer.layertitle = title
        layer.urlWMS = this.o.url_geoserver_wms;
        layer.openlegend = true;
        layer.defaultgfi = true;
        var l = new FM.layer(layer);

        // caching the layer (to be overwritten)
        this.o.map.l = l;
        this.o.map.m.addLayer(l);
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.scatter_analysis = function(uids, map1, map2) {
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


    FNX_HISTOGRAM_ANALYSIS.prototype.create_map = function(id) {
        var options = {
            plugins: { geosearch : false, mouseposition: false, controlloading : false, zoomControl: 'bottomright'},
            guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
            gui: {disclaimerfao: true }
        }

        var mapOptions = { zoomControl:false,attributionControl: false };
        var m = new FM.Map(id, options, mapOptions);
        var lat = (this.o.map.lat)? this.o.map.lat: 0;
        var lng = (this.o.map.lng)? this.o.map.lng: 0;
        var zoom = (this.o.map.zoom)? this.o.map.zoom: 15;
        m.createMap(lat, lng, zoom);

        var layer = {};
        layer.layers = "fenix:gaul0_line_3857"
        layer.layertitle = "Boundaries"
        layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
        layer.styles = "gaul0_line"
        layer.opacity='0.7';
        layer.zindex= 200;
        var l = new FM.layer(layer);
        m.addLayer(l);

        var layer = {};
        layer.layers = "fenix:CPBS_CPHS_TMercator"
        layer.layertitle = "Irrigation Canals"
        layer.urlWMS = this.o.url_geoserver_wms;
        layer.opacity='0.55';
        //layer.hideLayerInControllerList = true;
        layer.visibility = false
        layer.zindex= 202;
        var l = new FM.layer(layer);
        m.addLayer(l);

        var layer = {};
        layer.layers = "fenix:winter_crop_classification"
        layer.layertitle = "Winter crop classification"
        layer.urlWMS = this.o.url_geoserver_wms;
        layer.opacity = '1';
        layer.openlegend = true;
        //layer.hideLayerInControllerList = true;
        //layer.visibility = false
        layer.zindex= 203;
        this.o.map.l = new FM.layer(layer);
        m.addLayer(this.o.map.l);

        return m;
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.histogram_analysis = function(id, uid, title) {
        console.log(id + " " + uid);
        var obj = {
            chart: {
                id: id,
                c:  {
                    title: {
                        text: title
                    }
                }
            },
            l: {
                layer: {
                    layers: uid
                }
            }
        }
        var o = $.extend(true, {}, obj, this.o);
        var hist = new Histogram();
        hist.init(o);
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.get_string_codes = function(values) {
        var codes= ""
        for( var i=0; i < values.length; i++) {
            codes += "'"+ values[i] +"',"
        }
        return codes.substring(0, codes.length - 1);
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.get_string_uids = function(values) {
        var codes= ""
        for( var i=0; i < values.length; i++) {
            codes += "" + values[i] +";"
        }
        return codes.substring(0, codes.length - 1);
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.createScatter =  function(response, map1, map2) {
        var _this = this;
        var c = {
            chart: {
                renderTo: this.o.chart_scatter.id,
                events: {
                    redraw: function (e) {

                        // TODO: make it nicer the selection of the SLD to apply
                        if (this.xAxis[0].min !=  this.xAxis[0].originalMin || this.xAxis[0].max  !=  this.xAxis[0].originalMax) {
                            var min = (this.xAxis[0].min >= this.xAxis[0].originalMin)? this.xAxis[0].min : this.xAxis[0].originalMin
                            var max = (this.xAxis[0].max <= this.xAxis[0].originalMax)? this.xAxis[0].max : this.xAxis[0].originalMax
                            _this.applyStyle(map1.m, map1.layer_scatter,
                                    '* {' +
                                    'raster-channels: auto;' +
                                    'raster-color-map-type: intervals;' +
                                    'raster-color-map:' +
                                    'color-map-entry(black, ' + min + ', 0)' +
                                    'color-map-entry(purple,  ' + max + ')' +
                                    '}'
                            );
                        }
                        else {
                            map1.layer_scatter.leafletLayer.wmsParams.sld = "";
                            map1.layer_scatter.leafletLayer.redraw()
                        }

                        if (this.yAxis[0].min !=  this.yAxis[0].originalMin || this.yAxis[0].max  !=  this.yAxis[0].originalMax) {
                            var min = (this.yAxis[0].min >= this.yAxis[0].originalMin)? this.yAxis[0].min : this.yAxis[0].originalMin
                            var max = (this.yAxis[0].max <= this.yAxis[0].originalMax)? this.yAxis[0].max : this.yAxis[0].originalMax
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
                    }
                }
            },
            series: response.series
        };
        c = $.extend(true, {}, this.chart_scatter_template, c);
        this.o.chart_scatter.chartObj = new Highcharts.Chart(c);
    }

    FNX_HISTOGRAM_ANALYSIS.prototype.applyStyle = function(m, l, style) {
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

    FNX_HISTOGRAM_ANALYSIS.prototype.createMap = function(mapID, uid) {
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

    return FNX_HISTOGRAM_ANALYSIS;
});