define(['jquery',
    'mustache',
    'text!../../html/distribution/distribution.html',
    'loglevel',
    'fenix-map',
    'fenix-map',
    'highcharts',
    'bootstrap'], function ($, Mustache, templates, log) {

    var global = this;
    global.Distribution = function() {

        var loadingWindow;
        loadingWindow = loadingWindow || (function () {
            var pleaseWaitDiv = $('' +
                '<div class="modal" id="pleaseWaitDialog" style="background-color: rgba(54, 25, 25, 0.1);" data-backdrop="static" data-keyboard="false">' +
                '<div class="modal-body text-success"><h1>Processing...</h1><i class="fa fa-refresh fa-spin fa-5x"></i></div>' +
                '</div>');
            return {
                showPleaseWait: function() {
                    pleaseWaitDiv.modal();
                },
                hidePleaseWait: function () {
                    pleaseWaitDiv.modal('hide');
                }
            };
        })();

        var CONFIG = {
            lang: 'EN',
            placeholder: 'main_content_placeholder',
            template_id: 'map',

            url_geoserver_wms: 'http://168.202.28.214:9090/geoserver/wms',

            url_search_all_products: "http://168.202.28.214:5005/search/layer/distinct/layers/",

            url_search_layer_product: "http://168.202.28.214:5005/search/layer/product/",

            url_spatialquery: "http://168.202.28.214:5005/spatialquery/db/spatial/",

            // default layer and map
            m : null,
            l : null,

            l_gaul0_highlight: null,

            // distribution query
            url_distribution_raster: "http://168.202.28.214:5005/distribution/raster/spatial_query",
            spatial_query: '{ "query_extent" : "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), {{SRID}})) FROM {{SCHEMA}}.gaul0_3857 WHERE adm0_code IN ({{CODES}})", "query_layer" : "SELECT * FROM {{SCHEMA}}.gaul0_3857 WHERE adm0_code IN ({{CODES}})"}'


//            url_distribution_raster: "http://localhost:5005/distribution/raster/{{LAYERS}}/spatial_query/{{SPATIAL_QUERY}}",
//            spatial_query: '{"vector":{ "query_extent" : "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), {{SRID}})) FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})", "query_layer" : "SELECT * FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})"}}'

        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            console.log($("#ew_chart_title").text())

            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                build_dropdown_products('pgeo_dist_prod')

                build_dropdown_gaul('pgeo_dist_areas')

                // build map
                build_map('pgeo_dist_map')

                 $("#pgeo_dist_export_button").bind( "click", function() {
                     var areas = $("#pgeo_dist_areas_select").chosen().val();
                     var uids =  $("#pgeo_dist_layers_select").chosen().val();
                     if ( uids[0] == "") uids.splice(0, 1)
                     var codes = get_string_codes(areas)
                     var email_address = $("#pgeo_dist_email_address").val();
                     export_layers(uids, codes, email_address)
                });
            });
        }

        var build_dropdown_products = function(id) {
            var url = CONFIG.url_search_all_products
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
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

                    $( "#" + dropdowndID ).change(function () {
                        build_dropdown_layers("pgeo_dist_layers_select",$(this).val())
                    });
                },
                error : function(err, b, c) {}
            });
        }

        var build_dropdown_layers = function(id, product) {
            var url = CONFIG.url_search_layer_product + product;
            $("#" + id).empty()
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var html = '<option value=""></option>';
                    for(var i=0; i < response.length; i++) {
                        html += '<option value="' + response[i].uid + '">' + response[i].title[CONFIG.lang.toLocaleUpperCase()] + '</option>';
                    }
                    $('#' + id).append(html);
                    $('#' + id).trigger("chosen:updated");

                    $( "#" + id ).change(function () {
                        var values = $(this).val()
                        if ( CONFIG.l ) {
                            CONFIG.m.removeLayer(CONFIG.l)
                        }
                        if ( values ) {
                            var layer = {};
                            layer.layers = values[values.length - 1]
                            layer.layertitle = values[values.length - 1]
                            layer.urlWMS = CONFIG.url_geoserver_wms
                            layer.opacity = '1';
                            layer.defaultgfi = true;
                            layer.openlegend = true;
                            CONFIG.l = new FM.layer(layer);
                            CONFIG.m.addLayer(CONFIG.l);
                        }
                    });

                    console.log("#" + id);
                    var select_all = id.replace("_select", "_select_all")
                    var deselect_all = id.replace("_select", "_deselect_all")
                    $("#"+ select_all ).bind("click", function() {
                        $("#" + id + ">option").prop('selected', true);
                        $('#' + id).trigger("chosen:updated");
                    });

                    $("#" + deselect_all).bind("click", function() {
                        $("#" + id + ">option").prop('selected', false);
                        $('#' + id).trigger("chosen:updated");
                    });
                },
                error : function(err, b, c) {}
            });
        }

        var build_dropdown_gaul = function(id) {
            var query = "SELECT adm0_code, adm0_name FROM spatial.gaul0_3857 WHERE disp_area = 'NO' ORDER BY adm0_name"
            var url = CONFIG.url_spatialquery + query
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var dropdowndID = id + "_select"
                    var html = '<select id="'+ dropdowndID+'"  multiple="" style="width:100%;">';
                    html += '<option value=""></option>';
                    for(var i=0; i < response.length; i++) {
                        html += '<option value="' + response[i][0] + '">' + response[i][1] + '</option>';
                    }
                    html += '</select>';

                    $('#' + id).empty();
                    $('#' + id).append(html);

                    try {
                        $('#' + dropdowndID).chosen({disable_search_threshold:6, width: '100%'});
                    }  catch (e) {}

                    $( "#" + dropdowndID ).change(function () {
                        var values = $(this).val()
                        if ( values ) {
                            var codes = get_string_codes(values)
                            CONFIG.l_gaul0_highlight.layer.cql_filter = "adm0_code IN (" + codes + ")";
                            CONFIG.l_gaul0_highlight.redraw()
                            zoom_to(codes)
                        }
                        else {
                            CONFIG.l_gaul0_highlight.layer.cql_filter = "adm0_code IN ('0')";
                            CONFIG.l_gaul0_highlight.redraw()
                            // TODO: reset zoom
                        }
                    });
                },
                error : function(err, b, c) {}
            });
        }

        var build_map = function(id) {
            var options = {
                plugins: { geosearch : true, mouseposition: false, controlloading : true, zoomControl: 'bottomright'},
                guiController: { overlay : true,  baselayer: true,  wmsLoader: true },
                gui: {disclaimerfao: true }
            }

            var mapOptions = { zoomControl:false, attributionControl: false };
            CONFIG.m = new FM.Map(id, options, mapOptions);
            CONFIG.m.createMap();

            var layer = {};
            layer.layers = "gaul0_3857_test"
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
            layer.urlWMS = "http://fenix.fao.org/geo"
            layer.styles = "gaul0_line"
            layer.opacity='0.7';
            layer.zindex= 550;
            CONFIG.l_gaul0 = new FM.layer(layer);
            CONFIG.m.addLayer(CONFIG.l_gaul0);
        }

        var collector_to_build_stats = function() {
            var gaul = $("#ew_drowdown_gaul_select").chosen().val();
            var threshold = $("#ew_threshold").val();
            // TODO: check threshold
            // TODO: function
            if ( CONFIG.l.layer.layers && gaul.length > 0) {
                build_stats(CONFIG.l.layer.layers, gaul, threshold, "ew_stats")
            }
        }

        var export_layers = function(uids, codes, email_address) {
            loadingWindow.showPleaseWait()
            var url = CONFIG.url_distribution_raster
            var spatial_query = CONFIG.spatial_query
            spatial_query = spatial_query.replace(/{{CODES}}/gi, codes)
            var data = {
                "raster" : {
                    "uids" : uids
                },
                "vector" : spatial_query
            }
            // TODO: check if is a valid email address
            if (email_address != "") {
                data.email_address = email_address
            }
            $.ajax({
                type : 'POST',
                url : url,
                data: JSON.stringify(data),
                contentType: 'application/json;charset=UTF-8',
                success : function(response) {
                    loadingWindow.hidePleaseWait()
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    window.open(response.url,'_blank');
                },
                error : function(err, b, c) {
                    loadingWindow.hidePleaseWait()
                    console.log(err);
                }
            });
        }

        var zoom_to = function(codes) {
            var query = "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), 4326)) FROM spatial.gaul0_3857 WHERE adm0_code IN ("+ codes +")"
            var url = CONFIG.url_spatialquery
            url += query;
            $.ajax({
                type : 'GET',
                url : url,
                success : function(response) {
                    response = (typeof response == 'string')? $.parseJSON(response): response;
                    var polygon = $.parseJSON(response[0][0])
                    var coordinates = polygon.coordinates;
                    var minlat = coordinates[0][0][1]
                    var minlon = coordinates[0][0][0]
                    var maxlat = coordinates[0][1][1]
                    var maxlon = coordinates[0][2][0]
                    CONFIG.m.map.fitBounds([
                        [minlat, minlon],
                        [maxlat, maxlon]
                    ]);
                },
                error : function(err, b, c) {
                    alert(err)
                }
            });
        }

        var get_string_codes = function(values) {
            var codes= ""
            for( var i=0; i < values.length; i++) {
                codes += "'"+ values[i] +"',"
            }
            return codes.substring(0, codes.length - 1);
        }

        var get_string_uids = function(values) {
            var codes= ""
            for( var i=0; i < values.length; i++) {
                codes += "" + values[i] +";"
            }
            return codes.substring(0, codes.length - 1);
        }

        // public instance methods
        return {
            build: build
        };
    };

});