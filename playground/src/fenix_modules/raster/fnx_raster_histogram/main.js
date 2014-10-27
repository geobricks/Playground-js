define(['jquery',
    'text!fnx_maps_raster_compare/html/template.html',
    'text!fnx_maps_raster_compare/config/histogram_template.json',
    'FNX_MAPS_LOADING_WINDOW',
    'highcharts',], function ($, template, chart_template, loadingwindow) {

    'use strict';

    function FNX_RASTER_HISTOGRAM() {
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

    FNX_RASTER_HISTOGRAM.prototype.init = function(obj) {
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

    FNX_RASTER_HISTOGRAM.prototype.build_dropdown_products = function(id, layer_dd_ID, mapObj) {
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

    return FNX_RASTER_HISTOGRAM;
});