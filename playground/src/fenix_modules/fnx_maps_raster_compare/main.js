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
                id_stats: "fnx_raster_compare_chart_scatter_stats",
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
                layer_histogram: null, // the highlighted pixels from the histogram chart
                mapOptions: {
                    lat: 32.650000,
                    lng: -8.433333,
                    zoom: 9
                }
            },

            "map2": {
                id: "fnx_raster_compare_map2",
                m: null,
                default_layer: null,
                layer_scatter: null,
                layer_histogram: null,
                mapOptions: {
                    lat: 32.650000,
                    lng: -8.433333,
                    zoom: 9
                }
            },

            // TODO: default product and layer to be shown if they exists
            "default_product_list": ["Doukkala - wheat seasonal", "Doukkola - NDVI", "Doukkola - Temperature", "Doukkala - reference evapotransipiration", "Doukkala - actual evapotransipiration", "Doukkala - potential evapotransipiration", "Doukkola - Precipitation"],
            "default_product1": {
                "product_code": "Doukkala - wheat seasonal",
                "layer_code": "fenix:actual_-_yield"
            },
            "default_product2": {
                "product_code": "Doukkala - wheat seasonal",
                "layer_code": "fenix:potential_-_yield"
            }
        };
    }

    FNX_RASTER_COMPARE.prototype.force_map_refresh = function() {
        console.log("");
        this.o.map1.m.map.invalidateSize();
        this.o.map2.m.map.invalidateSize();
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
        var map1 = this.createMap(o.map1.id, o.map1.mapOptions);
        var map2 = this.createMap(o.map2.id, o.map2.mapOptions);
        map1.syncOnMove(map2);
        map2.syncOnMove(map1);

        // caching maps
        this.o.map1.m = map1;
        this.o.map2.m = map2;

        // building dropdowns
        this.build_dropdown_products(o.prod1.id, o.prod1.layers_id, this.o.map1, this.o.default_product1, this.o.default_product_list)
        this.build_dropdown_products(o.prod2.id, o.prod2.layers_id, this.o.map2, this.o.default_product2, this.o.default_product_list)

        var _this = this;
        $("#fnx_raster_compare_analysis_button").bind("click", {layer_id1 : o.prod1.layers_id, layer_id2 : o.prod2.layers_id},function(event) {
            var uids = []
            uids.push($("#" + event.data.layer_id1).chosen().val())
            uids.push($("#" + event.data.layer_id2).chosen().val());
            _this.create_analysis(uids)
        });
    };

    FNX_RASTER_COMPARE.prototype.build_dropdown_products = function(id, layer_dd_ID, mapObj, default_product, default_product_list) {
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

    FNX_RASTER_COMPARE.prototype.build_dropdown_products_response = function(id, layer_dd_ID, response, mapObj, default_product) {
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
            _this.layer_selected(event.data.mapObj, $(this).val(), $("#" + layer_dd_ID + " :selected").text())
        });

        // set default product if exists
        if ( default_product ) {
            $('#' + dropdowndID).val(default_product.product_code).trigger("chosen:updated");
            this.build_dropdown_layers(layer_dd_ID, default_product.product_code, mapObj, default_product.layer_code)
        }
    }

    FNX_RASTER_COMPARE.prototype.layer_selected = function(mapObj, uid, layertitle) {
        // remove the scatter analysis applied until now
        $('#' + this.o.content_id).empty();

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
        layer.layers = uid;
        layer.layertitle = layertitle
        layer.urlWMS = this.o.url_geoserver_wms
        layer.defaultgfi = true;
        layer.openlegend= true;
        mapObj.default_layer = new FM.layer(layer);
        mapObj.m.addLayer(mapObj.default_layer);

        // caching scatter and histograms (TODO: it should be added dinamically to the map at runtime)
        var layer = {};
        layer.layers = uid;
        layer.layertitle = "Scatter - " + layertitle;
        layer.urlWMS = this.o.url_geoserver_wms
        layer.style = "THIS IS APPLIED ON THE FLY!"
        //layer.hideLayerInControllerList = true; // to don't show the layer on the layer's list
        mapObj.layer_scatter = new FM.layer(layer, mapObj.m);
        mapObj.m.addLayer(mapObj.layer_scatter);

        var layer = {};
        layer.layers = uid;
        layer.layertitle = "Histogram - " + layertitle;
        layer.urlWMS = this.o.url_geoserver_wms
        layer.style = "THIS IS APPLIED ON THE FLY!"
        //layer.hideLayerInControllerList = true; // to don't show the layer on the layer's list
        mapObj.layer_histogram = new FM.layer(layer, mapObj.m);
        mapObj.m.addLayer(mapObj.layer_histogram);
    }

    FNX_RASTER_COMPARE.prototype.select_product = function() {
    }

    FNX_RASTER_COMPARE.prototype.build_dropdown_layers = function(id, product, mapObj, default_layer) {
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

    FNX_RASTER_COMPARE.prototype.build_dropdown_layers_response = function(id, product, response, mapObj, default_layer) {
        var lang = this.o.lang.toLocaleUpperCase()
        response = (typeof response == 'string')? $.parseJSON(response): response;
        var html = '<option value=""></option>';
        for(var i=0; i < response.length; i++) {
            html += '<option value="' + response[i].uid + '">' + response[i].title[lang] + '</option>';
        }
        $('#' + id).append(html);
        $('#' + id).trigger("chosen:updated");

        if ( default_layer ) {
            $('#' + id).val(default_layer).trigger("chosen:updated");
            this.layer_selected(mapObj, default_layer, $("#" + id + " :selected").text())
        }
    }

    FNX_RASTER_COMPARE.prototype.create_analysis = function(uids) {
        $('#' + this.o.content_id).html($(templates).filter('#' + this.o.content_template_id).html());

        var o = this.o;
        var template = $(templates).filter('#' + o.content_template_id).html();
        $('#' + o.content_id).html(template);

        // create the analysis widgets
        this.scatter_analysis(uids, this.o.map1, this.o.map2)
        this.histogram_analysis(this.o.chart_histogram1.id, uids[0], this.o.map1.layer_histogram)
        this.histogram_analysis(this.o.chart_histogram2.id, uids[1], this.o.map2.layer_histogram)
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
                _this.createScatterStats(_this.o.chart_scatter.id_stats, response["stats"])
            },
            error : function(err, b, c) {
                $('#' + _this.o.content_id).empty();
                _this.loadingwindow.hidePleaseWait()
                alert(err.responseJSON.message);
            }
        });
    }

    FNX_RASTER_COMPARE.prototype.histogram_analysis = function(id, uid, l) {
        var obj = {
            chart : {
                id : id //'fnx_raster_compare_chart_histogram1'
            },
            l : l
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

    FNX_RASTER_COMPARE.prototype.createScatterStats = function(id, values) {
        var $id = $('#' + id);
        $id.empty();
//        $id.append("<div>Slope: "+ values.slope +"</div>")
//        $id.append("<div>P-Value: "+ values.p_value +"</div>")
//        $id.append("<div>Standard Error: "+ values.std_err +"</div>")
//        $id.append("<div>Intercept: "+ values.intercept +"</div>")
        $id.append("<div>R-Square: "+ values.r_value +"</div>")
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

    FNX_RASTER_COMPARE.prototype.createMap = function(mapID, opt) {
        var options = {
            plugins: {
                geosearch : false,
                mouseposition: false,
                controlloading : false,
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
        var lat = (opt.lat)? opt.lat: 0;
        var lng = (opt.lng)? opt.lng: 0;
        var zoom = (opt.zoom)? opt.zoom: 15;
        m.createMap(lat, lng, zoom);

        // Boundaries
        var layer = {};
        layer.layers = "fenix:gaul0_line_3857"
        layer.layertitle = "Boundaries"
        layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
        layer.styles = "gaul0_line"
        layer.opacity='0.55';
        //layer.hideLayerInControllerList = true;
        //layer.visibility = false
        layer.zindex= 200;
        var l = new FM.layer(layer);
        m.addLayer(l);


        var layer = {};
        layer.layers = "fenix:CPBS_CPHS_TMercator"
        layer.layertitle = "CPBS CPHS"
        layer.urlWMS = "http://168.202.28.214:9090/geoserver/wms"
        layer.opacity='0.55';
        //layer.hideLayerInControllerList = true;
        //layer.visibility = false
        layer.zindex= 201;
        var l = new FM.layer(layer);
        m.addLayer(l);

        var layer = {};
        layer.layers = "fenix:Perimetre_de_gestion_TMercator"
        layer.layertitle = "Perimetre de gestion"
        layer.urlWMS = "http://168.202.28.214:9090/geoserver/wms"
        layer.opacity='0.55';
        //layer.hideLayerInControllerList = true;
        layer.visibility = false
        layer.zindex= 202;
        var l = new FM.layer(layer);
        m.addLayer(l);

//        var layer = {};
//        layer.layers = "fenix:Doukkala_G2015_4_3857"
//        layer.layertitle = "Doukkala GAUL4"
//        layer.urlWMS = "http://168.202.28.214:9090/geoserver/wms"
//        layer.opacity='0.7';
//        //layer.hideLayerInControllerList = true;
//        //layer.visibility = false
//        layer.zindex= 202;
//        var l = new FM.layer(layer);
//        m.addLayer(l);

        return m;
    }

    return FNX_RASTER_COMPARE;
});