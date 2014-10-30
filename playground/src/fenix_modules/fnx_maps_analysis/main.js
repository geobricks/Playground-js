define(['jquery',
    'mustache',
    'text!fnx_maps_analysis/html/template.html',
    'text!fnx_maps_analysis/config/chart_template',
    'fenix-map',
    'highcharts',
    'chosen',
    'jquery.hoverIntent',
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

        this.create_gui()
    };

    FM_ANALYSIS.prototype.create_gui = function() {
        // create dropdown
        var view = { select_a_product: "Select a product"}
        var t = $(template).filter('#structure_product').html();
        var render = Mustache.render(t, view);
        $("#" + this.CONFIG.product_structure_id).html(render)
        this.create_dropdown(this.CONFIG.product_dropdown_id)

        // create map
        var view = { select_a_product: "Select a product"}
        var t = $(template).filter('#structure_map').html();
        var render = Mustache.render(t, view);
        $("#" + this.CONFIG.map_structure_id).html(render)
        this.create_map(this.CONFIG.map_id)

        // create chart div
        var t = $(template).filter('#structure_chart').html();
        $("#" + this.CONFIG.chart_structure_id).html(t)
    };

    FM_ANALYSIS.prototype.create_dropdown = function(id) {
        var url = this.CONFIG.url_search_all_products
        var _this = this;
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                response = (typeof response === 'string')? $.parseJSON(response): response;

                var html = '<option value=""></option>';
                for(var i=0; i < response.length; i++) {
                    html += '<option value="' + response[i] + '">' + response[i] + '</option>';
                }
                $('#' + id).empty();
                $('#' + id).append(html);
                try { $('#' + id).chosen({disable_search_threshold:6, width: '100%'}); } catch (e) {}
                $( "#" + id ).change(function () {
                    var values = $(this).val()
                    if ( values ) {
                        _this.get_all_layers(values);
                    }
                    else {
                        // TODO: remove all layers
                    }
                });
            },
            error : function(err, b, c) {}
        });
    };

    FM_ANALYSIS.prototype.create_map = function(id) {
        var options = {
            plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
            guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
            gui: {disclaimerfao: true }
        }

        var mapOptions = { zoomControl:false,attributionControl: false };
        var m = new FM.Map(id, options, mapOptions);
        m.createMap();

        var layer = {};
        layer.layers = "fenix:gaul0_line_3857"
        layer.layertitle = "Boundaries"
        layer.urlWMS = "http://fenixapps2.fao.org/geoserver-demo"
        layer.styles = "gaul0_line"
        layer.opacity='0.7';
        layer.zindex= 550;
        var l = new FM.layer(layer);
        m.addLayer(l);

        // On Move
        var _m = m;
        var _this = this
        var GFIchk = {};
        GFIchk["lat-" + m.id] = 0;
        GFIchk["lng-" + m.id] = 0;
        GFIchk["globalID-" + m.id] = 0;
        m.map.on('mousemove', function (e) {
            var id = Date.now();
            GFIchk["globalID-" + _m.id] = id;
            var t = setTimeout(function() {
                if ( id == GFIchk["globalID-" + _m.id]) {
                    //console.log(e);
                    if ((GFIchk["lat-" + _m.id] != e.latlng.lat) && (GFIchk["lng-" + _m.id] != e.latlng.lng)) {
                        GFIchk["lat-" + _m.id] = e.latlng.lat;
                        GFIchk["lng-" + _m.id] = e.latlng.lng;
                        // call callback
                        _this.query_products(_this.CONFIG.cached_layers, e.latlng.lat, e.latlng.lng)
                    }
                }
            }, 100);
        });
        m.map.on('mouseout', function (e) {
            GFIchk["lat-" + m.id] = 0;
            GFIchk["lng-" + m.id] = 0;
            GFIchk["globalID-" + m.id] = 0;

            // TODO: remove chart
        });

        // TODO: on click
        //this.query_products(_this.CONFIG.cached_layers, e.latlng.lat, e.latlng.lng)


        // caching map
        this.CONFIG.m = m;
    };

    FM_ANALYSIS.prototype.get_all_layers = function(ids) {
        var m =  this.CONFIG.m;
        // TODO: real caching of the layers, not calling every time
        for ( var i=0; i < this.CONFIG.cached_layers.length; i++) {
            m.removeLayer(this.CONFIG.cached_layers[i].map_layer)
        }

        // TODO: remove old layers from cached_layers
        this.CONFIG.cached_layers = []

        for ( var i=0; i < ids.length; i++) {
            var url = this.CONFIG.url_search_layer_product_type
            var t = {
                PRODUCT: ids[i],
                TYPE: "none"
            };
            //var url = "http://168.202.28.214:5005/search/layer/product/EARTHSTAT"
            url = Mustache.render(url, t);
            this.get_layers(url, m, ids[i])
        }
    }

    FM_ANALYSIS.prototype.get_layers = function(url, m, id) {
        var _id = id;
        var _this = this
        $.ajax({
            type: 'GET',
            url: url,
            success: function (response) {

                var json = _this.CONFIG.cached_layers;
                console.log(json);
                var changed = false;
                for( var k = 0; k < json.length; k++ ) {
                    if( _id == json[k].id ) {
                        changed = true
                        _this.CONFIG.cached_layers[k].layers = response;
                    }
                }
                var map_layer = _this.add_layer(m, response[response.length-1])
                if ( !changed ) {
                    console.log("HERE");
                    _this.CONFIG.cached_layers.push({
                        "id": _id,
                        "layers": response,
                        "map_layer" : map_layer
                    })
                }
            },
            error: function (err, b, c) {
            }
        });
    }

    FM_ANALYSIS.prototype.add_layer = function(m, layer_def) {
        console.log(layer_def);
        var layer = {};
        layer.layers = layer_def.uid
        layer.layertitle = layer_def.title[this.CONFIG.lang.toLocaleUpperCase()]
        layer.urlWMS = this.CONFIG.url_geoserver_wms
        var l = new FM.layer(layer);
        m.addLayer(l);
        return l;
    }

    FM_ANALYSIS.prototype.query_products = function(cached_layers, lat, lon) {

        //this.loading_html(this.CONFIG.chart_id)
        // create chart
        console.log("here1");
        var chart = this.create_empty_chart(this.CONFIG.chart_id)
        console.log("here");


        for (var i=0; i<cached_layers.length; i++) {
            var url = this.CONFIG.url_stats_rasters_lat_lon;

            // parse layers to get uids
            var uids = ""
            for( var j=0; j< cached_layers[i].layers.length; j++) {
                uids += cached_layers[i].layers[j].uid + ","
            }
            uids = uids.slice(0,-1)
            var t = { LAT: lat,LON: lon, LAYERS: uids };
            url = Mustache.render(url, t);

            // query the product layers
            this.query_product_layers(url, chart, cached_layers[i])
        }
    }

    FM_ANALYSIS.prototype.query_product_layers = function(url, chart, cached_layer) {
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                var values = []
                for(var i=0; i< response.length; i++) {
                    try {
                        //console.log(cached_layer.layers[i].meContent.seCoverage.coverageTime.from);
                        var date = cached_layer.layers[i].meContent.seCoverage.coverageTime.from;
                        // TODO: check how MOngoDB stores the dates
                        date = (date.$date)? date.$date: date * 1000;
                        var value = [date, parseFloat(response[i])]
                        values.push(value)
//                        var value = [i, parseFloat(response[i])]
//                        values.push(value)
                    }
                    catch (e) { console.error("Error parsing the chart value: " + e);}
                }
                var serie = {
                    name : cached_layer.id,
                    data : values
                    //lineWidth: 0
                    //type : "scatter"
                }
                console.log(serie);
                chart.addSeries(serie, true);
            },
            error : function(err, b, c) {}
        });

    }

    FM_ANALYSIS.prototype.create_empty_chart = function(id) {
        console.log(id);
        var _this = this;
        var p = $.parseJSON(chart_template);
        console.log(p);
        var custom_p = {
            chart: {
                renderTo: id,
                ignoreHiddenSeries : false
            },
            title: {
                text: 'Timeserie of the selected pixel',
                "enabled": true,
                style: {
                    fontFamily: 'Roboto',
                    color: '#31708f',
                    fontSize: '15px'
                }
            },
            xAxis: {
                "minTickInterval": 3600 * 1000
            },
            series: []
        };
        custom_p = $.extend(true, {}, p, custom_p);
        console.log(p);
        console.log(custom_p);
        return new Highcharts.Chart(custom_p);
    }

    FM_ANALYSIS.prototype.loading_html = function(id) {
        var t = $(template).filter('#structure_loading').html();
        var render = Mustache.render(t);
        $("#" + id).html(render)
    }

    return FM_ANALYSIS;
});