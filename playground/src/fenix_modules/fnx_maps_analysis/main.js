define(['jquery',
    'mustache',
    'text!fnx_maps_analysis/html/template.html',
    'fenix-map',
    'chosen',
    'bootstrap'], function ($, Mustache, template) {

    'use strict';

    function FM_ANALYSIS() {
        this.CONFIG = {
            lang : 'en',

            "placeholder"   : "main_content_placeholder",

            "product_structure_id": "pgeo_analysis_product_id",
            "map_structure_id"    : "pgeo_analysis_map_id",
            "chart_structure_id"  : "pgeo_analysis_chart_id",

            "product_dropdown_id" : "pgeo_analysis_product_select",
            "map_id" : "pgeo_analysis_map"
        };
    }

//    http://168.202.28.214:5005/stats/raster/fenix:trmm_04_2014,fenix:trmm_05_2014/lat/12/lon/42

    FM_ANALYSIS.prototype.init = function(config) {
        this.CONFIG = $.extend(true, {}, this.CONFIG, config);
        console.log(this.CONFIG);

        var t = $(template).filter('#structure').html();
        $("#" + this.CONFIG.placeholder).html(t)

        this.create_gui()
    };

    FM_ANALYSIS.prototype.create_gui = function() {
        console.log("here");

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
    };

    FM_ANALYSIS.prototype.create_dropdown = function(id) {
        var url = this.CONFIG.url_search_all_products
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

        this.CONFIG.m = m;
    };

    FM_ANALYSIS.prototype.query_layers = function(id) {

    }

    return FM_ANALYSIS;
});