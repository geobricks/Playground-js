define(['jquery',
    'mustache',
    'text!fnx_maps_analysis/html/template.html',
    'text!fnx_maps_analysis/config/chart_template.json',
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

            "chart_id" : "pgeo_analysis_chart"
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
                    console.log($(this).val());

                    // get all layers of the selected product

                    _this.get_all_layers();

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
                        _this.query_layers(_this.CONFIG.uids_to_query, e.latlng.lat, e.latlng.lng)
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

        this.CONFIG.m = m;
    };

    FM_ANALYSIS.prototype.get_all_layers = function(id) {
        var url = this.CONFIG.url_search_layer_product_type
        var t = {
            PRODUCT: "TRMM",
            TYPE: "none"
        };
        url = Mustache.render(url, t);
        var _this = this;
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                var uids = ""
                for(var i=0; i< response.length; i++) {
                    uids += response[i].uid + ","
                }
                uids = uids.slice(0,-1)
                _this.CONFIG.uids_to_query = uids;
                //_this.query_layers(ids, 12, 42)
            },
            error : function(err, b, c) {}
        });
    }

    FM_ANALYSIS.prototype.query_layers = function(uids, lat, lon) {
        var url = this.CONFIG.url_stats_rasters_lat_lon;
        var _this = this;
        var t = { LAT: lat,LON: lon, LAYERS: uids };
        url = Mustache.render(url, t);

        this.loading_html(this.CONFIG.chart_id)
        $.ajax({
            type : 'GET',
            url : url,
            success : function(response) {
                var values = []
                for(var i=0; i< response.length; i++) {
                    values.push(parseFloat(response[i]))
                }
                _this.create_chart(_this.CONFIG.chart_id, values);
            },
            error : function(err, b, c) {}
        });
    }

    FM_ANALYSIS.prototype.create_chart = function(id, data) {
        var c = {}
        c.chart = { "renderTo" : id}
        c.yAxis = [{title: { text: ''}}]
        var categories = []
        var series = []
        var serie = {
            name: 'data',
            type: 'line',
            data: data
        }
        series.push(serie)
        c.series = series;
        c.xAxis = []
        c.xAxis.push( {categories : categories,labels: { rotation: -45, style: { fontSize: '11px',fontFamily: 'Roboto'}}})

        var ct = $.parseJSON(chart_template);
        c = $.extend(true, {}, ct, c);
        var c = new Highcharts.Chart(c);
    }

    FM_ANALYSIS.prototype.loading_html = function(id) {
        var t = $(template).filter('#structure_loading').html();
        var render = Mustache.render(t);
        $("#" + id).html(render)
    }

    return FM_ANALYSIS;
});