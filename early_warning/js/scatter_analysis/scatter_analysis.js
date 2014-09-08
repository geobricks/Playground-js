define(['jquery',
    'mustache',
    'text!../../html/scatter_analysis/scatter_analysis.html',
    'loglevel',
    'fenix-map',
    'highcharts',
    'bootstrap',
    'FMChartScatter'], function ($, Mustache, templates, log) {

    var global = this;
    global.Scatter_Analysis = function() {

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

            url_stats_scatter_analysis : "http://168.202.28.214:5005/stats/rasters/scatter_analysis/",

            // default layer and map
            m : null,
            l : null,

            l_gaul0_highlight: null,

            // distribution query
            url_distribution_raster: "http://168.202.28.214:5005/distribution/raster/spatial_query",
            spatial_query: '{ "type" : "database", "query_extent" : "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), {{SRID}})) FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})", "query_layer" : "SELECT * FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})"}',


//            url_distribution_raster: "http://localhost:5005/distribution/raster/{{LAYERS}}/spatial_query/{{SPATIAL_QUERY}}",
//            spatial_query: '{"vector":{ "query_extent" : "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), {{SRID}})) FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})", "query_layer" : "SELECT * FROM {{SCHEMA}}.gaul0_3857_test WHERE adm0_code IN ({{CODES}})"}}'

            json_stats : {
                "raster": {
                    "name": null,
                    "uid": null
                },
                "vector": {
                    "name": "gaul1",
                    "type": "database",
                    "options": {
                        "query_condition": {
                            "select": "adm1_code, adm1_name",
                            "from": "{{SCHEMA}}.gaul1_3857_test",
                            "where": "adm0_code IN ({{ADM0_CODE}}) GROUP BY adm1_code, adm1_name ORDER BY adm1_name"
                        },
                        "column_filter": "adm1_code",
                        "stats_columns": {
                            "polygon_id": "adm1_code",
                            "label_en": "adm1_name"
                        }
                    }
                },
                "stats": {
                    "raster_stats": {
                        "descriptive_stats": {
                            "force": true
                        }
                    }
                }
            }
        }

        var build = function(config) {
            CONFIG = $.extend(true, {}, CONFIG, config);

            console.log($("#ew_chart_title").text())

            require(['i18n!nls/translate'], function (translate) {
                var template = $(templates).filter('#' + CONFIG.template_id).html();
                $('#' + CONFIG.placeholder).html(templates);

                build_dropdown_products('pgeo_dist_prod1', 'pgeo_dist_layers_select1')
                build_dropdown_products('pgeo_dist_prod2', 'pgeo_dist_layers_select2')

                build_dropdown_gaul('pgeo_dist_areas')

                // build map
                //build_map('pgeo_dist_map')

                $("#pgeo_dist_analysis_button").bind( "click", function() {
                    var areas = $("#pgeo_dist_areas_select").chosen().val();
                    var uids = []
                    uids.push($("#pgeo_dist_layers_select1").chosen().val())
                    uids.push($("#pgeo_dist_layers_select2").chosen().val());
                    if ( uids[0] == "")
                        uids.splice(0, 1)
                    var codes = get_string_codes(areas)
//                    var email_address = $("#pgeo_dist_email_address").val();
                    scatter_analysis(uids, codes)
                });
            });
        }

        var build_dropdown_products = function(id, layer_dd_ID) {
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
                        build_dropdown_layers(layer_dd_ID, $(this).val())
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
                            layer.opacity = '0.8';
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
            var query = "SELECT adm0_code, adm0_name FROM spatial.gaul0_3857_test WHERE disp_area = 'NO' ORDER BY adm0_name"
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

        var scatter_analysis = function(uids, codes) {
            //loadingWindow.showPleaseWait()

            var json_stats = JSON.parse(JSON.stringify(CONFIG.json_stats));
            json_stats.raster.uids = uids
            json_stats.raster.name = "scatter"
            json_stats.vector.options.query_condition.where = json_stats.vector.options.query_condition.where.replace("{{ADM0_CODE}}", codes)
            console.log(json_stats);
            var url = CONFIG.url_stats_scatter_analysis
            $.ajax({
                type : 'POST',
                url : url,
                data: JSON.stringify(json_stats),
                contentType: 'application/json;charset=UTF-8',
                success : function(response) {
                    //build_stats_response(response, threshold, output_id)
                    console.log(response);
                    createScatter(response, "")

                    //create_chart_stats(LAYERS, STATS)

                },
                error : function(err, b, c) {
                    console.log(err);
                }
            });
        }

        var zoom_to = function(codes) {
            var query = "SELECT ST_AsGeoJSON(ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), 4326)) FROM spatial.gaul0_3857_test WHERE adm0_code IN ("+ codes +")"
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

        var createScatter =  function(csv, obj) {
            console.log(csv);

            var c = new FMChartScatter();

            $("#pgeo_dist_chart").empty()
            $("#pgeo_dist_map").empty()
            var chartID = "pgeo_dist_chart"
            var mapID = "pgeo_dist_map"


            // to handle multiple maps
            var mapsArray = [];

            // single map
            var map = {};
            // to handle multiple layers

            var fenixMap = createMap(mapID);
            var l = createLayer();

            map.id = mapID;
            map.fenixMap = fenixMap;
            map.layers = [];
            map.layers.push({ l: l});
            mapsArray.push(map);

            c.init({
                chart : { data : csv, id : chartID, datatype: 'csv',  chart_title: obj.title },
                maps: mapsArray
            });

        }

        var createMap = function(mapID) {
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

            var layer = {};
            layer.layers = 'fenix:gaul0_line_3857'
            layer.layertitle = 'Country Boundaries'
            layer.urlWMS = 'http://fenixapps.fao.org/geoserver'
            layer.opacity='1';
            var l = new FM.layer(layer);
            //l.zindex = 124
            m.addLayer(l);

            return m;
        }

        var createLayer = function() {
            var layer = FMDEFAULTLAYER.getLayer("GAUL1", true)
            layer.layertitle="Scatter layer x/y"
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
            //layer.geometrycolumn = 'the_geom'
            layer.intervals='5';
            //layer.colors='965a00,e88a00,f3ab2d';
            layer.colors='33CCff,00CCFF,0099FF,0066FF,0000FF';

            //layer.colors='680000,D80000,FFFF00,00CC33,009900';
            //layer.colors='FF0AFF,FF1EFF,D700D7,CD00CD';


            layer.formula = '(series[i].data[j].x / series[i].data[j].y)';
            //layer.formula = '';
            //layer.formula = '(series[i].data[j].y)';
            layer.reclassify = false;

            var l = new FM.layer(layer);
            return l
        }

        // public instance methods
        return {
            build: build
        };
    };

});